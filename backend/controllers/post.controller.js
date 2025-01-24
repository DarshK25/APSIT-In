import Post from "../models/post.model.js";
import cloudinary from "../lib/cloudinary.js";
import Notification from "../models/notification.model.js" 
export const getFeedPosts = async (req, res) => {
    try{
        const newPost = await Post.find({
            $or: [
                { author: { $in: req.user.connections } }, // Posts from connections
                { author: req.user._id },                 // Posts by the current user
            ],
        })
        .populate("author", "name username profilePicture headline")
        .populate("comments.user", "name profilePicture")
        .sort({ createdAt: -1 });
        // ensures to get the latest posts first

        res.status(200).json({success: "true", newPost});
    } catch (error){
        console.error("Error in getFeedPosts: ", error);
        res.status(500).json({success:"false", message:"Server Error"});
    }
}

export const createPost = async (req, res) => {
    try{
        const { content, image } = req.body;
        const post = new Post({
            author: req.user._id,
            content,
        });
        if(image){
            const result = await cloudinary.uploader.upload(image);
            post.image = result.secure_url;
        }
        await post.save();
        res.status(201).json({success: true,message: "Created a Post successfully", post});
    } catch (error) {
        console.error("Error in createPost: ", error);
        res.status(500).json({success: false, message: "Sever error"});
    }
}

export const getPostById = async (req, res) => {
    try{
        const post = await Post.findById(req.params.id)
        .populate("author", "name username profilePicture headline")
        .populate("comments.user", "name username profilePicture headline");
        if(!post){
            return res.status(404).json({success: false, message: "Post not found"});
        }
        res.status(200).json({success: true, post});
    } catch(error) {
        console.error("Error in getPost: ", error);
        res.status(500).json({success: false, message: "Server error"});
    }
}

export const updatePost = async (req, res) => {
    try{
        const post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({success: false, message: "Post not found"});
        }
        if(post.author.toString() !== req.user._id.toString()){
            return res.status(403).json({success: false, message: "You are not authorized to update this post."});
        }
        const updates = { content: req.body.content };
        if(req.body.image){
            const result = await cloudinary.uploader.upload(req.body.image);
            updates.image = result.secure_url;
        }
        const updatedPost = await Post.findByIdAndUpdate(req.params.id, updates, {new: true});
        res.status(200).json({success: true, message: "Post updated successfully", post});
    } catch (error) {
        console.error("Error in updatePost: ", error);
        res.status(500).json({success: false, message: "Server error"});
    }
}

export const deletePost = async (req, res) => {
    try{
        const post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({success: false, message: "Post not found"});
        }
        if(post.author.toString() !== req.user._id.toString()){
            return res.status(401).json({success: false, message: "You are not authorized to delete this post"});
        }
        if(post.image){
            //https://res.cloudinary.com/<cloud_name>/image/upload/<public_id>.png
            await cloudinary.uploader.destroy(post.image.split("/").pop().//split the image URL by "/" and get the last element which is the public_id of the image
            split(".")[0]); //split the public_id by "." and extension => ["public_id", "extension"]
        }
        await Post.findByIdAndDelete(req.params.id); //Post here is not the post, but the model
        res.status(200).json({success: true, message: "Post deleted successfully"});
    } catch(error) {
        console.error("Error in deletePost: ", error);
        res.status(500).json({success: false, message: "Server error"});
    }
}

export const likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        const isLiked = post.likes.includes(req.user._id);
        if (isLiked) {
            post.likes.pull(req.user._id);
        } else {
            post.likes.push(req.user._id);
        }

        await post.save();
        res.status(200).json({ success: true, likes: post.likes });
    } catch (error) {
        console.error("Error in likePost: ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

