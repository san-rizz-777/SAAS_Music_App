import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/app/lib/db";

const handler = NextAuth({
        providers : [
GoogleProvider({
    clientId : process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret : process.env.GOOGLE_CLIENT_SECRET ?? "",
})
        ],
    secret: process.env.NEXTAUTH_SECRET ?? "secret",
    callbacks: {
            async signIn(params){
                console.log(params);
                //error handling
                try{
                    await prisma.user.create({
                        data: {
                            email: params.user.email ?? "",
                            provider: "Google",
                            role: "Streamer"
                        }
                    })
                }
                catch(e)
                {
                    console.log(e);
                }

                return true;
            }
    }
})

export {handler as GET, handler as POST}