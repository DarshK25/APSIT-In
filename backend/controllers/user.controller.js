import cloudinary from "../lib/cloudinary.js";
import User from "../models/user.model.js"
import Notification from "../models/notification.model.js";
import Message from "../models/message.model.js";
import Connection from "../models/connection.model.js";

// Only get the users that are not in my connection and is not myself
export const getSuggestedConnections = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id).select("connections");
        
        const suggestedUsers = await User.find({
            _id: {
                $ne: req.user._id, // $ne is not equal to in mongodb
                $nin: currentUser.connections // $nin is not in in mongodb
            }
        })
        .select("name username profilePicture headline department yearOfStudy")
        .limit(10); // Get the selected properties of the user and show only 10 users

        res.json({
            success: true,
            data: suggestedUsers.map(user => ({
                _id: user._id,
                name: user.name,
                username: user.username,
                headline: user.headline,
                profilePicture: user.profilePicture,
                department: user.department,
                yearOfStudy: user.yearOfStudy
            }))
        });
    } catch (error) {
        console.error("Error in getSuggestedConnections: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }   
}

export const getPublicProfile = async (req, res) => {
    try{
        const user = await User.findOne({username: req.params.username}).select("-password");
        if(!user){
            return res.status(404).json({success:"false", message:"User not found."});
        }
        res.json({success: "true", user});
    } catch(error) {
        console.error("Error in getPublicProfile: ", error);
        res.status(500).json({success:"false", message:"Server Error"});
    }   
}

export const updateProfile = async (req, res) => {
    try {
        const allowedFields = [
            "name", "username", "headline", "about", "location", "profilePicture", "bannerImg", 
            "skills", "studentId", "projects", "experience", "education", "yearOfStudy", "department"
        ];

        const updatedData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) { // Changed from if (req.body[field]) to handle empty arrays
                updatedData[field] = req.body[field];
            }
        }

        // Handle image uploads
        if (req.body.profilePicture && req.body.profilePicture.startsWith('data:')) {
            const result = await cloudinary.upload(req.body.profilePicture);
            updatedData.profilePicture = result.secure_url;
        }
        if (req.body.bannerImg && req.body.bannerImg.startsWith('data:')) {
            const result = await cloudinary.upload(req.body.bannerImg);
            updatedData.bannerImg = result.secure_url;
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updatedData },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({ success: true, message: "Profile updated Successfully.", user });
    } catch (error) {
        console.error("Error in updateProfile: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

// Get unread counts for notifications, messages, and connection requests
export const getUnreadCounts = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get unread notifications count
        const unreadNotificationCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        // Get unread messages count
        const unreadMessagesCount = await Message.countDocuments({
            recipient: userId,
            isRead: false
        });

        // Get pending connection requests count
        const unreadConnectionRequestsCount = await Connection.countDocuments({
            recipient: userId,
            status: 'pending'
        });

        res.json({
            success: true,
            data: {
                unreadNotificationCount,
                unreadMessagesCount,
                unreadConnectionRequestsCount
            }
        });
    } catch (error) {
        console.error("Error in getUnreadCounts: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Search users by name or username
export const searchUsers = async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) {
            return res.status(400).json({ success: false, message: "Search query is required" });
        }

        // Create a case-insensitive regex pattern
        const searchPattern = new RegExp(query, 'i');

        const users = await User.find({
            $and: [
                {
                    $or: [
                        { name: { $regex: searchPattern } },
                        { username: { $regex: searchPattern } }
                    ]
                },
                { _id: { $ne: req.user._id } } // Exclude current user from results
            ]
        })
        .select("name username profilePicture headline department yearOfStudy")
        .limit(10);

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error("Error in searchUsers: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

