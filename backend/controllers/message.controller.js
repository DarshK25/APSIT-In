import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import Report from "../models/report.model.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user._id }, connections: req.user._id }); // Get all users except the logged in user, but to ensure if they are only in the connections list
        res.json(users);
    } catch (error) {
        console.error("Error in getUsersForSidebar controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Get all conversations for the current user
export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get all messages where user is either sender or recipient
        const messages = await Message.find({
            $or: [{ sender: userId }, { recipient: userId }]
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'name username profilePicture')
        .populate('recipient', 'name username profilePicture');

        // Group messages by conversation
        const conversations = messages.reduce((acc, message) => {
            const otherUser = message.sender._id.toString() === userId.toString() 
                ? message.recipient 
                : message.sender;
            
            const conversationId = otherUser._id.toString();
            
            if (!acc[conversationId]) {
                acc[conversationId] = {
                    user: otherUser,
                    lastMessage: message,
                    unreadCount: message.recipient._id.toString() === userId.toString() && !message.isRead ? 1 : 0
                };
            } else if (message.recipient._id.toString() === userId.toString() && !message.isRead) {
                acc[conversationId].unreadCount++;
            }
            
            return acc;
        }, {});

        res.json({
            success: true,
            data: Object.values(conversations)
        });
    } catch (error) {
        console.error("Error in getConversations: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get messages between current user and another user
export const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        // Mark all messages as read
        await Message.updateMany(
            { 
                sender: userId,
                recipient: currentUserId,
                isRead: false
            },
            { isRead: true }
        );

        // Get messages between the two users
        const messages = await Message.find({
            $or: [
                { sender: currentUserId, recipient: userId },
                { sender: userId, recipient: currentUserId }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('sender', 'name username profilePicture')
        .populate('recipient', 'name username profilePicture');

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error("Error in getMessages: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        const senderId = req.user._id;

        if (!content?.trim()) {
            return res.status(400).json({ success: false, message: "Message content is required" });
        }

        const message = await Message.create({
            sender: senderId,
            recipient: recipientId,
            content
        });

        const populatedMessage = await message.populate([
            { path: 'sender', select: 'name username profilePicture' },
            { path: 'recipient', select: 'name username profilePicture' }
        ]);

        res.json({
            success: true,
            data: populatedMessage
        });
    } catch (error) {
        console.error("Error in sendMessage: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const muteChat = async (req, res) => {
    try {
        const { userId } = req.params;
        const { muted } = req.body;
        const currentUserId = req.user._id;

        // Update user's muted chats in their preferences/settings
        await User.findByIdAndUpdate(currentUserId, {
            $set: { [`mutedChats.${userId}`]: muted }
        });

        res.json({
            success: true,
            message: muted ? 'Chat muted successfully' : 'Chat unmuted successfully'
        });
    } catch (error) {
        console.error("Error in muteChat: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const reportUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const reporterId = req.user._id;

        // Create a report record
        // This is a basic implementation - you might want to add more fields and validation
        await Report.create({
            reportedUser: userId,
            reportedBy: reporterId,
            type: 'chat',
            status: 'pending'
        });

        res.json({
            success: true,
            message: 'User reported successfully'
        });
    } catch (error) {
        console.error("Error in reportUser: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        // Add user to blocked list
        await User.findByIdAndUpdate(currentUserId, {
            $addToSet: { blockedUsers: userId }
        });

        // Remove connection if exists
        await User.findByIdAndUpdate(currentUserId, {
            $pull: { connections: userId }
        });

        await User.findByIdAndUpdate(userId, {
            $pull: { connections: currentUserId }
        });

        res.json({
            success: true,
            message: 'User blocked successfully'
        });
    } catch (error) {
        console.error("Error in blockUser: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const deleteChat = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        // Delete all messages between the two users
        await Message.deleteMany({
            $or: [
                { sender: currentUserId, recipient: userId },
                { sender: userId, recipient: currentUserId }
            ]
        });

        res.json({
            success: true,
            message: 'Chat deleted successfully'
        });
    } catch (error) {
        console.error("Error in deleteChat: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const markMessagesAsRead = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        // Mark all messages from this user as read
        const result = await Message.updateMany(
            { 
                sender: userId,
                recipient: currentUserId,
                isRead: false
            },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'Messages marked as read',
            updatedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("Error in markMessagesAsRead: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}; 