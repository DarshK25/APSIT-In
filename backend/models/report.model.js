import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ['chat', 'post', 'profile'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    },
    reason: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const Report = mongoose.model("Report", reportSchema);

export default Report; 