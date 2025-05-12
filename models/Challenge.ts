import mongoose, { Schema, type Document } from "mongoose"

export interface IChallenge extends Document {
  title: string
  description: string
  creatorId: string
  challengedUserId: string
  type: "post" | "media" | "activity" | "custom"
  criteria: {
    description: string
    deadline?: Date
    mediaRequired?: boolean
    minLikes?: number
    hashtags?: string[]
  }
  status: "pending" | "accepted" | "completed" | "failed" | "declined"
  reward?: {
    tokens: number
    xp: number
  }
  submissions?: {
    userId: string
    content: string
    mediaUrls?: string[]
    submittedAt: Date
  }[]
  result?: {
    winnerId?: string
    reason: string
    decidedAt: Date
  }
  createdAt: Date
  updatedAt: Date
}

const ChallengeSchema = new Schema<IChallenge>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    creatorId: { type: String, required: true, ref: "User" },
    challengedUserId: { type: String, required: true, ref: "User" },
    type: {
      type: String,
      required: true,
      enum: ["post", "media", "activity", "custom"],
    },
    criteria: {
      description: { type: String, required: true },
      deadline: { type: Date },
      mediaRequired: { type: Boolean, default: false },
      minLikes: { type: Number },
      hashtags: [{ type: String }],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "accepted", "completed", "failed", "declined"],
      default: "pending",
    },
    reward: {
      tokens: { type: Number, default: 0 },
      xp: { type: Number, default: 0 },
    },
    submissions: [
      {
        userId: { type: String, required: true, ref: "User" },
        content: { type: String, required: true },
        mediaUrls: [{ type: String }],
        submittedAt: { type: Date, default: Date.now },
      },
    ],
    result: {
      winnerId: { type: String, ref: "User" },
      reason: { type: String },
      decidedAt: { type: Date },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export default mongoose.models.Challenge || mongoose.model<IChallenge>("Challenge", ChallengeSchema)
