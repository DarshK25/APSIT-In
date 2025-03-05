import Notification from "../models/notification.model.js";

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
