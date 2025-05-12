import { NextResponse } from "next/server"
import { serverUploadAudio } from "@/lib/cloudinary-server"

export async function POST(request: Request) {
  try {
    const { data } = await request.json()

    if (!data) {
      return NextResponse.json({ error: "No audio data provided" }, { status: 400 })
    }

    // Use the server action to upload
    const result = await serverUploadAudio(data)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in upload-audio API route:", error)
    return NextResponse.json({ error: "Failed to upload audio" }, { status: 500 })
  }
}
