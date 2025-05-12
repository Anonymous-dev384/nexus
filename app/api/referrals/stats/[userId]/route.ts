import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import Referral from "@/models/Referral"

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find user
    const user = await User.findOne({ uid: userId })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get referral code
    const referralCode = user.referralInfo?.referralCode

    if (!referralCode) {
      return NextResponse.json({
        referralCount: 0,
        rewards: [],
        totalRewards: {
          tokens: 0,
          premiumDays: 0,
          xp: 0,
        },
        hasReferralCode: false,
      })
    }

    // Find referral document
    const referralDoc = await Referral.findOne({ code: referralCode })

    if (!referralDoc) {
      return NextResponse.json({
        referralCount: 0,
        rewards: [],
        totalRewards: {
          tokens: 0,
          premiumDays: 0,
          xp: 0,
        },
        hasReferralCode: true,
        referralCode,
      })
    }

    // Get referred users with basic info
    const referredUsers = await User.find(
      { uid: { $in: referralDoc.referredUsers } },
      { uid: 1, username: 1, displayName: 1, photoURL: 1, createdAt: 1 },
    )
      .sort({ createdAt: -1 })
      .limit(10)

    return NextResponse.json({
      referralCount: referralDoc.referredUsers.length,
      referredUsers,
      rewards: referralDoc.rewards,
      totalRewards: referralDoc.totalRewards,
      hasReferralCode: true,
      referralCode,
      clicks: referralDoc.clicks,
    })
  } catch (error: any) {
    console.error("Error getting referral stats:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
