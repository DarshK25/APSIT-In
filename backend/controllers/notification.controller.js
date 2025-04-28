import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const getUserNotifications = async (req, res) => {
	try {
		const notifications = await Notification.find({ recipient: req.user._id })
			.sort({ createdAt: -1 })
			.populate("sender", "name username profilePicture")
			.populate("post", "content image");

		res.json({
			success: true,
			data: notifications
		});
	} catch (error) {
		console.error("Error in getUserNotifications controller:", error);
		res.status(500).json({ 
			success: false, 
			message: "Server error",
			error: error.message 
		});
	}
};

export const markNotificationAsRead = async (req, res) => {
	try {
		const notification = await Notification.findOneAndUpdate(
			{ 
				_id: req.params.id, 
				recipient: req.user._id 
			},
			{ read: true },
			{ new: true }
		);

		if (!notification) {
			return res.status(404).json({
				success: false,
				message: "Notification not found"
			});
		}

		res.json({
			success: true,
			data: notification
		});
	} catch (error) {
		console.error("Error in markNotificationAsRead controller:", error);
		res.status(500).json({ 
			success: false, 
			message: "Server error",
			error: error.message 
		});
	}
};

export const markAllAsRead = async (req, res) => {
	try {
		await Notification.updateMany(
			{ recipient: req.user._id, read: false },
			{ read: true }
		);

		res.json({
			success: true,
			message: "All notifications marked as read"
		});
	} catch (error) {
		console.error("Error in markAllAsRead controller:", error);
		res.status(500).json({ 
			success: false, 
			message: "Server error",
			error: error.message 
		});
	}
};

export const deleteNotification = async (req, res) => {
	try {
		const notification = await Notification.findOneAndDelete({
			_id: req.params.id,
			recipient: req.user._id
		});

		if (!notification) {
			return res.status(404).json({
				success: false,
				message: "Notification not found"
			});
		}

		res.json({
			success: true,
			message: "Notification deleted successfully"
		});
	} catch (error) {
		console.error("Error in deleteNotification controller:", error);
		res.status(500).json({ 
			success: false, 
			message: "Server error",
			error: error.message 
		});
	}
};

export const deleteAllNotifications = async (req, res) => {
	try {
		await Notification.deleteMany({ recipient: req.user._id });

		res.json({
			success: true,
			message: "All notifications cleared"
		});
	} catch (error) {
		console.error("Error in deleteAllNotifications controller:", error);
		res.status(500).json({ 
			success: false, 
			message: "Server error",
			error: error.message 
		});
	}
};

export const createNotification = async (req, res) => {
	try {
		const { recipient, type, content, relatedId, relatedModel } = req.body;
		
		if (!recipient || !type || !content) {
			return res.status(400).json({
				success: false,
				message: "Missing required fields: recipient, type, content"
			});
		}
		
		// Check if recipient exists
		const recipientExists = await User.findById(recipient);
		if (!recipientExists) {
			return res.status(404).json({
				success: false,
				message: "Recipient user not found"
			});
		}
		
		const notification = new Notification({
			recipient,
			type,
			content,
			relatedId,
			relatedModel,
			isRead: false,
			timestamp: new Date()
		});
		
		await notification.save();
		
		// Emit socket event for real-time notification if socket IO is available
		if (req.app.get('io')) {
			req.app.get('io').to(recipient.toString()).emit('notification', {
				notification: {
					_id: notification._id,
					type: notification.type,
					content: notification.content,
					isRead: notification.isRead,
					timestamp: notification.timestamp
				}
			});
		}
		
		res.status(201).json({
			success: true,
			data: notification
		});
		
	} catch (error) {
		console.error("Error creating notification:", error);
		res.status(500).json({
			success: false,
			message: "Server error while creating notification"
		});
	}
};

export const getNotifications = async (req, res) => {
	try {
		const userId = req.user._id;
		
		const notifications = await Notification.find({ recipient: userId })
			.sort({ timestamp: -1 }) // Most recent first
			.limit(30); // Limit to 30 notifications
		
		res.json({
			success: true,
			data: notifications
		});
	} catch (error) {
		console.error("Error fetching notifications:", error);
		res.status(500).json({
			success: false,
			message: "Server error while fetching notifications"
		});
	}
};

export const markAsRead = async (req, res) => {
	try {
		const { notificationId } = req.params;
		
		const notification = await Notification.findById(notificationId);
		if (!notification) {
			return res.status(404).json({
				success: false,
				message: "Notification not found"
			});
		}
		
		// Check if the notification belongs to the current user
		if (notification.recipient.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "You don't have permission to update this notification"
			});
		}
		
		notification.isRead = true;
		await notification.save();
		
		res.json({
			success: true,
			data: notification
		});
	} catch (error) {
		console.error("Error marking notification as read:", error);
		res.status(500).json({
			success: false,
			message: "Server error while updating notification"
		});
	}
};

export const getUnreadCount = async (req, res) => {
	try {
		const userId = req.user._id;
		
		const count = await Notification.countDocuments({
			recipient: userId,
			isRead: false
		});
		
		res.json({
			success: true,
			data: { count }
		});
	} catch (error) {
		console.error("Error counting unread notifications:", error);
		res.status(500).json({
			success: false,
			message: "Server error while counting notifications"
		});
	}
};
