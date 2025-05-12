import mongoose, { type Document, Schema } from "mongoose"

export interface IEvent extends Document {
  title: string
  description: string
  date: Date
  location: string
  imageUrl?: string
  isVirtual: boolean
  virtualLink?: string
  category: string
  attendees: mongoose.Types.ObjectId[]
  createdBy: mongoose.Types.ObjectId
  isAdminCreated: boolean
  createdAt: Date
  updatedAt: Date
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    isVirtual: {
      type: Boolean,
      default: false,
    },
    virtualLink: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    attendees: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      refPath: "creatorModel",
      required: true,
    },
    creatorModel: {
      type: String,
      enum: ["User", "Admin"],
      default: "User",
    },
    isAdminCreated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

export default mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema)
