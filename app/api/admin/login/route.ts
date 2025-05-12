"use server"

import { connectToDatabase } from "@/lib/mongodb"
import Admin from "@/models/Admin"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    await connectToDatabase()

    // Find admin by username
    const admin = await Admin.findOne({ username }).lean()

    if (!admin) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password)

    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" },
    )

    return NextResponse.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        name: admin.name,
      },
      token,
    })
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
