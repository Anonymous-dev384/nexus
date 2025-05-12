import mongoose, { Schema, type Document } from "mongoose"

interface PollOption {
  text: string
  votes: string[] // Array of user IDs who voted for this option
}

interface CodeSnippet {
  language: string
  code: string
}

interface MusicEmbed {
  type: "spotify" | "soundcloud" | "audiomack" | "audio"
  url: string
  title?: string
  artist?: string
}

export interface IPost extends Document {
  authorId: string
  collaboratorIds?: string[]
  content: string
  media?: {
    type: "image" | "video"
    url: string
  }[]
  likes: string[]
  commentIds: string[]
  createdAt: Date
  isThread: boolean
  threadParentId?: string
  threadChildren?: string[]
  sentiment?: "happy" | "motivated" | "neutral" | "sad" | "angry"
  isPinned: boolean
  postType: "standard" | "poll" | "code" | "music" | "collab"
  pollData?: {
    question: string
    options: PollOption[]
    allowMultipleVotes: boolean
    expiresAt?: Date
  }
  codeSnippet?: CodeSnippet
  musicEmbed?: MusicEmbed
  tags: string[]
  visibility: "public" | "premium" | "followers"
}

const PostSchema = new Schema<IPost>(
  {
    authorId: { type: String, required: true },
    collaboratorIds: { type: [String] },
    content: { type: String, required: true },
    media: [
      {
        type: { type: String, enum: ["image", "video"], required: true },
        url: { type: String, required: true },
      },
    ],
    likes: { type: [String], default: [] },
    commentIds: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    isThread: { type: Boolean, default: false },
    threadParentId: { type: String },
    threadChildren: { type: [String], default: [] },
    sentiment: { type: String, enum: ["happy", "motivated", "neutral", "sad", "angry"] },
    isPinned: { type: Boolean, default: false },
    postType: { type: String, enum: ["standard", "poll", "code", "music", "collab"], default: "standard" },
    pollData: {
      question: { type: String },
      options: [
        {
          text: { type: String },
          votes: { type: [String], default: [] },
        },
      ],
      allowMultipleVotes: { type: Boolean, default: false },
      expiresAt: { type: Date },
    },
    codeSnippet: {
      language: { type: String },
      code: { type: String },
    },
    musicEmbed: {
      type: { type: String, enum: ["spotify", "soundcloud", "audiomack", "audio"] },
      url: { type: String },
      title: { type: String },
      artist: { type: String },
    },
    tags: { type: [String], default: [] },
    visibility: { type: String, enum: ["public", "premium", "followers"], default: "public" },
  },
  { timestamps: true },
)

export default mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema)
