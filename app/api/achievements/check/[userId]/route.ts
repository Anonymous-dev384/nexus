import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import User from "@/models/User"
import Post from "@/models/Post"
import Notification from "@/models/Notification"

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    await connectToDatabase()

    const userId = params.userId

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user
    const user = await User.findOne({ uid: userId })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's posts count
    const postsCount = await Post.countDocuments({ authorId: userId })

    // Get user's total likes
    const posts = await Post.find({ authorId: userId })
    const totalLikes = posts.reduce((sum, post) => sum + post.likes.length, 0)

    // Check for achievements
    const newAchievements = []

    // Check existing achievements to avoid duplicates
    const existingAchievementNames = user.achievements.map((a) => a.name)

    // Post count achievements
    if (postsCount >= 100 && !existingAchievementNames.includes("Century Poster")) {
      newAchievements.push({
        name: "Century Poster",
        unlockedAt: new Date(),
        icon: "📝",
      })
    } else if (postsCount >= 50 && !existingAchievementNames.includes("Prolific Poster")) {
      newAchievements.push({
        name: "Prolific Poster",
        unlockedAt: new Date(),
        icon: "✍️",
      })
    } else if (postsCount >= 10 && !existingAchievementNames.includes("Getting Started")) {
      newAchievements.push({
        name: "Getting Started",
        unlockedAt: new Date(),
        icon: "🚀",
      })
    }

    // Likes achievements
    if (totalLikes >= 1000 && !existingAchievementNames.includes("Viral Sensation")) {
      newAchievements.push({
        name: "Viral Sensation",
        unlockedAt: new Date(),
        icon: "🔥",
      })
    } else if (totalLikes >= 100 && !existingAchievementNames.includes("Well-Liked")) {
      newAchievements.push({
        name: "Well-Liked",
        unlockedAt: new Date(),
        icon: "❤️",
      })
    }

    // Streak achievements
    if (user.streak >= 30 && !existingAchievementNames.includes("Monthly Devotion")) {
      newAchievements.push({
        name: "Monthly Devotion",
        unlockedAt: new Date(),
        icon: "📅",
      })
    } else if (user.streak >= 7 && !existingAchievementNames.includes("Weekly Warrior")) {
      newAchievements.push({
        name: "Weekly Warrior",
        unlockedAt: new Date(),
        icon: "🗓️",
      })
    }

    // If new achievements, update user and create notifications
    if (newAchievements.length > 0) {
      // Add new achievements to user
      user.achievements = [...user.achievements, ...newAchievements]
      await user.save()

      // Create notifications for each achievement
      for (const achievement of newAchievements) {
        const notification = new Notification({
          userId,
          type: "achievement",
          content: `You've earned the "${achievement.name}" achievement!`,
          read: false,
          data: achievement,
        })

        await notification.save()
      }
    }

    return NextResponse.json({
      success: true,
      newAchievements,
      totalAchievements: user.achievements.length,
    })
  } catch (error) {
    console.error("Error checking achievements:", error)
    return NextResponse.json({ error: "Failed to check achievements" }, { status: 500 })
  }
}
