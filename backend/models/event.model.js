import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    category: {
        type: String,
        required: false
    },
    image: {
        type: String,
        default: ""
    },
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    maxAttendees: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    registrationDeadline: {
        type: Date,
        required: true
    },
    tags: [{
        type: String
    }],
    department: {
        type: String,
        required: true
    },
    requirements: {
        type: String,
        default: ""
    },
    registrationFormLink: {
        type: String,
        default: ""
    },
    isPublished: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Add index for better query performance
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ department: 1 });

const Event = mongoose.model("Event", eventSchema);

export default Event;
