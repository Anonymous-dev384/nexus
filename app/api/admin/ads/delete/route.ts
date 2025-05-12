"use server"

import { connectToDatabase } from "@/lib/mongodb"
import Advertisement from "@/models/Advertisement"
import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/admin-auth"

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const decodedToken = verifyAdminToken(token)

    if (!decodedToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await req.json()

    await connectToDatabase()

    await Advertisement.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: "Advertisement deleted successfully",
    })
  } catch (error) {
    console.error("Delete ad error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
