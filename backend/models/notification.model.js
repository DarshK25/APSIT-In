import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        type: {
            type: String,
            required: true,
            enum: ["like", "comment", "follow", "event", "post", "connectionRequest", "connectionAccepted", "message"]
        },
        message: {
            type: String,
            required: true
        },
        read: {
            type: Boolean,
            default: false
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        },
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event"
        }
    },
    { timestamps: true }
);

// Add indexes for better query performance
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;