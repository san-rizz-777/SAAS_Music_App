import prisma from "@/lib/db"
import {NextResponse, NextRequest} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/next-options"


///Here we are creating a get endpoint to give the user all the info about streams and upvotes
export default async function GET(req: NextRequest){

    const session = await getServerSession(authOptions);

    //authentication
    if(!session?.user)
    {
        ///if user not found
        return NextResponse.json({
            message: "Unauthenticated!!!!",
            status: 403,
        })
    }

    const user = session.user;

    ///get the streams from db
    const streams = await prisma.stream.findMany({
        where: {
            userId: user.id
        },
        include:{
            _count:{
                select:{
                    upvotes: true,
                },
            },
            upvotes:{
                where:{
                    userId: user.id
                },
            },
        },
    });

    //return the stream with upvotes and telling if upvoted or not
    return NextResponse.json({
        streams: streams.map(({_count, ...rest}) => ({
                ...rest,
            upvotes: _count.upvotes,
            haveUpvotes: !!rest.upvotes.length    ///Just checks if empty then return false
        }))
    });
}