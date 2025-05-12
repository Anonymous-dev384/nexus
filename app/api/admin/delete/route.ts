"use server"

import { connectToDatabase } from "@/lib/mongodb"
import Admin from "@/models/Admin"
import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/admin-auth"

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const decodedToken = verifyAdminToken(token)

    if (!decodedToken || decodedToken.role !== "owner") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await req.json()

    await connectToDatabase()

    // Prevent deleting the owner account
    const adminToDelete = await Admin.findById(id)

    if (!adminToDelete) {
      return NextResponse.json({ success: false, message: "Admin not found" }, { status: 404 })
    }

    if (adminToDelete.role === "owner") {
      return NextResponse.json({ success: false, message: "Cannot delete owner account" }, { status: 403 })
    }

    await Admin.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully",
    })
  } catch (error) {
    console.error("Delete admin error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
