import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/app/lib/db";
import youtubesearchapi from "youtube-search-api";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";

// ─── Regex ────────────────────────────────────────────────────────────────────
// Matches standard (?v=), short (youtu.be/), embed, and mobile YouTube URLs.
// Playlist params (list=, index=) are allowed — we only care about the video ID.
const YT_REGEX = new RegExp(
    "^(?:https?:\\/\\/)?(?:www\\.)?(?:m\\.)?(?:youtube\\.com\\/(?:watch\\?(?:.*&)?v=|embed\\/|v\\/)|youtu\\.be\\/)([a-zA-Z0-9_-]{11})(?:[?&]\\S+)?$"
);

/** Pull the 11-char video ID from any supported YouTube URL */
function extractYouTubeId(url: string): string | null {
    // For watch URLs, prefer parsing v= directly so order of params doesn't matter
    try {
        const parsed = new URL(url.startsWith("http") ? url : "https://" + url);
        if (
            parsed.hostname.replace("www.", "").replace("m.", "") === "youtube.com" &&
            parsed.pathname === "/watch"
        ) {
            const v = parsed.searchParams.get("v");
            if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
        }
    } catch {
        // fall through to regex for short/embed URLs
    }
    const match = url.match(YT_REGEX);
    return match ? match[1] : null;
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

/** POST /api/streams  — add a song to a space's queue */
const CreateStreamSchema = z.object({
    creatorId: z.string(),
    url: z.string(),
    spaceId: z.string(), // required by StreamView2
});

/** GET /api/streams  — fetch queue + current stream for a space */
// (params come from query string, validated manually below)

// ─── POST ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = CreateStreamSchema.parse(await req.json());

        const extractedId = extractYouTubeId(body.url);
        if (!extractedId) {
            return NextResponse.json(
                { message: "Invalid YouTube URL" },
                { status: 400 }
            );
        }

        // Fetch video metadata from YouTube
        const res = await youtubesearchapi.GetVideoDetails(extractedId);

        if (!res || !res.title) {
            return NextResponse.json(
                { message: "Could not fetch video details" },
                { status: 422 }
            );
        }

        // Sort thumbnails ascending by width; pick second-largest as smallImg
        const thumbnails: { url: string; width: number }[] =
            res.thumbnail?.thumbnails ?? [];
        thumbnails.sort((a, b) => a.width - b.width);

        const FALLBACK_IMG =
            "https://www.shutterstock.com/image-vector/old-computer-browser-90s-404-260nw-2664184569.jpg";

        const smallImg =
            (thumbnails.length > 1
                ? thumbnails.at(-2)?.url
                : thumbnails.at(-1)?.url) ?? FALLBACK_IMG;

        const bigImg = thumbnails.at(-1)?.url ?? FALLBACK_IMG;

        // Persist the stream
        const stream = await prisma.stream.create({
            data: {
                userId: body.creatorId,
                spaceId: body.spaceId,   // ← was missing before
                url: body.url,
                extractedId,
                type: "Youtube",
                title_: res.title,
                smallImg,
                bigImg,
            } as Prisma.StreamUncheckedCreateInput,
        });

        // Return the shape StreamView2 expects when it appends to queue
        return NextResponse.json(
            {
                message: "Added Stream Successfully!",
                id: stream.id,
                type: stream.type,
                url: stream.url,
                extractedId: stream.extractedId,
                title: stream.title_,
                smallImg: stream.smallImg,
                bigImg: stream.bigImg,
                active: stream.active ?? false,
                userId: stream.userId,
                upvotes: 0,
                haveUpvoted: false,
            },
            { status: 201 }  // 201 Created (was wrongly 200 inside a 200 body before)
        );
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Invalid request body", errors: e.flatten() },
                { status: 400 }
            );
        }
        console.error("[POST /api/streams]", e);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const creatorId = searchParams.get("creatorId");
    const spaceId = searchParams.get("spaceId"); // ← was missing before

    if (!creatorId || !spaceId) {
        return NextResponse.json(
            { message: "creatorId and spaceId are required" },
            { status: 400 }
        );
    }

    // Resolve the session user so we can compute haveUpvoted per stream
    const session = await getServerSession();
    const sessionUserId: string | undefined = (session?.user as any)?.id;

    try {
        // Fetch queued (non-active) streams for this space
        const streams = await prisma.stream.findMany({
            where: {
                userId: creatorId,
                spaceId,
                active: false, // active stream is handled separately below
            },
            include: {
                _count: { select: { upvotes: true } },
                // Include only the current user's upvote (if any) to compute haveUpvoted
                upvotes: sessionUserId
                    ? { where: { userId: sessionUserId } }
                    : false,
            },
            orderBy: { id: "asc" },
        });

        // Fetch the currently-playing stream for this space
        const currentStreamRecord = await prisma.currentStream.findFirst({
            where: { spaceId },
            include: {
                stream: true,
            },
        });

        // Shape each queued stream to match the Video interface in StreamView2
        const shapedStreams = streams.map((s: any) => ({
            id: s.id,
            type: s.type,
            url: s.url,
            extractedId: s.extractedId,
            title: s.title_,
            smallImg: s.smallImg,
            bigImg: s.bigImg,
            active: s.active,
            userId: s.userId,
            upvotes: s._count.upvotes,
            haveUpvoted: sessionUserId
                ? (s.upvotes?.length ?? 0) > 0
                : false,
        }));

        return NextResponse.json({
            streams: shapedStreams,
            currentStream: currentStreamRecord ?? null,
        });
    } catch (e) {
        console.error("[GET /api/streams]", e);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}