const Event = require("../models/Event");

// Create an event
exports.createEvent = async (req, res) => {
    try {
        const { name, description, date, time, location, club } = req.body;
        const createdBy = req.user.email;

        const event = new Event({ name, description, date, time, location, club, createdBy });
        await event.save();

        res.status(201).json({ success: true, message: "Event created successfully", event });
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get all events
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).json({ success: true, events });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update an event
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Only the creator or an admin can update the event
        if (event.createdBy !== req.user.email && !authorizedEmails.admin.includes(req.user.email)) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        Object.assign(event, updates);
        await event.save();

        res.status(200).json({ success: true, message: "Event updated successfully", event });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Only the creator or an admin can delete the event
        if (event.createdBy !== req.user.email && !authorizedEmails.admin.includes(req.user.email)) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        await event.remove();
        res.status(200).json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
