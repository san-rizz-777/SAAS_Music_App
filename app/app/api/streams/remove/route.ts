import {z} from "zod";
import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/next-options";
import prisma from "@/lib/db"


const RemoveStream = z.object({
    streamId: z.string(),
    spaceId: z.string(),
});

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if(!session?.user)
    {
        return NextResponse.json({
            message:"Unauthenticated!!!!",
        }, {status:401});
    }

    const user = session.user;

    try{
        const {searchParams} = new URL(req.url);
        const streamId = searchParams.get("streamId");
        const spaceId = searchParams.get("spaceId");

        //if streamId not found
        if(!streamId){
            return NextResponse.json({
                message: "Stream Id is required!!!!",
            }, {status: 400})
        }

        //db call
        await prisma.stream.delete({
            where:{
                id: streamId,
                userId: user.id,
                spaceId: spaceId,
            }
        });

        return NextResponse.json({
            message:"Successfully removed the song!!!!",
        }, {status: 200});
    }
    catch(err) {
        return NextResponse.json({
            message: "Failed to delete stream!!!!",
        }, {status: 400})
    }
}