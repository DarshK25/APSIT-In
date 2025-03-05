import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            required: true,
            enum: ["like", "comment", "connectionRequest", "connectionAccepted", "message"]
        },
        relatedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        relatedPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;