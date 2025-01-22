import Post from "../models/post.model.js";
import cloudinary from "../lib/cloudinary.js";
import Notification from "../models/notification.nodel.js" 

const getFeedPosts = async (req, res) => {
    try{
        const newPost = await Post.find({author:{$in: req.user.connections}})
        .populate("author", "name username profilePicture headline")
        .populate("comments.user", "name profilePicture") //This method is used to populate the author field with the name, username, profilePicture, and headline of the user who created the post.
        .sort({createdAt: -1}); // ensures to get the latest posts first

        res.status(200).json({success: "true", newPost});
    } catch (error){
        console.error("Error in getFeedPosts: ", error);
        res.status(500).json({success:"false", message:"Server Error"});
    }
}

const createPost = async (req, res) => {
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

const getPostById = async (req, res) => {
    try{
        const post = await Post.findById(req.params.id)
        .populate("author", "name username profilePicture headline")
        .populate("comments.user", "name username profilePicture headline");
        if(!post){
            return res.status(404).json({success: false, message: "Post not found"});
        }
    } catch(error) {
        console.error("Error in getPost: ", error);
        res.status(500).json({success: false, message: "Server error"});
    }
}

const updatePost = async (req, res) => {
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

const deletePost = async (req, res) => {
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
        await post.findByIdAndDelete();
        res.status(200).json({success: true, message: "Post deleted successfully"});
    } catch(error) {
        console.error("Error in deletePost: ", error);
        res.status(500).json({success: false, message: "Server error"});
    }
}

const createComment = async (req, res) => {
    try{
        const { content } = req.body; 
        const post = await Post.findByIdAndUpdate(req.params.id, {
            $push: {
                comments: {
                    content,
                    user: req.user._id,
                }
            }}, {new: true}
        ).populate("author", "name username profilePicture headline");
        //todo: send notification to the author of the post and make sure that comment is not created by the author of the post
        //lets do it now
        if(post.author.toString() !== req.user._id.toString()){
            //send notification to the author of the post
            const notification = new Notification({
                recipient: post.author,
                type: "comment",
                relatedUser: req.user._id,
                relatedPost: req.params._id,
            });
            await notification.save();
            try {
                //todo: send an email to the author of the post
            } catch (error) {
                console.error("Error in sending email: ", error);
            }
        }
        res.status(200).json({success: true, message: "Comment created successfully", post}); 
    } catch(error){
        console.error("Error in createComment: ", error);
        res.status(500).json({success: false, message: "Server error"});
    }
}

export {getFeedPosts, createPost, getPostById, updatePost, deletePost, createComment};