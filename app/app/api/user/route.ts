import {getServerSession} from "next-auth";
import {NextRequest, NextResponse} from "next/server";
import {authOptions} from "@/app/lib/next-options"

export async function GET(req: NextRequest) {
    //create the session instance first
    const session = await getServerSession(authOptions);

    //after validation and all
    if(!session?.user.id)
    {
        return NextResponse.json({
            message: "Unauthenticated",
            status: 403,
        });
    }

    const user = session.user;

    //return the user
    return NextResponse.json({
        user: user
    });
}

//dont render static
export const dynamic = "forced-dynamic";