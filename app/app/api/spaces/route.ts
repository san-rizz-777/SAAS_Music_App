import {getServerSession} from "next-auth";
import {NextResponse, NextRequest} from "next/server";
import prisma from "@/lib/db";
import {authOptions} from "@/lib/next-options";


///post end point to create a space
export async function POST(req:NextRequest){
    try {
        //get the session
        const session = await getServerSession(authOptions);

        ///if the user tries to create space without getting logged in
        if (!session?.user?.id) {
            return NextResponse.json({
                    success: false, message: "You must be logged in to create a new Space",
                },
                {status: 401});
        }

        const data = await req.json();

        //user tries to create space without name
        if (!data.spaceName) {
            return NextResponse.json({
                    success: false, message: "Space name is required!!!",
                },
                {status: 400});
        }

        //create the space in db
        const space = await prisma.space.create({
            data: {
                name: data.spaceName,
                hostId: session.user.id,
            },
        });

        return NextResponse.json(
            {success: true, message: "Space created successfully!!!!",space},
            {status: 201},
        );
    }
    catch(err:any){

        //if it has been unauthenticated
        if(err.message === "Unauthenticated Request"){
            return NextResponse.json(
                {success:false, message:"You must be logged in to create a new Space!!!",}
                ,
                {status: 401});
        }

        //otherwise
        return NextResponse.json({success:false, message:`Unexpected error: ${err.message}`,},
            {status:500});
    }
}


///to delete a space
export async function DELETE(req:NextRequest){
    try {
        //get the session and space Id
        const spaceId = req.nextUrl.searchParams.get("spaceId");
        const session = await getServerSession(authOptions);

        //if returns unauthenticated
        if (!session?.user?.id) {
            return NextResponse.json(
                {success: false, message: "You must be logged in to delete a Space1!!",},
                {status: 401}
            )
        }

        //if space Id not given by user
        if (!spaceId) {
            return NextResponse.json({success: false, message: "Space name is required!!!",},
                {status: 401});
        }

        //get the space from db to check existence
        const space = await prisma.space.findUnique({
            where: {
                id: spaceId,
            }
        });

        //if doesnt exist
        if (!space) {
            return NextResponse.json({success: false, message: "Space doesn't exist!!",}, {status: 404});
        }

        //check if the user is the host or not
        if (space.hostId !== session.user.id) {
            return NextResponse.json({
                success: false,
                message: "You are not authorized to delete the space!!!!"
            }, {status: 403});   //bad request
        }

        //delete space from db
        await prisma.space.delete({
            where: {id: spaceId}
        });

        return NextResponse.json({
            success: true, message: "Space deleted successfully!!!!",
        }, {status: 200})
    }
    catch(error: any)
    {
        console.log(error);
        return NextResponse.json({
            success:false, message:`Unexpected error: ${error.message}`,
        }, {status:500})
    }
}


////getting the host id or spaces
export async function GET(req:NextRequest){
    try{
        //get the session
        const session = await getServerSession(authOptions);
        const spaceId = req.nextUrl.searchParams.get("spaceId");

        //if spaceId is provided
        if (spaceId) {
            const space = await prisma.space.findUnique({
                where:{id: spaceId},
                select:{hostId:true}
            });

            //if not found
            if (!space) {
                return NextResponse.json({success:false, message:"Space does not exist!!!"}, {status:404})
            }

            return NextResponse.json({success:true, message:"Host Id retrieve successfully!!!!", hostId:space.hostId, space}, {status:200});
        }


        if(!session?.user?.id)
        {
            return NextResponse.json({success: false, message: "You must be logged in to get a Space information!!!",}, {status:401});
        }

        //if no space Id is provided
        const spaces = await prisma.space.findMany({
            where:{hostId:session?.user.id}
        })

        return NextResponse.json({success:true, message:"Successfully retrieved all the spaces!!!!", spaces}, {status:200});
    }
    catch(err:any){
        return NextResponse.json({success:false, message:`Unexpected error: ${err.message}`,}, {status:500});
    }
}