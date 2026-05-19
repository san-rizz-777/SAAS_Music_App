import {NextRequest, NextResponse} from "next/server";
import  {z} from "zod";

//Creator schema
const CreatorStreamSchema = z.object({
      creatorId: z.string(),
      url: z.string(),
})


//end-point to create a stream
export async function POST(req: NextRequest) {
    try {
        const data = CreatorStreamSchema.parse(await req.json());
    }
    catch(e){
        return NextResponse.json({
            message: "Error while adding a stream!!!"
        }, {
            status: 411
        })
    }
}