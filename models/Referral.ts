import mongoose, { Schema, type Document } from "mongoose"

export interface IReferral extends Document {
  code: string
  userId: string
  referredUsers: string[]
  rewards: {
    type: "tokens" | "premium" | "badge" | "xp"
    amount: number
    claimed: boolean
    claimedAt?: Date
  }[]
  totalRewards: {
    tokens: number
    premiumDays: number
    xp: number
  }
  clicks: number
  createdAt: Date
  updatedAt: Date
}

const ReferralSchema = new Schema<IReferral>(
  {
    code: { type: String, required: true, unique: true },
    userId: { type: String, required: true, ref: "User" },
    referredUsers: [{ type: String, ref: "User" }],
    rewards: [
      {
        type: { type: String, enum: ["tokens", "premium", "badge", "xp"], required: true },
        amount: { type: Number, required: true },
        claimed: { type: Boolean, default: false },
        claimedAt: { type: Date },
      },
    ],
    totalRewards: {
      tokens: { type: Number, default: 0 },
      premiumDays: { type: Number, default: 0 },
      xp: { type: Number, default: 0 },
    },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export default mongoose.models.Referral || mongoose.model<IReferral>("Referral", ReferralSchema)
