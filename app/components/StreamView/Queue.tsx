"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Share2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAutoAnimate } from "@formkit/auto-animate/react";

type Video = {
    id: string;
    title_: string;
    smallImg: string;
    upvotes: { userId: string }[];
    haveUpvoted?: boolean;
};

type Props = {
    queue: Video[];
    creatorId: string;
    userId: string;
    isCreator: boolean;
    spaceId: string;
    onRefresh: () => void;
};

export default function Queue({ queue, isCreator, userId, spaceId, onRefresh }: Props) {
    const [isEmptyQueueDialogOpen, setIsEmptyQueueDialogOpen] = useState(false);
    const [parent] = useAutoAnimate();

    async function handleVote(streamId: string, isUpvote: boolean) {
        try {
            await fetch(`/api/${isUpvote ? "upvotes" : "downvotes"}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ streamId }),
            });
            onRefresh();
        } catch (e) {
            toast.error("Failed to vote");
        }
    }

    async function removeSong(streamId: string) {
        try {
            await fetch(`/api/streams?streamId=${streamId}`, { method: "DELETE" });
            onRefresh();
        } catch (e) {
            toast.error("Failed to remove song");
        }
    }

    async function emptyQueue() {
        try {
            await fetch(`/api/empty-queue?spaceId=${spaceId}`, { method: "DELETE" });
            onRefresh();
        } catch (e) {
            toast.error("Failed to empty queue");
        } finally {
            setIsEmptyQueueDialogOpen(false);
        }
    }

    function handleShare() {
        const link = `${window.location.origin}/spaces/${spaceId}`;
        navigator.clipboard.writeText(link).then(
            () => toast.success("Link copied to clipboard!"),
            () => toast.error("Failed to copy link")
        );
    }

    return (
        <>
            <div className="col-span-3">
                <div className="space-y-4">
                    <div className="flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
                        <h2 className="text-3xl font-bold">Upcoming Songs</h2>
                        <div className="flex space-x-2">
                            <Button onClick={handleShare}>
                                <Share2 className="mr-2 h-4 w-4" /> Share
                            </Button>
                            {isCreator && (
                                <Button onClick={() => setIsEmptyQueueDialogOpen(true)} variant="secondary">
                                    <Trash2 className="mr-2 h-4 w-4" /> Empty Queue
                                </Button>
                            )}
                        </div>
                    </div>

                    {queue.length === 0 && (
                        <Card className="w-full">
                            <CardContent className="p-4">
                                <p className="py-8 text-center">No videos in queue</p>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-4" ref={parent}>
                        {queue.map((video) => {
                            const upvoteCount = video.upvotes.length;
                            const haveUpvoted = video.upvotes.some((u) => u.userId === userId);
                            return (
                                <Card key={video.id}>
                                    <CardContent className="flex items-center space-x-4 p-4">
                                        <Image
                                            height={80}
                                            width={128}
                                            src={video.smallImg}
                                            alt={video.title_}
                                            className="w-32 h-20 rounded object-cover"
                                        />
                                        <div className="flex-grow">
                                            <h3 className="font-semibold">{video.title_}</h3>
                                            <div className="mt-2 flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleVote(video.id, !haveUpvoted)}
                                                    className="flex items-center space-x-1"
                                                >
                                                    {haveUpvoted ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronUp className="h-4 w-4" />
                                                    )}
                                                    <span>{upvoteCount}</span>
                                                </Button>
                                                {isCreator && (
                                                    <Button variant="outline" size="sm" onClick={() => removeSong(video.id)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>

            <Dialog open={isEmptyQueueDialogOpen} onOpenChange={setIsEmptyQueueDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Empty Queue</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to empty the queue? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEmptyQueueDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={emptyQueue} variant="destructive">
                            Empty Queue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
