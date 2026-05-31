import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/next-options";

export async function GET(
    req: NextRequest,
    { params }: { params: { spaceid: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "You must be logged in." },
                { status: 401 }
            );
        }

        const space = await prisma.space.findUnique({
            where: { id: params.spaceid },
            select: { hostId: true, name: true, isActive: true }
        });

        if (!space) {
            return NextResponse.json(
                { success: false, message: "Space not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, hostId: space.hostId });

    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: `Unexpected error: ${err.message}` },
            { status: 500 }
        );
    }
}