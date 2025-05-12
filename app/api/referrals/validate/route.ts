import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request: Request) {
  try {
    const { referralCode } = await request.json()

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find user with this referral code
    const user = await User.findOne({ "referralInfo.referralCode": referralCode })

    if (!user) {
      return NextResponse.json({
        valid: false,
        message: "Invalid referral code",
      })
    }

    return NextResponse.json({
      valid: true,
      userId: user.uid,
      username: user.username,
    })
  } catch (error: any) {
    console.error("Error validating referral code:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
