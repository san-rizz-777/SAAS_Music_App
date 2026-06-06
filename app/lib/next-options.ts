    import { NextAuthOptions, Session } from "next-auth";
    import bcrypt from "bcryptjs";
    import { JWT } from "next-auth/jwt";
    import Credentials from "next-auth/providers/credentials";
    import GoogleProvider from "next-auth/providers/google";

    import { PrismaClientInitializationError } from "@prisma/client/runtime/library";
    import {emailSchema, passSchema} from "@/schema/crendentials-schema";
    import prisma from "@/app/lib/db";


    export const authOptions: NextAuthOptions = {
        providers:[
            GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID ?? "",
                clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            }),
            Credentials({
                credentials: {
                    email: {type: "email"},
                    password: {type: "password"}
                },
            async authorize(credentials){
                if(!credentials || !credentials.email || !credentials.password)
                {
                    return null;
                }

                ///validate the email
                const emailValidation = emailSchema.safeParse(credentials.email);

                //if fails
                if(!emailValidation.success){
                throw new Error("Invalid email address!!!");
                }

                //password validation
                const passValidation = passSchema.safeParse(credentials.password);
                if(!passValidation.success)
                {
                    throw new Error(passValidation.error.issues[0].message);
                }

                //try - catch block
                try{
                    const user = await prisma.user.findUnique({
                        where:{
                            email: emailValidation.data,
                        }
                    });

                    //if not found create new one
                    if(!user){
                        // not storing raw pass in database
                        const hashedPass = await bcrypt.hash(passValidation.data, 10);

                        const newUser = await prisma.user.create({
                            data: {
                                email: emailValidation.data,
                                password: hashedPass,
                                provider: "Credentials",
                            }
                        })

                        return  newUser;
                    }

                    ///if email found but pass not then update it
                    if(!user.password){
                        const hashedPass = await bcrypt.hash(passValidation.data, 10);

                        const authUser = await prisma.user.update({
                            where:{
                                email: emailValidation.data
                            },
                            data:{
                                password: hashedPass
                            }
                        });

                        return authUser;
                    }

                    const passVerification = await bcrypt.compare(passValidation.data, user.password);

                    if(!passVerification){
                        throw new Error("Invalid Password!!!");
                    }

                    return user;
                }
                catch(e){
                    if(e instanceof PrismaClientInitializationError)
                    {
                        throw new Error("Internal Server Error!!!")
                    }
                    console.log(e);
                    throw e;
                }
            },
            })
            ],
        pages:{
            signIn: "/auth"
        },
        secret: process.env.NEXTAUTH_SECRET ?? "secret",
        session: {strategy: "jwt"},
        callbacks:{
            async jwt({token, account, profile, user}){
                if (user) {
                    // credentials login
                    token.id = user.id as string;
                    token.email = user.email as string;
                }
                if(account && profile){
                    token.email = profile.email as string
                    token.id = account.access_token
                }
                return token;
            },
            async session({session, token}){
                console.log("TOKEN IN SESSION CALLBACK:", JSON.stringify(token));
                try{
                    const user = await prisma.user.findUnique({
                        where:{
                            email: token.email
                        }
                    });

                   // console.log("Found user:", user?.id);
                  if(user) {
                        session.user.id = user.id;
                        console.log("session.user after setting:", JSON.stringify(session.user))
                      }
                } catch (error){
                    if(error instanceof  PrismaClientInitializationError)
                    {
                        throw new Error("Internal Server Error!!!");
                    }
                    console.log("Session callback error:", error);
                    throw error;
                }

                return session;
            },
            async signIn({account, profile}) : Promise<boolean>{
                try{
                    if(account?.provider == "google"){

                        //get the user
                        const user = await prisma.user.findUnique(
                            {
                                where:{
                                    email: profile?.email
                                }
                            }
                        );

                        //if not found
                        if(!user){
                            const newUser = await prisma.user.create({
                                data: {
                                    email: profile?.email!,
                                    name: profile?.name,
                                    provider: "Google",
                                }
                            })
                        }
                    }
                    return true;
                }catch (error){
                    console.log(error);
                    return false;
                }
            }
        }
    }   satisfies NextAuthOptions;