import { NextResponse } from "next/server"
import { serverUploadImage } from "@/lib/cloudinary-server"

export async function POST(request: Request) {
  try {
    const { data } = await request.json()

    if (!data) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 })
    }

    // Use the server action to upload
    const result = await serverUploadImage(data)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in upload API route:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
