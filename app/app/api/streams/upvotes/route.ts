import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/db";
import {z} from "zod";
import {getServerSession} from "next-auth";

const UpvoteSchema = z.object({
    streamId: z.string(),
    spaceId: z.string(),
})

export async function POST(req:NextRequest)
{
    const session = await getServerSession();

    //error handling
    if(!session?.user) {
        return NextResponse.json({
                message: "Unauthenticated"
            },
            {
                status: 403
            });
    }

    const user = session.user;

////try-catch error handling
try{
    const data = UpvoteSchema.parse(await req.json());
    await prisma.upvote.create({
        data:{
            userId: user.id,
            streamId: data.streamId
        },
    });

//upvoted
return NextResponse.json({
    message: "Upvoted Successfully!!!",
}, {status:201});

}
catch(e){
    return NextResponse.json({
        message: "Error while upvoting!!!"
    },
        {
            status:403,
        });
}
    }
