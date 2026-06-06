"use client";

import { SocketContextProvider } from "@/context/socket-context";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ConnectionProvider endpoint={"https://api.devnet.solana.com"}>
            <WalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>
                    <SessionProvider>
                       {children}
                    </SessionProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {

    // Override the script tag on the client side to suppress the React 19 warning
    const scriptProps = typeof window === "undefined"
        ? undefined
        : ({ type: "application/json" } as const);
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}