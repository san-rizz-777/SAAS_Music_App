"use client";

import {SessionProvider} from "next-auth/react";
import React from "react";

///Providers wrap the session provider
//for recoil theme providers+
export function Providers({children}:{children : React.ReactNode})
{
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    )
}
