import mongoose, { type Document, Schema } from "mongoose"

export interface IAdvertisement extends Document {
  title: string
  description: string
  imageUrl: string
  linkUrl: string
  startDate: Date
  endDate: Date
  targetAudience: string[]
  placement: string
  impressions: number
  clicks: number
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const AdvertisementSchema = new Schema<IAdvertisement>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    linkUrl: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    targetAudience: {
      type: [String],
      default: ["all"],
    },
    placement: {
      type: String,
      enum: ["sidebar", "feed", "profile", "all"],
      default: "all",
    },
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true },
)

export default mongoose.models.Advertisement || mongoose.model<IAdvertisement>("Advertisement", AdvertisementSchema)
