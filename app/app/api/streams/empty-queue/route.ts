import {NextRequest, NextResponse} from "next/server";
import {authOptions} from "@/app/lib/next-options";
import prisma from "@/app/lib/db"
import {getServerSession} from "next-auth";


export default async function POST(req:NextRequest){
    //instantiate the session
    const session = await getServerSession(authOptions)

    //user authentication
    if(!session?.user)
    {
        return NextResponse.json({
            message: "Unauthenticated!!!",
        },
            {
                status:403,
        });
    }

    const user = session.user;
    const data_ = await req.json();

    //update the db as finished the playing
    try {
        await prisma.stream.updateMany({
            where: {
                userId: user.id,
                played: false,
                spaceId: data_.spaceId,
            },
            data: {
                played: true,
                playedTs: new Date(),
            },
        });

        ///send the success response
        return NextResponse.json({
            message: "Queue emptied succesfully!!!!",
        },{
            status:200,
        });
    }
    catch(err){
        console.log(err);
        return NextResponse.json({
            message: "Error while emptying the queue!!!!",
        },
            {
                status:500,
            })
    }
}