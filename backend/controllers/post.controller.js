import Post from "../models/post.model.js";

const getFeedPosts = async (req, res) => {
    try{
        const posts = await Posts.find({author:{$in: req.user.connections}}).populate("author").sort({createdAt: -1}).limit(10);
    } catch (error){
        console.error("Error in getFeedPosts: ", error);
        res.status(500).json({success:"false", message:"Server Error"});
    }
}