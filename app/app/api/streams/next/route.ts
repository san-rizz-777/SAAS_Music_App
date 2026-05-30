import prisma from "@/app/lib/db";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/lib/next-options";
import {NextResponse, NextRequest } from "next/server";


export async function GET(req:NextRequest){
    //get the session info
    const session = await getServerSession(authOptions);

    if(!session?.user.id){
        return NextResponse.json(
        {
            message: "Unauthenticated!!!!",
        }
    ,
        {
            status:403,
        }
    );
    }

    //get the user and the space id
    const user = session.user;
    const spaceid = req.nextUrl.searchParams.get("spaceid");

    ///find the most upvoted stream
    const mostUpvotedStream = await prisma.stream.findFirst({
        where:{ //taken the one which is not played
            userId: user.id,
            spaceId: spaceid,
            played:false,
        },
        orderBy:{     //order in descending order
            upvotes:{
                 _count:"desc"
            }
        }
    });

    await Promise.all([
        await prisma.currentStream.upsert({
            where:{
                spaceId:spaceid as string,
            },
            update:{
                userId: user.id,
                streamId: mostUpvotedStream?.id,
                spaceId: spaceid,
            },
            create:{
                userId: user.id,
                streamId: mostUpvotedStream?.id,
                spaceId: spaceid,
            }
        }),
     await prisma.stream.update({
         where:{
             id: mostUpvotedStream?.id ?? "",
         },
         data:{
             played: true,
             playedTs: new Date(),
         },
     }),
    ]);


    return NextResponse.json({
        stream: mostUpvotedStream,
    });
}