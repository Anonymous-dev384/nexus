import mongoose, { Schema, type Document } from "mongoose"

export interface IUser extends Document {
  uid: string
  username: string
  email: string
  displayName: string
  photoURL: string
  bio: string
  role: "user" | "verified" | "premium" | "admin"
  verificationStatus: {
    verified: boolean
    earningVerified: boolean
  }
  streak: number
  lastPostDate: Date | null
  level: number
  xp: number
  badges: string[]
  titles: string[]
  following: string[]
  followers: string[]
  discordId?: string
  discordUsername?: string
  discordAvatar?: string
  discordRoles?: string[]
  status: "online" | "busy" | "offline"
  theme: "light" | "dark" | "system" | string
  createdAt: Date
  premiumFeatures: {
    isActive: boolean
    expiresAt: Date | null
    exclusiveThemes: boolean
    extendedThreads: boolean
    premiumLoungeAccess: boolean
    maxPinnedPosts: number
    gifter?: string // UID of user who gifted premium
  }
  customization: {
    profileColor: string
    bannerImage: string
    profileSkin?: string
  }
  achievements: {
    name: string
    unlockedAt: Date
    icon: string
  }[]
  tokens: number // For gifting premium
  pinnedPosts: string[]
  referralInfo: {
    referralCode: string
    referredBy?: string
    referralCount: number
    lastReferralAt?: Date
  }
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    photoURL: { type: String, default: "" },
    bio: { type: String, default: "Hello, I'm new to NexusSphere!" },
    role: { type: String, enum: ["user", "verified", "premium", "admin"], default: "user" },
    verificationStatus: {
      verified: { type: Boolean, default: false },
      earningVerified: { type: Boolean, default: false },
    },
    streak: { type: Number, default: 0 },
    lastPostDate: { type: Date, default: null },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    badges: { type: [String], default: ["newcomer"] },
    titles: { type: [String], default: [] },
    following: { type: [String], default: [] },
    followers: { type: [String], default: [] },
    discordId: { type: String },
    discordUsername: { type: String },
    discordAvatar: { type: String },
    discordRoles: { type: [String] },
    status: { type: String, enum: ["online", "busy", "offline"], default: "online" },
    theme: { type: String, default: "dark" },
    createdAt: { type: Date, default: Date.now },
    premiumFeatures: {
      isActive: { type: Boolean, default: false },
      expiresAt: { type: Date, default: null },
      exclusiveThemes: { type: Boolean, default: false },
      extendedThreads: { type: Boolean, default: false },
      premiumLoungeAccess: { type: Boolean, default: false },
      maxPinnedPosts: { type: Number, default: 1 },
      gifter: { type: String },
    },
    customization: {
      profileColor: { type: String, default: "#7C3AED" },
      bannerImage: { type: String, default: "" },
      profileSkin: { type: String },
    },
    achievements: [
      {
        name: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
        icon: { type: String, required: true },
      },
    ],
    tokens: { type: Number, default: 0 },
    pinnedPosts: { type: [String], default: [] },
    referralInfo: {
      referralCode: { type: String, unique: true, sparse: true },
      referredBy: { type: String, ref: "User" },
      referralCount: { type: Number, default: 0 },
      lastReferralAt: { type: Date },
    },
  },
  { timestamps: true },
)

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
