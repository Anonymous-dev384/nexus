import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import User from "@/models/User"
import Notification from "@/models/Notification"

export async function POST(request: Request) {
  try {
    await connectToDatabase()

    const { gifterId, recipientId, duration } = await request.json()

    if (!gifterId || !recipientId || !duration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate duration
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 })
    }

    // Get gifter
    const gifter = await User.findOne({ uid: gifterId })
    if (!gifter) {
      return NextResponse.json({ error: "Gifter not found" }, { status: 404 })
    }

    // Check if gifter has enough tokens
    if (gifter.tokens < duration) {
      return NextResponse.json({ error: "Insufficient tokens" }, { status: 400 })
    }

    // Get recipient
    const recipient = await User.findOne({ uid: recipientId })
    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }

    // Calculate expiration date
    const now = new Date()
    let expiresAt = new Date()

    if (recipient.premiumFeatures.isActive && recipient.premiumFeatures.expiresAt) {
      // If already premium, extend the expiration date
      expiresAt = new Date(recipient.premiumFeatures.expiresAt)
    }

    // Add duration days
    expiresAt.setDate(expiresAt.getDate() + duration)

    // Update recipient's premium status
    recipient.premiumFeatures = {
      isActive: true,
      expiresAt,
      exclusiveThemes: true,
      extendedThreads: true,
      premiumLoungeAccess: true,
      maxPinnedPosts: 5,
      gifter: gifter.displayName,
    }

    // Deduct tokens from gifter
    gifter.tokens -= duration

    // Save changes
    await Promise.all([recipient.save(), gifter.save()])

    // Create notification for recipient
    const notification = new Notification({
      userId: recipientId,
      type: "gift",
      fromUserId: gifterId,
      content: `${gifter.displayName} gifted you ${duration} days of premium!`,
      read: false,
      data: {
        duration,
        expiresAt,
      },
    })

    await notification.save()

    return NextResponse.json({
      success: true,
      message: `Successfully gifted ${duration} days of premium to ${recipient.displayName}`,
      expiresAt,
    })
  } catch (error) {
    console.error("Error gifting premium:", error)
    return NextResponse.json({ error: "Failed to gift premium" }, { status: 500 })
  }
}
