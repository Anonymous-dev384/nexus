import mongoose, { Schema, type Document } from "mongoose"

export interface IQuest extends Document {
  title: string
  description: string
  type: "daily" | "weekly" | "achievement" | "special"
  difficulty: "easy" | "medium" | "hard" | "expert"
  requirements: {
    description: string
    type: "posts" | "likes" | "comments" | "follows" | "shares" | "login" | "custom"
    count: number
    customData?: any
  }[]
  rewards: {
    tokens: number
    xp: number
    badge?: string
    premium?: number // days
  }
  startDate?: Date
  endDate?: Date
  isRecurring: boolean
  recurringPeriod?: "daily" | "weekly" | "monthly"
  isActive: boolean
  completedBy: string[] // user IDs
  createdAt: Date
  updatedAt: Date
}

const QuestSchema = new Schema<IQuest>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "achievement", "special"],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard", "expert"],
    },
    requirements: [
      {
        description: { type: String, required: true },
        type: {
          type: String,
          required: true,
          enum: ["posts", "likes", "comments", "follows", "shares", "login", "custom"],
        },
        count: { type: Number, required: true },
        customData: { type: Schema.Types.Mixed },
      },
    ],
    rewards: {
      tokens: { type: Number, required: true },
      xp: { type: Number, required: true },
      badge: { type: String },
      premium: { type: Number }, // days
    },
    startDate: { type: Date },
    endDate: { type: Date },
    isRecurring: { type: Boolean, default: false },
    recurringPeriod: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
    },
    isActive: { type: Boolean, default: true },
    completedBy: [{ type: String, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export default mongoose.models.Quest || mongoose.model<IQuest>("Quest", QuestSchema)
