import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import Referral from "@/models/Referral"

export async function POST(request: Request) {
  try {
    const { referralCode, newUserId } = await request.json()

    if (!referralCode || !newUserId) {
      return NextResponse.json({ error: "Referral code and new user ID are required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find referrer user
    const referrer = await User.findOne({ "referralInfo.referralCode": referralCode })
    if (!referrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 })
    }

    // Find new user
    const newUser = await User.findOne({ uid: newUserId })
    if (!newUser) {
      return NextResponse.json({ error: "New user not found" }, { status: 404 })
    }

    // Check if this user was already referred
    if (newUser.referralInfo?.referredBy) {
      return NextResponse.json({ error: "User was already referred" }, { status: 400 })
    }

    // Update new user with referrer info
    newUser.referralInfo = {
      ...newUser.referralInfo,
      referredBy: referrer.uid,
    }
    await newUser.save()

    // Update referrer's referral count
    referrer.referralInfo.referralCount = (referrer.referralInfo.referralCount || 0) + 1
    referrer.referralInfo.lastReferralAt = new Date()
    await referrer.save()

    // Find referral document
    const referralDoc = await Referral.findOne({ code: referralCode })
    if (referralDoc) {
      // Add new user to referred users
      referralDoc.referredUsers.push(newUserId)

      // Add rewards based on milestone achievements
      const referralCount = referralDoc.referredUsers.length

      // First referral reward
      if (referralCount === 1) {
        referralDoc.rewards.push({
          type: "tokens",
          amount: 20,
          claimed: false,
        })
        referralDoc.totalRewards.tokens += 20
      }

      // 5 referrals milestone
      if (referralCount === 5) {
        referralDoc.rewards.push({
          type: "tokens",
          amount: 50,
          claimed: false,
        })
        referralDoc.rewards.push({
          type: "xp",
          amount: 100,
          claimed: false,
        })
        referralDoc.totalRewards.tokens += 50
        referralDoc.totalRewards.xp += 100
      }

      // 10 referrals milestone
      if (referralCount === 10) {
        referralDoc.rewards.push({
          type: "tokens",
          amount: 100,
          claimed: false,
        })
        referralDoc.rewards.push({
          type: "premium",
          amount: 7, // 7 days
          claimed: false,
        })
        referralDoc.totalRewards.tokens += 100
        referralDoc.totalRewards.premiumDays += 7
      }

      // 25 referrals milestone
      if (referralCount === 25) {
        referralDoc.rewards.push({
          type: "tokens",
          amount: 250,
          claimed: false,
        })
        referralDoc.rewards.push({
          type: "premium",
          amount: 30, // 30 days
          claimed: false,
        })
        referralDoc.rewards.push({
          type: "badge",
          amount: 1, // Badge ID or count
          claimed: false,
        })
        referralDoc.totalRewards.tokens += 250
        referralDoc.totalRewards.premiumDays += 30
      }

      await referralDoc.save()
    }

    return NextResponse.json({
      success: true,
      message: "Referral processed successfully",
    })
  } catch (error: any) {
    console.error("Error processing referral:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
