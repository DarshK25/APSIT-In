import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import Report from "../models/report.model.js";
import MessageRequest from "../models/messageRequest.model.js";

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
            // Skip if either sender or recipient is null
            if (!message.sender || !message.recipient) {
                return acc;
            }

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

export const sendFile = async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        const senderId = req.user._id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // Upload file to cloudinary
        const fileBuffer = file.buffer;
        const fileBase64 = fileBuffer.toString('base64');
        const fileDataURI = `data:${file.mimetype};base64,${fileBase64}`;

        const uploadResult = await cloudinary.uploader.upload(fileDataURI, {
            resource_type: 'auto',
            folder: 'chat_files',
        });

        // Create message with file information and content
        const messageData = {
            sender: senderId,
            recipient: recipientId,
            content: content || "", // Always include content, empty string if not provided
            fileUrl: uploadResult.secure_url,
            fileName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype
        };

        const message = await Message.create(messageData);

        const populatedMessage = await message.populate([
            { path: 'sender', select: 'name username profilePicture' },
            { path: 'recipient', select: 'name username profilePicture' }
        ]);

        res.json({
            success: true,
            data: populatedMessage
        });
    } catch (error) {
        console.error("Error in sendFile: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getMessageRequestStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        // Check if users are connected
        const currentUser = await User.findById(currentUserId);
        if (currentUser.connections.includes(userId)) {
            return res.json({
                success: true,
                data: { canMessage: true }
            });
        }

        // Check for message request
        const request = await MessageRequest.findOne({
            $or: [
                { sender: currentUserId, recipient: userId },
                { sender: userId, recipient: currentUserId }
            ],
            status: 'pending'
        });

        if (request) {
            return res.json({
                success: true,
                data: {
                    canMessage: request.sender.toString() === currentUserId.toString(),
                    hasRequest: true,
                    isSender: request.sender.toString() === currentUserId.toString(),
                    requestId: request._id
                }
            });
        }

        res.json({
            success: true,
            data: { canMessage: true, hasRequest: false }
        });
    } catch (error) {
        console.error("Error in getMessageRequestStatus:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const sendMessageRequest = async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        const senderId = req.user._id;

        // Check if users are already connected
        const sender = await User.findById(senderId);
        if (sender.connections.includes(recipientId)) {
            return res.status(400).json({
                success: false,
                message: "Users are already connected"
            });
        }

        // Check if a request already exists
        const existingRequest = await MessageRequest.findOne({
            $or: [
                { sender: senderId, recipient: recipientId },
                { sender: recipientId, recipient: senderId }
            ],
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "A message request already exists"
            });
        }

        const messageRequest = new MessageRequest({
            sender: senderId,
            recipient: recipientId,
            initialMessage: { content }
        });

        // Handle file upload if present
        if (req.file) {
            const fileBuffer = req.file.buffer;
            const fileBase64 = fileBuffer.toString('base64');
            const fileDataURI = `data:${req.file.mimetype};base64,${fileBase64}`;

            const uploadResult = await cloudinary.uploader.upload(fileDataURI, {
                resource_type: 'auto',
                folder: 'message_requests',
            });

            messageRequest.initialMessage.fileUrl = uploadResult.secure_url;
            messageRequest.initialMessage.fileName = req.file.originalname;
            messageRequest.initialMessage.fileSize = req.file.size;
            messageRequest.initialMessage.fileType = req.file.mimetype;
        }

        await messageRequest.save();

        const populatedRequest = await messageRequest.populate([
            { path: 'sender', select: 'name username profilePicture' },
            { path: 'recipient', select: 'name username profilePicture' }
        ]);

        res.json({
            success: true,
            data: populatedRequest
        });
    } catch (error) {
        console.error("Error in sendMessageRequest:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const acceptMessageRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const currentUserId = req.user._id;

        const request = await MessageRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Message request not found"
            });
        }

        if (request.recipient.toString() !== currentUserId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to accept this request"
            });
        }

        // Create initial message
        const message = await Message.create({
            sender: request.sender,
            recipient: request.recipient,
            content: request.initialMessage.content,
            fileUrl: request.initialMessage.fileUrl,
            fileName: request.initialMessage.fileName,
            fileSize: request.initialMessage.fileSize,
            fileType: request.initialMessage.fileType,
            createdAt: request.initialMessage.timestamp
        });

        // Update request status
        request.status = 'accepted';
        await request.save();

        // Add users to each other's connections if not already connected
        await User.findByIdAndUpdate(currentUserId, {
            $addToSet: { connections: request.sender }
        });

        await User.findByIdAndUpdate(request.sender, {
            $addToSet: { connections: currentUserId }
        });

        res.json({
            success: true,
            data: {
                message: "Message request accepted",
                initialMessage: message
            }
        });
    } catch (error) {
        console.error("Error in acceptMessageRequest:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const rejectMessageRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const currentUserId = req.user._id;

        const request = await MessageRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Message request not found"
            });
        }

        if (request.recipient.toString() !== currentUserId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to reject this request"
            });
        }

        request.status = 'rejected';
        await request.save();

        res.json({
            success: true,
            message: "Message request rejected"
        });
    } catch (error) {
        console.error("Error in rejectMessageRequest:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}; 