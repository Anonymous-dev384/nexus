import mongoose, { Schema, type Document } from "mongoose"

export interface IStory extends Document {
  userId: string
  mediaUrl: string
  mediaType: "image" | "video"
  caption?: string
  location?: string
  tags?: string[]
  viewers: string[]
  reactions: {
    userId: string
    type: "like" | "love" | "wow" | "haha" | "sad"
    createdAt: Date
  }[]
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const StorySchema = new Schema<IStory>(
  {
    userId: { type: String, required: true, ref: "User" },
    mediaUrl: { type: String, required: true },
    mediaType: {
      type: String,
      required: true,
      enum: ["image", "video"],
    },
    caption: { type: String },
    location: { type: String },
    tags: [{ type: String }],
    viewers: [{ type: String, ref: "User" }],
    reactions: [
      {
        userId: { type: String, required: true, ref: "User" },
        type: {
          type: String,
          required: true,
          enum: ["like", "love", "wow", "haha", "sad"],
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export default mongoose.models.Story || mongoose.model<IStory>("Story", StorySchema)
