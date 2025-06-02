import Settings from '../models/Settings.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';

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
        const user = await User.findById(req.user._id).select('+password');
        
        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        // Send email notification
        await sendEmail({
            email: user.email,
            subject: 'Password Changed',
            message: 'Your password has been successfully changed. If you did not make this change, please contact support immediately.'
        });
        
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};