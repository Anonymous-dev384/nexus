import mongoose, { Schema, type Document } from "mongoose"

export interface INotification extends Document {
  userId: string
  type: "like" | "comment" | "follow" | "mention" | "system" | "gift" | "achievement"
  fromUserId?: string
  postId?: string
  commentId?: string
  content: string
  read: boolean
  createdAt: Date
  data?: any // Additional data specific to notification type
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true },
    type: {
      type: String,
      enum: ["like", "comment", "follow", "mention", "system", "gift", "achievement"],
      required: true,
    },
    fromUserId: { type: String },
    postId: { type: String },
    commentId: { type: String },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    data: { type: Schema.Types.Mixed }, // Additional data specific to notification type
  },
  { timestamps: true },
)

export default mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema)
