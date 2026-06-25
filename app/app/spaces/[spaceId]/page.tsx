"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {useSocket} from "@/context/socket-context";
import StreamView from "@/components/StreamView";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/components/ErrorScreen";
import jwt from "jsonwebtoken";

export default function SpacePage({ params: { spaceId } }: { params: { spaceId: string } }) {
    //const  spaceId  = params;

    const router = useRouter();
    const [creatorId, setCreatorId] = useState<string>();
    const [loading1, setLoading1] = useState(true);


    const { socket, user, loading, setUser, connectionError } = useSocket();

    console.log(spaceId)

    useEffect(() => {
        async function fetchHostId() {
            try {
                const res = await fetch(`/api/spaces/?spaceId=${spaceId}`, {method: "GET"});
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.message ?? "Space not found");
                setCreatorId(data.hostId);
            } catch (e: any) {
                 console.log(e);
                window.alert(e.message || "Space not found. Please check the link.");
                router.push("/");  // redirect home after alert
            } finally {
                setLoading1(false);
            }
        }
        fetchHostId();
    }, [spaceId]);

    //Triggers render whenever new user enters or socket changes or space or creator
    useEffect(() => {
        if(user && socket && creatorId)
        {
            const token = user.token || jwt.sign({
                creatorId: creatorId,
                userId: user?.id,
            },
                process.env.NEXT_PUBLIC_SECRET || "",
                {
                    expiresIn: "24h",
                }
                );

            socket?.send(
                JSON.stringify({
                    type: "join-room",
                    data:{
                        token , spaceId
                    },
                })
            );

            if(!user.token){
                setUser({...user, token});
            }
        }
    }, [user, socket, spaceId, creatorId]);

  if(connectionError)
  {
      return <ErrorScreen>Cannot connect to server!!!</ErrorScreen>
  }

    if (loading || loading1) return <LoadingScreen />;

  if(!user){
      window.alert("Please log in to view this space!");
      router.push("/");
      return null;
      //return <ErrorScreen>Please log in.....</ErrorScreen>;
  }

  ///if the creator id is user id it pushes it to dashboard
    if(creatorId===user.id){
        router.push(`/dashboard/${spaceId}`)
        return null;  //prevents rendering streamview
    }

    return <StreamView creatorId={creatorId as string} playVideo={false} spaceId={spaceId} />;
}


export const dynamic = "auto"