import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/db";
import {z} from "zod"
import {getServerSession} from "next-auth";

// Create a upvote schema for validation
const UpvoteSchema = z.object({
    streamId: z.string(),
})

export async function POST(req:NextRequest)
{
    const session = await getServerSession();

    // If session returns null
    if(!session?.user.id){
        return NextResponse.json({message:"Unauthenticated!!!!"}, {status: 403});
    }

    const user = session.user;

////try-catch error handling
    try{
        const data = UpvoteSchema.parse(await req.json());  //validation
        await prisma.upvote.delete({        //db call
            where:{
                userId_streamId: {
                    userId: user.id,
                    streamId: data.streamId
                },
            },
        });
    }
    catch(e){
        return NextResponse.json({
                message: "Error while downvoting!!!"
            },
            {
                status:403
            });
    }
}
