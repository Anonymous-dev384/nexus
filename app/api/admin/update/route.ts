"use server"

import { connectToDatabase } from "@/lib/mongodb"
import Admin from "@/models/Admin"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { verifyAdminToken } from "@/lib/admin-auth"

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const decodedToken = verifyAdminToken(token)

    if (!decodedToken || (decodedToken.role !== "owner" && decodedToken.id !== req.body.id)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id, name, username, password, role, permissions } = await req.json()

    await connectToDatabase()

    const updateData: any = {}

    if (name) updateData.name = name
    if (username) updateData.username = username
    if (role && decodedToken.role === "owner") updateData.role = role
    if (permissions && decodedToken.role === "owner") updateData.permissions = permissions

    if (password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(password, salt)
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(id, { $set: updateData }, { new: true, select: "-password" })

    if (!updatedAdmin) {
      return NextResponse.json({ success: false, message: "Admin not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      admin: updatedAdmin,
    })
  } catch (error) {
    console.error("Update admin error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
