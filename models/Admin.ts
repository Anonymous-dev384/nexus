import mongoose, { type Document, Schema } from "mongoose"

export interface IAdmin extends Document {
  name: string
  username: string
  password: string
  role: "owner" | "admin" | "moderator"
  permissions: string[]
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "moderator"],
      default: "moderator",
    },
    permissions: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true },
)

export default mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema)
