"use server"

import { connectToDatabase } from "@/lib/mongodb"
import Admin from "@/models/Admin"
import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const decodedToken = verifyAdminToken(token)

    if (!decodedToken || decodedToken.role !== "owner") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const admins = await Admin.find({}, { password: 0 }).lean()

    return NextResponse.json({
      success: true,
      admins,
    })
  } catch (error) {
    console.error("List admins error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
