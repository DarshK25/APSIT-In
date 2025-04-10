import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (value) {
                // Ensures email is from the APSIT domain
                return /@apsit.edu.in$/.test(value);
            },
            message: "Email must belong to the domain '@apsit.edu.in'"
        }
    },
    password: { type: String, required: true },
    profilePicture: { 
        type: String, 
        default: function() {
            return `https://api.dicebear.com/7.x/avatars/svg?seed=${this._id}`;
        }
    },
    bannerImg: { 
        type: String, 
        default: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
    },
    isAlumni: { type: Boolean, default: false },
    role: { type: String, enum: ['student', 'teacher', 'hod', 'staff'], default: 'student' },
    headline: { type: String, default: "APSIT Student" },
    location: { type: String, default: "Maharashtra, India" },
    about: { type: String, default: "I am a Student at APSIT" },
    skills: { type: [String], default: [] },
    studentId: {
        type: Number,
        match: /^[0-9]{8}$/, // Validate that student ID is 8 digits
        validate: {
            validator: function (value) {
                // Extract the first 8 digits of the email prefix (before @apsit.edu.in)
                const emailPrefix = this.email.split('@')[0];
                // Check if studentId matches the first 8 digits of the email prefix
                return value === emailPrefix.substring(0, 8);
            },
            message: 'Student ID must match the first 8 digits of the email prefix',
        },
    },
    projects: [
        {
            title: { type: String, required: true },
            description: { type: String, required: true },
            projectUrl: { type: String, match: /^https?:\/\/.+/ },
            repoUrl: { type: String, match: /^https?:\/\/.+/ },
            technologies: [{ type: String }],
            images: [{ type: String }],
            videos: [{ type: String }],
            startDate: { type: Date },
            endDate: { type: Date },
            isOngoing: { type: Boolean, default: false },
            collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
        }
    ],
    experience: [{
        title: { type: String },
        company: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        description: { type: String }
    }],
    education: [{
        title: { type: String },
        school: { type: String },
        startYear: { type: Number },
        endYear: { type: Number }
    }],
    department: {
         type: String,
         enum : [
            'Computer Engineering',
            'Information Technology',
            'Computer Science & Engineering: Data Science', 
            'Computer Science & Engineering: Artificial Intelligence & Machine Learning', 
            'Civil Engineering',
            'Mechanical Engineering',
        ],
        required: false,
        default: null
    },
    yearOfStudy: { 
        type: String,
        enum: ["First Year", "Second Year", "Third Year", "Fourth Year"],
        required: false,
        default: null
    },
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, {
    timestamps: true // automatically adds createdAt and updatedAt fields
});

const User = mongoose.model("User", userSchema); // Creates or uses the "User" collection
export default User;
