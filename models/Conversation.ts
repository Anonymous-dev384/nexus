import mongoose, { Schema, type Document } from "mongoose"

export interface IConversation extends Document {
  participants: string[]
  lastMessageId?: string
  updatedAt: Date
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: { type: [String], required: true },
    lastMessageId: { type: String },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export default mongoose.models.Conversation || mongoose.model<IConversation>("Conversation", ConversationSchema)
