"use client";

import { YT_REGEX } from "@/app/lib/utils";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import LiteYouTubeEmbed from "react-lite-youtube-embed";

type Props = {
    inputLink: string;
    creatorId: string;
    userId: string;
    setLoading: (value: boolean) => void;
    setInputLink: (value: string) => void;
    loading: boolean;
    enqueueToast: (type: "error" | "success", message: string) => void;
    spaceId: string;
    onSongAdded: () => void; // callback to refresh streams after adding
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
                                        onSongAdded,
                                    }: Props) {

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputLink.match(YT_REGEX)) {
            enqueueToast("error", "Invalid URL — please use a YouTube link");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/streams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    creatorId,
                    url: inputLink,
                    spaceId,
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message ?? "Failed to add song");

            enqueueToast("success", "Song added to queue!");
            setInputLink("");
            onSongAdded(); // refresh the queue
        } catch (error: any) {
            enqueueToast("error", error.message ?? "Error adding song");
        } finally {
            setLoading(false);
        }
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
                    placeholder="Paste a YouTube link"
                    value={inputLink}
                    onChange={(e) => setInputLink(e.target.value)}
                />
                <Button
                    disabled={loading}
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
