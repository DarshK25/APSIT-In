import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";



export const getUsersForSidebar = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user._id }, connections: req.user._id }); // Get all users except the logged in user, but to ensure if they are only in the connections list
        res.json(users);
    } catch (error) {
        console.error("Error in getUsersForSidebar controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const me = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: me, recieverId: userToChatId }, // Get messages sent by me to the user
                { senderId: userToChatId ,recieverId: me }] // Get messages sent by the user to me
        });
        res.json(messages);
    } catch (error) {
        console.error("Error in getMessages controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const sendMessage = async (req, res) => {
    try{
        const { message, image } = req.body;
        const senderId = req.user._id;
        const { id: recieverId } = req.params.id;

        if(image){
            const result = cloudinary.uploader.upload(image);
            const imageUrl = result.secure_url;
        }

        const newMessage = new Message({
            senderId,
            recieverId,
            message,
            image: imageUrl,
        });

        await newMessage.save();

        //todo: real-time messaging => socket.io

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in sendMessage controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
} 