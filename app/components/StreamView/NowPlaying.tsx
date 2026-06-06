"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
// @ts-ignore
import YouTubePlayer from "youtube-player";
import Image from "next/image";

type Video = {
    id: string;
    extractedId: string;
    title_: string;
    bigImg: string;
};

type Props = {
    playVideo: boolean;
    currentVideo: Video | null;
    playNextLoader: boolean;
    playNext: () => void;
};

export default function NowPlaying({ playVideo, currentVideo, playNext, playNextLoader }: Props) {
    const videoPlayerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!videoPlayerRef.current || !currentVideo) return;

        const player = YouTubePlayer(videoPlayerRef.current);
        player.loadVideoById(currentVideo.extractedId);
        player.playVideo();

        function eventHandler(event: any) {
            if (event.data === 0) {
                playNext(); // auto play next when video ends
            }
        }

        player.on("stateChange", eventHandler);
        return () => { player.destroy(); };
    }, [currentVideo]);

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Now Playing</h2>
            <Card>
                <CardContent className="p-4">
                    {currentVideo ? (
                        <div>
                            {playVideo ? (
                                <div ref={videoPlayerRef} className="w-full" />
                            ) : (
                                <>
                                    <Image
                                        height={288}
                                        width={512}
                                        alt={currentVideo.title_}
                                        src={currentVideo.bigImg}
                                        className="h-72 w-full rounded object-cover"
                                    />
                                    <p className="mt-2 text-center font-semibold">
                                        {currentVideo.title_}
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <p className="py-8 text-center">No video playing</p>
                    )}
                </CardContent>
            </Card>
            {playVideo && (
                <Button disabled={playNextLoader} onClick={playNext} className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    {playNextLoader ? "Loading..." : "Play Next"}
                </Button>
            )}
        </div>
    );
}
