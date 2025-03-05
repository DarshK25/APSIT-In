import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    replies: [replySchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        trim: true
    },
    image: {
        type: String
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    comments: [commentSchema]
}, {
    timestamps: true
});

// Add indexes for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ "comments.author": 1 });

const Post = mongoose.model("Post", postSchema);

export default Post;