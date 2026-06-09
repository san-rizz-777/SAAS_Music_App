import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
    const { creatorId, userId } = await req.json();

    if (!creatorId || !userId) {
        return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const token = jwt.sign(
        { creatorId, userId },
        process.env.NEXT_PUBLIC_SECRET || "",
        { expiresIn: "24h" }
    );

    return NextResponse.json({ success: true, token });
}