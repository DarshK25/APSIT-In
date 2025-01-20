import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        author: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        content: {type: String},
        image: {type: String},
        likes:[{type: mongoose.Schema.Types.ObjectId, red: "User"}],
        comments: [{
            content:{},
            user:{},
            createdAt: {}
        }]
    },
    {timestamps: true}
);

const Post = mongoose.model("Post", postSchema);
export default Post;