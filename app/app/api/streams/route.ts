import {NextRequest, NextResponse} from "next/server";
import  {z} from "zod";
import {prismaClient} from "@/app/lib/db";

const YT_REG = new RegExp("^https:\/\/www\.com\/watch\?v=[\w-]{11}$");

//Creator schema
const CreatorStreamSchema = z.object({
      creatorId: z.string(),
      url: z.string(),
})


//end-point to create a stream
export async function POST(req: NextRequest) {
    try {
        const data = CreatorStreamSchema.parse(await req.json());
        const isYt = YT_REG.test(data.url); //validate for regex
        if(!isYt)
        {
            //give appropriate info for regex error
            return NextResponse.json({
                message:"Wrong URL found!!!"
            }, {
                status: 411
            })
        }

        //extract the id
        const extractedId = data.url.split("?v=")[1];

        //create the stream
        // @ts-ignore
        await prismaClient.stream.create({
            data:{
                userId: data.creatorId,
                url: data.url,
                extractedId,
                type: "Youtube"
            }
        })
    }
    catch(e){
        return NextResponse.json({
            message: "Error while adding a stream!!!"
        }, {
            status: 411
        })
    }
}


//Get end point
export async function GET(req: NextRequest){
    const creatorId = req.nextUrl.searchParams.get("creatorId");
    const streams = await prismaClient.stream.findMany({
        where: {
            userId: creatorId ?? ""
        }
    })
}