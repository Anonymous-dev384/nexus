import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import Referral from "@/models/Referral"

export async function POST(request: Request) {
  try {
    const { userId, rewardId } = await request.json()

    if (!userId || !rewardId) {
      return NextResponse.json({ error: "User ID and reward ID are required" }, { status: 400 })
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
      return NextResponse.json({ error: "User has no referral code" }, { status: 400 })
    }

    // Find referral document
    const referralDoc = await Referral.findOne({ code: referralCode })

    if (!referralDoc) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 })
    }

    // Find the reward
    const rewardIndex = referralDoc.rewards.findIndex((r) => r._id.toString() === rewardId)

    if (rewardIndex === -1) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 })
    }

    const reward = referralDoc.rewards[rewardIndex]

    // Check if reward is already claimed
    if (reward.claimed) {
      return NextResponse.json({ error: "Reward already claimed" }, { status: 400 })
    }

    // Process reward based on type
    switch (reward.type) {
      case "tokens":
        user.tokens += reward.amount
        break
      case "xp":
        user.xp += reward.amount
        break
      case "premium":
        // Calculate new expiry date
        const currentExpiryDate = user.premiumFeatures.expiresAt ? new Date(user.premiumFeatures.expiresAt) : new Date()

        const newExpiryDate = new Date(currentExpiryDate)
        newExpiryDate.setDate(newExpiryDate.getDate() + reward.amount)

        user.premiumFeatures = {
          ...user.premiumFeatures,
          isActive: true,
          expiresAt: newExpiryDate,
          exclusiveThemes: true,
          extendedThreads: true,
          premiumLoungeAccess: true,
        }
        break
      case "badge":
        // Add special referral badge if not already present
        if (!user.badges.includes("referral_master")) {
          user.badges.push("referral_master")
        }
        break
    }

    // Mark reward as claimed
    referralDoc.rewards[rewardIndex].claimed = true
    referralDoc.rewards[rewardIndex].claimedAt = new Date()

    // Save changes
    await user.save()
    await referralDoc.save()

    return NextResponse.json({
      success: true,
      rewardType: reward.type,
      amount: reward.amount,
      message: "Reward claimed successfully",
    })
  } catch (error: any) {
    console.error("Error claiming reward:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
