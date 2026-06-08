"use client";

import { YT_REGEX } from "@/lib/utils";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import {useSocket} from "@/context/socket-context";
import {useConnection} from "@solana/wallet-adapter-react";
import {useSession} from "next-auth/react";

type Props = {
    inputLink: string;
    creatorId: string;
    userId: string;
    setLoading: (value: boolean) => void;
    setInputLink: (value: string) => void;
    loading: boolean;
    enqueueToast: (type: "error" | "success", message: string) => void;
    spaceId: string;
    isSpectator:boolean
};

export default function AddSongForm({
                                        inputLink,
                                        enqueueToast,
                                        setInputLink,
                                        loading,
                                        setLoading,
                                        userId,
                                        creatorId,
                                        spaceId,
                                        isSpectator,
                                    }: Props) {

    const {sendMessage} = useSocket();
    const {connection} = useConnection();
    const user = useSession().data?.user;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputLink.match(YT_REGEX)) {
            enqueueToast("error", "Invalid URL — please use a YouTube link");
            return;
        }
        else{
            setLoading(true);

            // sending back to socket
            sendMessage("add to queue", {
                spaceId, userId, url: inputLink,
            });
        }

        setLoading(false);
        setInputLink("");
    };

    const videoId = inputLink ? inputLink.match(YT_REGEX)?.[1] : undefined;

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Add a song</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
                <Input
                    type="text"
                    placeholder="Paste a YouTube link!!!"
                    value={inputLink}
                    onChange={(e) => setInputLink(e.target.value)}
                />
                <Button
                    disabled={loading}
                    onClick={handleSubmit}
                    type="submit"
                    className="w-full"
                >
                    {loading ? "Loading..." : "Add to Queue"}
                </Button>
            </form>

            {videoId && !loading && (
                <Card>
                    <CardContent className="p-4">
                        <LiteYouTubeEmbed title="" id={videoId} />
                    </CardContent>
                </Card>
            )}
        </>
    );
}
