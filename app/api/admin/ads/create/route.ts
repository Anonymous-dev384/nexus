"use server"

import { connectToDatabase } from "@/lib/mongodb"
import Advertisement from "@/models/Advertisement"
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

    const { title, description, imageUrl, linkUrl, startDate, endDate, targetAudience, placement } = await req.json()

    await connectToDatabase()

    const newAd = new Advertisement({
      title,
      description,
      imageUrl,
      linkUrl,
      startDate,
      endDate,
      targetAudience,
      placement,
      createdBy: decodedToken.id,
    })

    await newAd.save()

    return NextResponse.json({
      success: true,
      advertisement: newAd,
    })
  } catch (error) {
    console.error("Create ad error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
