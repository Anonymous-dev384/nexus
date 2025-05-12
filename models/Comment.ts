import mongoose, { Schema, type Document } from "mongoose"

export interface IComment extends Document {
  postId: string
  authorId: string
  content: string
  likes: string[]
  createdAt: Date
  parentCommentId?: string // For nested comments
}

const CommentSchema = new Schema<IComment>(
  {
    postId: { type: String, required: true },
    authorId: { type: String, required: true },
    content: { type: String, required: true },
    likes: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    parentCommentId: { type: String }, // For nested comments
  },
  { timestamps: true },
)

export default mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema)
