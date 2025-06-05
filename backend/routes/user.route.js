import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getSuggestedConnections, getPublicProfile, updateProfile, searchUsers, getUnreadCounts, getUserPosts, getUsersByBatch, addCertification, updateCertification, deleteCertification } from "../controllers/user.controller.js";
import Connection from "../models/connection.model.js";
import User from "../models/user.model.js";
const router = express.Router();

router.get("/unread-counts", protectRoute, getUnreadCounts);
router.get("/search", protectRoute, searchUsers);
router.get("/recommendations", protectRoute, getSuggestedConnections);
router.get("/suggestions", protectRoute, getSuggestedConnections);
router.post("/batch", protectRoute, getUsersByBatch);
router.get("/:username", protectRoute, getPublicProfile);
router.put("/profile", protectRoute, updateProfile);
router.get("/:username/posts", protectRoute, getUserPosts);

// Certification routes
router.post("/certifications", protectRoute, addCertification);
router.put("/certifications/:certificationId", protectRoute, updateCertification);
router.delete("/certifications/:certificationId", protectRoute, deleteCertification);

router.get("/debug/connections", protectRoute, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get connections from Connection model
        const connectionModelConnections = await Connection.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        }).populate('sender receiver');
        
        // Get user with populated connections
        const user = await User.findById(userId).populate('connections', 'name username profilePicture');
        
        res.json({
            success: true,
            userId,
            connectionModelConnections,
            userConnections: user?.connections || []
        });
    } catch (error) {
        console.error('Error in debug connections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get debug info',
            error: error.message
        });
    }
});

export default router;