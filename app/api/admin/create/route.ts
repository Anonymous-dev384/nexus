"use server"

import { connectToDatabase } from "@/lib/mongodb"
import Admin from "@/models/Admin"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { name, username, password, role, permissions, createdBy } = await req.json()

    await connectToDatabase()

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username })

    if (existingAdmin) {
      return NextResponse.json({ success: false, message: "Admin with this username already exists" }, { status: 400 })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create new admin
    const newAdmin = new Admin({
      name,
      username,
      password: hashedPassword,
      role,
      permissions,
      createdBy,
    })

    await newAdmin.save()

    return NextResponse.json({
      success: true,
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        username: newAdmin.username,
        role: newAdmin.role,
        permissions: newAdmin.permissions,
      },
    })
  } catch (error) {
    console.error("Create admin error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
