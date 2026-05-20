import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import {prismaClient} from "@/app/lib/db";

const handler = NextAuth({
        providers : [
GoogleProvider({
    clientId : process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret : process.env.GOOGLE_CLIENT_SECRET ?? "",
})
        ],
    callbacks: {
            async signIn(params){
                console.log(params);
                //error handling
                try{
                    await prismaClient.user.create({
                        data: {
                            email: "",
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