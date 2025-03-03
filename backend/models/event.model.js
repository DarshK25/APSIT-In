import mongoose from "mongoose";
const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    club: { type: String, required: true },
    createdBy: { type: String, required: true } // Email of the admin/moderator
}, { timestamps: true });

const Event = mongoose.model("Event", eventSchema);
export default Event;
