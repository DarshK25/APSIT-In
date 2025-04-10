import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        default: ""  // Changed from required to default empty string
    },
    isRead: {
        type: Boolean,
        default: false
    },
    fileUrl: {
        type: String
    },
    fileName: {
        type: String
    },
    fileSize: {
        type: Number
    },
    fileType: {
        type: String
    }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;