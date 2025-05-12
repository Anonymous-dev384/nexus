import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Post from "@/models/Post"
import User from "@/models/User"
import Notification from "@/models/Notification"

export async function POST(request: Request) {
  try {
    await connectToDatabase()

    const { postId, userId, optionIndices } = await request.json()

    if (!postId || !userId || !optionIndices || !Array.isArray(optionIndices)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get post
    const post = await Post.findById(postId)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Validate post is a poll
    if (post.postType !== "poll" || !post.pollData) {
      return NextResponse.json({ error: "Post is not a poll" }, { status: 400 })
    }

    // Check if poll has expired
    if (post.pollData.expiresAt && new Date(post.pollData.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Poll has expired" }, { status: 400 })
    }

    // Check if user has already voted
    const hasVoted = post.pollData.options.some((option) => option.votes.includes(userId))

    if (hasVoted && !post.pollData.allowMultipleVotes) {
      return NextResponse.json({ error: "User has already voted" }, { status: 400 })
    }

    // Add votes
    for (const index of optionIndices) {
      if (index < 0 || index >= post.pollData.options.length) {
        return NextResponse.json({ error: "Invalid option index" }, { status: 400 })
      }

      // Add vote if not already voted for this option
      if (!post.pollData.options[index].votes.includes(userId)) {
        post.pollData.options[index].votes.push(userId)
      }
    }

    await post.save()

    // Create notification for post author if it's not the voter
    if (post.authorId !== userId) {
      const voter = await User.findOne({ uid: userId })

      const notification = new Notification({
        userId: post.authorId,
        type: "vote",
        fromUserId: userId,
        postId,
        content: `${voter.displayName} voted on your poll`,
        read: false,
      })

      await notification.save()
    }

    return NextResponse.json({
      success: true,
      message: "Vote recorded successfully",
      pollData: post.pollData,
    })
  } catch (error) {
    console.error("Error recording vote:", error)
    return NextResponse.json({ error: "Failed to record vote" }, { status: 500 })
  }
}
