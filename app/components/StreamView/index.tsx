"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { useSession } from "next-auth/react";
import NowPlaying from "./NowPlaying";
import Queue from "./Queue";
import AddSongForm from "./AddSongForm";
import { Appbar } from "../Appbar";

type Video = {
    id: string;
    extractedId: string;
    title_: string;
    smallImg: string;
    bigImg: string;
    upvotes: { userId: string }[];
    played: boolean;
};

export default function StreamView({
                                       creatorId,
                                       playVideo = false,
                                       spaceId,
                                   }: {
    creatorId: string;
    playVideo: boolean;
    spaceId: string;
}) {
    const [inputLink, setInputLink] = useState("");
    const [queue, setQueue] = useState<Video[]>([]);
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(false);
    const [playNextLoader, setPlayNextLoader] = useState(false);
    const [spaceName, setSpaceName] = useState("");

    const user = useSession().data?.user;

    // ── fetch streams + current ──────────────────────────────
    async function refreshStreams() {
        try {
            const res = await fetch(`/api/streams?creatorId=${creatorId}&spaceId=${spaceId}`);
            const json = await res.json();

            setQueue(
                (json.streams ?? []).sort(
                    (a: Video, b: Video) => b.upvotes.length - a.upvotes.length
                )
            );

            setCurrentVideo(json.currentStream?.stream ?? null);
        } catch {
            enqueueToast("error", "Failed to load streams");
        }
    }

    // ── poll every 5 seconds ─────────────────────────────────
    useEffect(() => {
        refreshStreams();
        const id = setInterval(refreshStreams, 5000);
        return () => clearInterval(id);
    }, [creatorId, spaceId]);

    // ── play next ────────────────────────────────────────────
    async function playNext() {
        setPlayNextLoader(true);
        try {
            await fetch(`/api/next?spaceId=${spaceId}`);
            await refreshStreams();
        } catch {
            enqueueToast("error", "Failed to play next");
        } finally {
            setPlayNextLoader(false);
        }
    }

    function enqueueToast(type: "error" | "success", message: string) {
        type === "error" ? toast.error(message, { duration: 5000 }) : toast.success(message, { duration: 5000 });
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Appbar isSpectator={!playVideo} />
            {spaceName && (
                <div className="mx-auto rounded-lg p-2 bg-gradient-to-r from-indigo-600 to-violet-800 text-2xl font-bold">
                    {spaceName}
                </div>
            )}
            <div className="flex justify-center">
                <div className="grid w-screen max-w-screen-xl grid-cols-1 gap-4 pt-8 md:grid-cols-5">
                    <Queue
                        creatorId={creatorId}
                        isCreator={playVideo}
                        queue={queue}
                        userId={user?.id || ""}
                        spaceId={spaceId}
                        onRefresh={refreshStreams}
                    />
                    <div className="col-span-2">
                        <div className="mx-auto w-full max-w-4xl space-y-6 p-4">
                            <AddSongForm
                                creatorId={creatorId}
                                userId={user?.id || ""}
                                enqueueToast={enqueueToast}
                                inputLink={inputLink}
                                loading={loading}
                                setInputLink={setInputLink}
                                setLoading={setLoading}
                                spaceId={spaceId}
                                onSongAdded={refreshStreams}
                            />
                            <NowPlaying
                                currentVideo={currentVideo}
                                playNext={playNext}
                                playNextLoader={playNextLoader}
                                playVideo={playVideo}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
