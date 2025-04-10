import mongoose from "mongoose";

const messageRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    initialMessage: {
      content: String,
      fileUrl: String,
      fileName: String,
      fileSize: Number,
      fileType: String,
      timestamp: {
        type: Date,
        default: Date.now,
      }
    }
  },
  { timestamps: true }
);

const MessageRequest = mongoose.model("MessageRequest", messageRequestSchema);

export default MessageRequest; 