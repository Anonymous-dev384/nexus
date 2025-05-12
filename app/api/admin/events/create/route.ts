"use server"

import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/admin-auth"

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const decodedToken = verifyAdminToken(token)

    if (!decodedToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { title, description, date, location, imageUrl, isVirtual, virtualLink, category } = await req.json()

    await connectToDatabase()

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      imageUrl,
      isVirtual,
      virtualLink,
      category,
      createdBy: decodedToken.id,
      isAdminCreated: true,
    })

    await newEvent.save()

    return NextResponse.json({
      success: true,
      event: newEvent,
    })
  } catch (error) {
    console.error("Create event error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
