import {NextRequest, NextResponse} from "next/server";
import  {z} from "zod";
import prisma from "@/app/lib/db";
import youtubesearchapi from "youtube-search-api";
import {Prisma} from "@prisma/client";

const YT_REG = new RegExp("^(?:https?:\\/\\/)?(?:www\\.)?(?:m\\.)?(?:youtube\\.com\\/(?:watch\\?(?!.*\\blist=)(?:.*&)?v=|embed\\/|v\\/)|youtu\\.be\\/)([a-zA-Z0-9_-]{11})(?:[?&]\\S+)?$");

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

        const res = await youtubesearchapi.GetVideoDetails(extractedId);

        //extract the biggest thumbnail and title
        const thumbnails = res.thumbnail.thumbnails;
        thumbnails.sort((a:{width:number},b:{width:number}) => a.width < b.width ? -1 : 1);   ///sorting in ascending

        //create the stream
        // @ts-ignore
       const stream =  await prisma.stream.create({
           data: {
               userId: data.creatorId,
               url: data.url,
               extractedId,
               type: "Youtube",
               title_: res.title ?? "Can't find the video!!!",
               smallImg: (thumbnails.length > 1 ? thumbnails.at(-2).url : thumbnails.at(-1).url) ?? "https://www.shutterstock.com/image-vector/old-computer-browser-90s-404-260nw-2664184569.jpg",
               bigImg: thumbnails.at(-1).url ?? "https://www.shutterstock.com/image-vector/old-computer-browser-90s-404-260nw-2664184569.jpg"
           } as Prisma.StreamUncheckedCreateInput
       })

        return NextResponse.json({
            message:"Added Stream Successfully!",
            id: stream.id,
            status: 200
        })
    }
    catch(e){
        console.log(e);
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
    const streams = await prisma.stream.findMany({
        where: {
            userId: creatorId ?? ""
        }
    })

    return NextResponse.json({
        streams
    })
}