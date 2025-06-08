import Settings from '../models/settings.model.js';
import User from '../models/user.model.js';
import sendMail from '../lib/sendMail.js';
import bcrypt from 'bcryptjs';
import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';
import Connection from '../models/connection.model.js';
import Notification from '../models/notification.model.js';
import Message from '../models/message.model.js';

export const getSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne({ user: req.user._id });
        if (!settings) {
            // Create default settings if none exist
            const newSettings = await Settings.create({ user: req.user._id });
            return res.status(200).json({ success: true, data: newSettings });
        }
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const settings = await Settings.findOneAndUpdate(
            { user: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!settings) {
            return res.status(404).json({ success: false, error: 'Settings not found' });
        }
        
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Find user and explicitly select password field
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update only the password field using findByIdAndUpdate
        await User.findByIdAndUpdate(
            req.user._id,
            { password: hashedPassword },
            { runValidators: false } // Disable validators for this update
        );
        
        // Send email notification
        await sendMail(
            user.email,
            'Password Changed',
            'Your password has been successfully changed. If you did not make this change, please contact support immediately.',
            '<p>Your password has been successfully changed. If you did not make this change, please contact support immediately.</p>'
        );
        
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteAccount = async(req, res) => {
    try {
        const { currentPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');
        
        if(!user) {
            return res.status(404).json({success: false, error: 'User not found.'});
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if(!isMatch) {
            return res.status(401).json({success: false, error: 'Current password is incorrect.'});
        }

        // Delete user's posts
        await Post.deleteMany({ author: user._id });

        // Delete user's comments
        await Comment.deleteMany({ author: user._id });

        // Delete user's connections
        await Connection.deleteMany({ 
            $or: [
                { sender: user._id },
                { receiver: user._id }
            ]
        });

        // Delete user's notifications
        await Notification.deleteMany({
            $or: [
                { recipient: user._id },
                { sender: user._id }
            ]
        });

        // Delete user's messages
        await Message.deleteMany({
            $or: [
                { sender: user._id },
                { receiver: user._id }
            ]
        });

        // Finally, delete the user account
        await User.findByIdAndDelete(user._id);

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully.'
        });
    } catch (error) {
        console.error('Error in Deleting Account: ', error);
        res.status(500).json({
            success: false, 
            error: 'An error occurred while deleting your account. Please try again.'
        });
    }
}