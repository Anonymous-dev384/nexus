import mongoose, { Schema, type Document } from "mongoose"

export interface IMessage extends Document {
  conversationId: string
  senderId: string
  receiverId: string
  content: string
  read: boolean
  createdAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: String, required: true },
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export default mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema)
