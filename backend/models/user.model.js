import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{ type: String, required: true },
    username:{ type: String, required: true, unique:true },
    email:{ type: String, required: true, unique:true, contains : "@apsit.edu.in"}, // for making a compulsion to login through college email, the syntax is 
    password:{ type: String, required:true },
    profilePicture: { type: String, default:" " },
    bannerImg: { type: String, default:" " },
    headline: { type: String, default: "APSIT Student"}, //A position or a enthusiast
    location: { type: String, default: "Maharashtra, India"},
    about: { type: String, default: "I am a Student at APSIT"},
    skills: [String] ,
    moodleId:{type: Number, },
    projects: {title: String, description: String, link: String},
    experience: { title: String, company: String, startDate: Date, endDate: Date, description: String },
    education: { title: String, school: String, startYear: Number, endYear: Number},
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }, //Comps, DS, etc 
    yearOfStudy: { type: mongoose.Schema.Types.ObjectId, ref: 'YearOfStudy' }, //1st/2nd/3rd/4th year or Alumni
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User"} ] // reference to other users
},{
    timestamps: true // gives us createdAt and updatedAt
});

const User = mongoose.model("User",userSchema) //This means User is the name of collection
export default User;