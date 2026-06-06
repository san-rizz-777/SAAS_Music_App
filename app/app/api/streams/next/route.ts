import prisma from "@/lib/db";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/next-options";
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
    const spaceId = req.nextUrl.searchParams.get("spaceId");

    ///find the most upvoted stream
    const mostUpvotedStream = await prisma.stream.findFirst({
        where:{ //taken the one which is not played
            userId: user.id,
            played:false,
            spaceId: spaceId,
        },
        orderBy:{     //order in descending order
            upvotes:{
                 _count:"desc",
            },
        },
    });

    await Promise.all([
        prisma.currentStream.upsert({
            where:{
                spaceId:spaceId as string,
            },
            update:{
                userId: user.id,
                streamId: mostUpvotedStream?.id,
                spaceId: spaceId,
            },
            create:{
                userId: user.id,
                streamId: mostUpvotedStream?.id,
                spaceId: spaceId,
            }
        }),
      prisma.stream.update({
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