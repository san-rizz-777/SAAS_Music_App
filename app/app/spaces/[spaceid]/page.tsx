"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { use } from "react";
import StreamView from "@/components/StreamView";
import StreamView2 from "@/components/StreamView2";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/components/ErrorScreen";

export default function SpacePage({ params }: { params: Promise<{ spaceid: string }> }) {
    const { spaceid } = use(params);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [creatorId, setCreatorId] = useState<string>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (status === "loading") return;
        if (status === "unauthenticated") { router.push("/auth"); return; }

        async function fetchSpace() {
            try {
                const res = await fetch(`/api/spaces?spaceId=${spaceid}`);
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.message ?? "Space not found");
                setCreatorId(data.hostId);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchSpace();
    }, [spaceid, status]);

    if (status === "loading" || loading) return <LoadingScreen />;
    if (error) return <ErrorScreen>{error}</ErrorScreen>;
    if (!session?.user) return <ErrorScreen>Please log in</ErrorScreen>;
    if (!creatorId) return <ErrorScreen>Space not found</ErrorScreen>;

    if (creatorId === session.user.id) {
        router.push(`/dashboard/${spaceid}`);
        return null;
    }

    return <StreamView2 creatorId={creatorId} spaceId={spaceid} playVideo={false} />;
}