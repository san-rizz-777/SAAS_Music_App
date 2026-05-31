"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {useEffect} from "react";
import { SignInFlow } from "@/types/auth-types";
import AuthScreen from "@/components/auth/auth-screen";
import React from "react";

export default  function AuthPage({
                                     searchParams,
                                 }: {
    searchParams: { authType: SignInFlow; mailId?: string };
}) {
    // @ts-ignore
    searchParams = React.use(searchParams);
    const formType = searchParams.authType;
    const session = useSession();
    const router = useRouter();

    useEffect(() => {
        if (session.status === "authenticated") {
            router.push("/");
        }
    }, [session.status, router]);
    return <AuthScreen authType={formType} />;
}