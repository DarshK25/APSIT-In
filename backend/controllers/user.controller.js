import cloudinary from "../lib/cloudinary.js";
import User from "../models/user.model.js"
import Notification from "../models/notification.model.js";
import Message from "../models/message.model.js";
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import ConnectionRequest from "../models/connectionRequest.model.js";
import bcrypt from "bcrypt";
import Settings from "../models/settings.model.js";

// Only get the users that are not in my connection, not myself, and don't have pending requests
export const getSuggestedConnections = async (req, res) => {
    try {
        const userId = req.user._id;
        const currentUser = await User.findById(userId);

        if (!currentUser) {
            return res.status(404).json({ 
                success: false, 
                message: "Current user not found" 
            });
        }

        // Get pending connection requests to exclude those users
        const pendingRequests = await ConnectionRequest.find({
            $or: [
                { sender: userId, status: 'pending' },
                { recipient: userId, status: 'pending' }
            ]
        });

        // Get users to exclude (current connections and users with pending requests)
        const pendingUserIds = pendingRequests.map(request => 
            request.sender.toString() === userId.toString() ? request.recipient : request.sender
        );
        const usersToExclude = [...currentUser.connections, ...pendingUserIds, userId];

        console.log('Users to exclude:', usersToExclude.length);
        console.log('Current user department:', currentUser.department);

        // First, try to find users with mutual connections
        const mutualConnections = await User.find({
            _id: { $nin: usersToExclude },
            connections: { $in: currentUser.connections }
        })
        .select('name username profilePicture headline department yearOfStudy connections')
        .limit(5);

        console.log('Found mutual connections:', mutualConnections.length);

        let recommendedUsers = mutualConnections;

        // If we don't have enough mutual connections, add users from the same department
        if (recommendedUsers.length < 5 && currentUser.department) {
            const departmentUsers = await User.find({
                _id: { $nin: [...usersToExclude, ...recommendedUsers.map(u => u._id)] },
                department: currentUser.department
            })
            .select('name username profilePicture headline department yearOfStudy connections')
            .limit(5 - recommendedUsers.length);

            console.log('Found department users:', departmentUsers.length);
            recommendedUsers = [...recommendedUsers, ...departmentUsers];
        }

        // If we still don't have enough recommendations, add random users
        if (recommendedUsers.length < 5) {
            const randomUsers = await User.find({
                _id: { $nin: [...usersToExclude, ...recommendedUsers.map(u => u._id)] }
            })
            .select('name username profilePicture headline department yearOfStudy connections')
            .limit(5 - recommendedUsers.length);

            console.log('Found random users:', randomUsers.length);
            recommendedUsers = [...recommendedUsers, ...randomUsers];
        }

        // Sort users by number of mutual connections
        recommendedUsers = recommendedUsers.map(user => {
            const mutualCount = user.connections.filter(connId => 
                currentUser.connections.includes(connId)
            ).length;
            return { ...user.toObject(), mutualConnections: mutualCount };
        }).sort((a, b) => b.mutualConnections - a.mutualConnections);

        console.log('Total recommended users:', recommendedUsers.length);

        res.json({
            success: true,
            data: recommendedUsers
        });
    } catch (error) {
        console.error('Error in getSuggestedConnections:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error getting suggested connections' 
        });
    }
};

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
            "skills", "studentId", "projects", "experience", "education", "yearOfStudy", "department",
            "designation", "subjects", "clubType", "foundedDate", "onboardingComplete"
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

        res.json({ success: true, data: user });
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
        const unreadConnectionRequestsCount = await ConnectionRequest.countDocuments({
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
        .select("name username profilePicture headline department yearOfStudy isAlumni education")
        .limit(10);

        // Process users to determine alumni status from education
        const processedUsers = users.map(user => {
            const isAlumniFromEducation = user.education?.some(edu => {
                if (!edu.endYear) return false;
                return parseInt(edu.endYear) < new Date().getFullYear();
            });

            return {
                ...user.toObject(),
                isAlumni: user.isAlumni || isAlumniFromEducation
            };
        });

        res.json({
            success: true,
            data: processedUsers
        });
    } catch (error) {
        console.error("Error in searchUsers: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const posts = await Post.find({ author: user._id })
            .sort({ createdAt: -1 }) // Newest first
            .populate('author', 'name profilePicture'); 

        res.json({ success: true, posts });
    } catch (err) {
        console.error("Error in getUserPosts: ", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getUsersByBatch = async (req, res) => {
    try {
        const { userIds } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Valid array of userIds is required" 
            });
        }

        const users = await User.find({ _id: { $in: userIds } })
            .select("name username profilePicture headline department yearOfStudy");

        return res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error("Error in getUsersByBatch: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user._id;

        // Find user and explicitly select password field
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Incorrect password' });
        }

        // Delete user's posts
        await Post.deleteMany({ author: userId });

        // Delete user's comments
        await Comment.deleteMany({ author: userId });

        // Delete user's connection requests
        await ConnectionRequest.deleteMany({
            $or: [{ sender: userId }, { recipient: userId }]
        });

        // Remove user from others' connections
        await User.updateMany(
            { connections: userId },
            { $pull: { connections: userId } }
        );

        // Delete user's notifications
        await Notification.deleteMany({
            $or: [{ recipient: userId }, { sender: userId }]
        });

        // Delete user's settings
        await Settings.deleteOne({ user: userId });

        // Finally, delete the user
        await User.findByIdAndDelete(userId);

        res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error in deleteAccount controller:', error);
        res.status(500).json({ success: false, error: 'Failed to delete account' });
    }
};

// Add certification
export const addCertification = async (req, res) => {
    try {
        const { title, issuer, date, credentialId, credentialUrl, imageUrl } = req.body;
        
        // Convert date string to Date object if it exists
        const formattedDate = date ? new Date(date) : undefined;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: {
                    certifications: {
                        title,
                        issuer,
                        date: formattedDate,
                        credentialId,
                        credentialUrl,
                        imageUrl
                    }
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(201).json({ success: true, data: user.certifications });
    } catch (error) {
        console.error('Error in addCertification:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update certification
export const updateCertification = async (req, res) => {
    try {
        const { certificationId } = req.params;
        const { title, issuer, date, credentialId, credentialUrl, imageUrl } = req.body;

        // Convert date string to Date object if it exists
        const formattedDate = date ? new Date(date) : undefined;

        const user = await User.findOneAndUpdate(
            { 
                _id: req.user._id,
                'certifications._id': certificationId 
            },
            {
                $set: {
                    'certifications.$.title': title,
                    'certifications.$.issuer': issuer,
                    'certifications.$.date': formattedDate,
                    'certifications.$.credentialId': credentialId,
                    'certifications.$.credentialUrl': credentialUrl,
                    'certifications.$.imageUrl': imageUrl
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'User or certification not found' });
        }

        res.status(200).json({ success: true, data: user.certifications });
    } catch (error) {
        console.error('Error in updateCertification:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Delete certification
export const deleteCertification = async (req, res) => {
    try {
        const { certificationId } = req.params;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $pull: {
                    certifications: { _id: certificationId }
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({ success: true, data: user.certifications });
    } catch (error) {
        console.error('Error in deleteCertification:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
