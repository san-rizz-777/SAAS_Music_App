import {NextRequest, NextResponse} from "next/server";
import prisma from "@/app/lib/db";
import {z} from "zod"
import {getServerSession} from "next-auth";

const UpvoteSchema = z.object({
    streamId: z.string(),
})

export async function POST(req:NextRequest)
{
    const session = await getServerSession();

    ///TODO :- can get the rid of the prisma call here
    //to authenticate the user
    const user = await prisma.user.findFirst({
        where:{
            email: session?.user?.email ?? ""
        }
    });

    //error handling
    if(!user) {
        return NextResponse.json({
                message: "Unauthenticated"
            },
            {
                status: 403
            });
    }

////try-catch error handling
    try{
        const data = UpvoteSchema.parse(await req.json());
        await prisma.upvote.delete({
            where:{
                userId_streamId: {
                    userId: user.id,
                    streamId: data.streamId
                }
            }
        });
    }
    catch(e){
        return NextResponse.json({
                message: "Error while downvoting!!!"
            },
            {
                status:411
            });
    }
}
