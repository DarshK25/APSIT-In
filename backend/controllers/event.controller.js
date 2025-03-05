import Event from "../models/event.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import authorizedEmails from "../middleware/event.middleware.js";

// Get all events with filters
export const getEvents = async (req, res) => {
    try {
        const {
            category,
            department,
            status,
            search,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = req.query;

        const query = {};

        // Apply filters
        if (category) query.category = category;
        if (department) query.department = department;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const skip = (page - 1) * limit;

        const events = await Event.find(query)
            .populate('organizer', 'name username profilePicture')
            .sort({ date: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Event.countDocuments(query);

        res.json({
            success: true,
            data: events,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error("Error in getEvents:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get single event
export const getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name username profilePicture')
            .populate('attendees', 'name username profilePicture');

        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        res.json({ success: true, data: event });
    } catch (error) {
        console.error("Error in getEvent:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Create new event
export const createEvent = async (req, res) => {
    try {
        const eventData = { ...req.body, organizer: req.user._id };

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            eventData.image = result.secure_url;
        }

        const event = await Event.create(eventData);
        const populatedEvent = await event.populate('organizer', 'name username profilePicture');

        res.status(201).json({ success: true, data: populatedEvent });
    } catch (error) {
        console.error("Error in createEvent:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Update event
export const updateEvent = async (req, res) => {
    try {
        console.log('Update Event Request Body:', req.body);
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Check if user is the organizer
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to update this event" });
        }

        const updateData = { ...req.body };
        console.log('Update Data:', updateData);

        // Validate date fields
        if (updateData.date) {
            try {
                updateData.date = new Date(updateData.date);
                if (isNaN(updateData.date.getTime())) {
                    throw new Error('Invalid date');
                }
            } catch (error) {
                console.error('Date validation error:', error);
                return res.status(400).json({ success: false, message: "Invalid date format" });
            }
        }

        if (updateData.registrationDeadline) {
            try {
                updateData.registrationDeadline = new Date(updateData.registrationDeadline);
                if (isNaN(updateData.registrationDeadline.getTime())) {
                    throw new Error('Invalid registration deadline');
                }
            } catch (error) {
                console.error('Registration deadline validation error:', error);
                return res.status(400).json({ success: false, message: "Invalid registration deadline format" });
            }
        }

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            updateData.image = result.secure_url;
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('organizer', 'name username profilePicture');

        console.log('Updated Event:', updatedEvent);
        res.json({ success: true, data: updatedEvent });
    } catch (error) {
        console.error("Error in updateEvent:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server Error", 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Delete event
export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Check if user is the organizer
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this event" });
        }

        await event.deleteOne();

        res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error in deleteEvent:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Register for event
export const registerForEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Check if registration is closed
        if (new Date() > new Date(event.registrationDeadline)) {
            return res.status(400).json({ success: false, message: "Registration deadline has passed" });
        }

        // Check if event is full
        if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
            return res.status(400).json({ success: false, message: "Event is full" });
        }

        // Check if user is already registered
        if (event.attendees.includes(req.user._id)) {
            return res.status(400).json({ success: false, message: "Already registered for this event" });
        }

        event.attendees.push(req.user._id);
        await event.save();

        res.json({ success: true, message: "Successfully registered for event" });
    } catch (error) {
        console.error("Error in registerForEvent:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Unregister from event
export const unregisterFromEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Check if user is registered
        if (!event.attendees.includes(req.user._id)) {
            return res.status(400).json({ success: false, message: "Not registered for this event" });
        }

        event.attendees = event.attendees.filter(
            attendee => attendee.toString() !== req.user._id.toString()
        );
        await event.save();

        res.json({ success: true, message: "Successfully unregistered from event" });
    } catch (error) {
        console.error("Error in unregisterFromEvent:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get user's registered events
export const getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({
            attendees: req.user._id,
            date: { $gte: new Date() }
        })
        .populate('organizer', 'name username profilePicture')
        .sort({ date: 1 });

        res.json({ success: true, data: events });
    } catch (error) {
        console.error("Error in getMyEvents:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get events organized by user
export const getOrganizedEvents = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user._id })
            .populate('organizer', 'name username profilePicture')
            .sort({ date: -1 });

        res.json({ success: true, data: events });
    } catch (error) {
        console.error("Error in getOrganizedEvents:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};