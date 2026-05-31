"use client"

import {useEffect, useState} from "react";
import {useSocket} from "@/context/socket-context";
import jwt from "jsonwebtoken"
import StreamView from "@/components/StreamView";
import ErrorScreen from "@/components/ErrorScreen";
import LoadingScreen from "@/components/LoadingScreen";
import {useRouter} from "next/navigation";
import { use } from "react";

// Default styles that can be overridden by the app
import '@solana/wallet-adapter-react-ui/styles.css';

export default function Component({params}: {params:Promise<{spaceid:string}>}) {

    const { spaceid } = use(params);  // unwrap the promise

    ///get the user and socket from custom hook
    const {socket, user, setUser, loading, connectionError} = useSocket();

    const [creatorId, setCreatorId] = useState<string>();
    const [loading_1, setLoading1] = useState<boolean>(true);
    const router = useRouter();

    useEffect(() => {

            async function fetchCreatorId() {
                try {
                    //get the user data at that spaces url
                    const response = await fetch(`/api/spaces?spaceId=${spaceid}`, {
                        method: "GET",
                    });

                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.message || "Failed to fetch space host's ID.");
                    }

                    setCreatorId(data.hostId);
                }
    catch(error) {
            console.log(error);
        }
    finally {
                    setLoading1(false);
                }
        }
        fetchCreatorId();
           ///called it here
    }, [spaceid]) ;  //whenever the spaces id changes


    useEffect(() => {
        if(user && socket && creatorId){
            const token = user?.token || jwt.sign({
                creatorId: creatorId,
                userId: user?.id,
            },
                process.env.NEXT_PUBLIC_SECRET || "secret",
                {
                    expiresIn: "24h",
                }
                );

            ///send the message via socket
            socket?.send(
                JSON.stringify({
                    type: "join-room",
                    data:{
                        token, spaceid
                    }
                })
            );

            if(!user.token)
            {
                setUser({...user, token});
            }

        }
    }, [socket, user, spaceid, creatorId]);


    ///errors and their display
    if(connectionError)
    {
       return  <ErrorScreen>Cannot connect to the socket.....</ErrorScreen>
    }

    //if screen is loading
    if(loading)
    {
        return <LoadingScreen />;
    }

    if(!user)
    {
        return <ErrorScreen>Please log in...... </ErrorScreen>;
    }

    if(loading_1)
    {
        return <LoadingScreen />;
    }

    if(creatorId===user.id){
        router.push(`/dashboard/${spaceid}`)
    }

    return <StreamView creatorId={creatorId as string} playVideo={false} spaceId={spaceid}></StreamView>
}


export const dynamic = "auto"

