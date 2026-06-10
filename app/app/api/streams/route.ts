import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
//@ts-ignore
import youtubesearchapi from "youtube-search-api";
import { getServerSession } from "next-auth";
import {authOptions} from "@/lib/next-options";
import {YT_REGEX} from "@/lib/utils";


//validation schema
const CreateStreamSchema = z.object({
    creatorId: z.string(),
    url: z.string(),
    spaceId: z.string(), // required by StreamView2
});

const MAX_QUEUE_LEN = 20;

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        //authentication
        if (!session?.user.id) {
            return NextResponse.json(
                {
                    message: "Unauthenticated",
                },
                {
                    status: 403,
                },
            );
        }
        const user = session.user;

        const data = CreateStreamSchema.parse(await req.json());

        if(!data.url.trim()){
            return NextResponse.json({message: "Youtube link cannot be empty!!!"}, {status: 400});
        }

        const isYt = data.url.match(YT_REGEX);
        const videoId = data.url ? data.url.match(YT_REGEX)?.[1] : null;


        if (!isYt || !videoId) {
            return NextResponse.json(
                {
                    message: "Invalid YouTube URL format!!!!",
                },
                {
                    status: 400,
                },
            );
        }

        // Fetch video metadata from YouTube
        const res = await youtubesearchapi.GetVideoDetails(videoId);

        //check if the user is not the creator
        if(user.id !== data.creatorId){
            const tenMinutesAgo = new Date(Date.now() - 10*60*1000);
            const twoMinutesAgo =  new Date(Date.now() - 10*60*1000);

        //getting the users last
        const userRecentStreams = await prisma.stream.count({
            where: {
                userId: data.creatorId,
                addedBy: user.id,
                createAt: {
                    gte: tenMinutesAgo,
                },
            },
        });

            // Check for duplicate song in the last 10 minutes
            const duplicateSong = await prisma.stream.findFirst({
                where: {
                    userId: data.creatorId,
                    extractedId: videoId,
                    createAt: {
                        gte: tenMinutesAgo,
                    },
                },
            });

            if (duplicateSong) {
                return NextResponse.json(
                    {
                        message: "This song was already added in the last 10 minutes",
                    },
                    {
                        status: 429,
                    },
                );
            }

            // Rate limiting checks for non-creator users
            const streamsLastTwoMinutes = await prisma.stream.count({
                where: {
                    userId: data.creatorId,
                    addedBy: user.id,
                    createAt: {
                        gte: twoMinutesAgo,
                    },
                },
            });

            //rate limit exceeding error
            if (streamsLastTwoMinutes >= 6) {
                return NextResponse.json(
                    {
                        message:
                            "Rate limit exceeded: You can only add 6 songs per 2 minutes",
                    },
                    {
                        status: 429,
                    },
                );
            }

            ///for ten minutes timestamp
            if (userRecentStreams >= 12) {
                return NextResponse.json(
                    {
                        message:
                            "Rate limit exceeded: You can only add 12 songs per 10 minutes",
                    },
                    {
                        status: 429,
                    },
                );
            }
        }

        // Sort thumbnails ascending by width; pick second-largest as smallImg
        const thumbnails = res.thumbnail.thumbnails;
        thumbnails.sort((a: { width: number }, b: { width: number }) =>
            a.width < b.width ? -1 : 1,
        );

        ///count the no. of streams at present
        const existingActiveStreams = await prisma.stream.count({
            where: {
                spaceId: data.spaceId,
                played: false,
            },
        });

        //if exceeding the max queue length
        if (existingActiveStreams >= MAX_QUEUE_LEN) {
            return NextResponse.json(
                {
                    message: "Queue is full",
                },
                {
                    status: 429,
                },
            );
        }

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
                userId: data.creatorId,
                addedBy: user.id,
                url: data.url,
                extractedId: videoId,
                type: "Youtube",
                title: res.title ?? "Can't find video!!!",
                smallImg: smallImg,
                bigImg: bigImg,
                spaceId:data.spaceId
            },
        });

        // Return the shape StreamView2 expects when it appends to queue
        return NextResponse.json({
            ...stream,
            hasUpvoted: false,
            upvotes: 0,
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            {
                message: "Error while adding a stream",
            },
            {
                status: 500,
            },
        );
    }
}


export async function GET(req: NextRequest) {
    const session  = await getServerSession(authOptions);
    const spaceId = req.nextUrl.searchParams.get("spaceId");

    if (!session?.user.id) {
        return NextResponse.json(
            {
                message: "Unauthenticated",
            },
            {
                status: 403,
            },
        );
    }
    const user = session.user;

    if (!spaceId) {
        return NextResponse.json({
            message: "Error!!! spaceId not found!!!",
        }, {
            status: 411
        })
    }

    const [space, activeStream] = await Promise.all([
        prisma.space.findUnique({
            where: {
                id: spaceId,
            },
            include: {
                streams: {
                    include: {
                        _count: {
                            select: {
                                upvotes: true
                            }
                        },
                        upvotes: {
                            where: {
                                userId: session?.user.id
                            }
                        }

                    },
                    where:{
                        played:false
                    }
                },
                _count: {
                    select: {
                        streams: true
                    }
                },
            },
        }),
        prisma.currentStream.findFirst({
            where: {
                spaceId: spaceId
            },
            include: {
                stream: true
            }
        })
    ]);

    //get the hostId and checks if it is creator
    const hostId =space?.hostId;
    const isCreator = session.user.id=== hostId;

    return NextResponse.json({
        streams: space?.streams.map(({_count, ...rest}) => ({
            ...rest,
            upvotes: _count.upvotes,
            haveUpvoted: !!rest.upvotes.length, /// !!true -> !false -> true type thing
        })),
        activeStream,
        hostId,
        isCreator,
        spaceName:space?.name
    });
}