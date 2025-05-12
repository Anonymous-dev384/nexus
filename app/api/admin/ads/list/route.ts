"use server"

import { connectToDatabase } from "@/lib/mongodb"
import Advertisement from "@/models/Advertisement"
import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const decodedToken = verifyAdminToken(token)

    if (!decodedToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const ads = await Advertisement.find().sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      success: true,
      advertisements: ads,
    })
  } catch (error) {
    console.error("List ads error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
