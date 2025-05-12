import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import Referral from "@/models/Referral"
import { nanoid } from "nanoid"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Check if user exists
    const user = await User.findOne({ uid: userId })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user already has a referral code
    if (user.referralInfo?.referralCode) {
      return NextResponse.json({
        referralCode: user.referralInfo.referralCode,
        message: "Referral code already exists",
      })
    }

    // Generate a unique referral code
    let referralCode
    let isUnique = false

    while (!isUnique) {
      // Generate a short, readable code
      referralCode = `${user.username.substring(0, 3).toUpperCase()}${nanoid(6)}`

      // Check if code already exists
      const existingCode = await User.findOne({ "referralInfo.referralCode": referralCode })
      if (!existingCode) {
        isUnique = true
      }
    }

    // Update user with referral code
    user.referralInfo = {
      ...user.referralInfo,
      referralCode,
      referralCount: user.referralInfo?.referralCount || 0,
    }
    await user.save()

    // Create referral tracking document
    await Referral.create({
      code: referralCode,
      userId: user.uid,
      referredUsers: [],
      rewards: [],
      totalRewards: {
        tokens: 0,
        premiumDays: 0,
        xp: 0,
      },
      clicks: 0,
    })

    return NextResponse.json({
      referralCode,
      message: "Referral code generated successfully",
    })
  } catch (error: any) {
    console.error("Error generating referral code:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
