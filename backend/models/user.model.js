import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Common fields for all account types
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        if (this.accountType === 'student') {
          return /^\d{8}@apsit\.edu\.in$/.test(v);
        } else if (this.accountType === 'faculty') {
          return /^[a-z]+@apsit\.edu\.in$/.test(v);
        } else if (this.accountType === 'club') {
          return /^[a-z]+club@apsit\.edu\.in$/.test(v);
        }
        return true;
      },
      message: props => `${props.value} is not a valid email for this account type!`
    }
  },
  password: { type: String, required: true },
  accountType: { 
    type: String, 
    required: true,
    enum: ['student', 'faculty', 'club'],
    default: 'student'
  },
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
  headline: { 
    type: String, 
    default: function() {
      return this.accountType === 'student' ? "APSIT Student" :
             this.accountType === 'faculty' ? "APSIT Faculty" :
             "APSIT Club";
    }
  },
  location: { type: String, default: "Maharashtra, India" },
  about: { 
    type: String, 
    default: function() {
      return this.accountType === 'student' ? "I am a Student at APSIT" :
             this.accountType === 'faculty' ? "I am Faculty at APSIT" :
             "We are an official APSIT Club";
    }
  },
  skills: { type: [String], default: [] },
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Student-specific fields
  studentId: {
    type: Number,
    match: /^[0-9]{8}$/,
    validate: {
      validator: function(value) {
        if (this.accountType !== 'student') return true;
        const emailPrefix = this.email.split('@')[0];
        return value.toString() === emailPrefix.substring(0, 8);
      },
      message: 'Student ID must match the first 8 digits of the email prefix'
    }
  },
  isAlumni: { 
    type: Boolean, 
    default: false,
    validate: {
      validator: function(value) {
        if (this.accountType !== 'student') return true;
        return true;
      },
      message: 'Alumni status is only applicable to students'
    }
  },
  yearOfStudy: { 
    type: String,
    enum: ["First Year", "Second Year", "Third Year", "Fourth Year"],
    validate: {
      validator: function(value) {
        if (this.accountType !== 'student') return true;
        return true;
      },
      message: 'Year of study is only applicable to students'
    }
  },

  // Faculty-specific fields
  designation: {
    type: String,
    enum: [
      'Professor',
      'Associate Professor', 
      'Assistant Professor',
      'HOD',
      'Principal',
      'Visiting Faculty'
    ],
    validate: {
      validator: function(value) {
        if (this.accountType !== 'faculty') return true;
        return true;
      },
      message: 'Designation is only applicable to faculty'
    }
  },
  subjects: {
    type: [String],
    validate: {
      validator: function(value) {
        if (this.accountType !== 'faculty') return true;
        return true;
      },
      message: 'Subjects are only applicable to faculty'
    }
  },

  // Club-specific fields
  clubType: {
    type: String,
    enum: ['technical', 'cultural', 'sports', 'other'],
    validate: {
      validator: function(value) {
        if (this.accountType !== 'club') return true;
        return true;
      },
      message: 'Club type is only applicable to clubs'
    }
  },
  foundedDate: {
    type: Date,
    validate: {
      validator: function(value) {
        if (this.accountType !== 'club') return true;
        return true;
      },
      message: 'Founded date is only applicable to clubs'
    }
  },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['president', 'vice-president', 'secretary', 'member'] },
    joinDate: { type: Date, default: Date.now }
  }],

  // Shared academic fields
  department: {
    type: String,
    
    enum: [
      'Computer Engineering',
      'Information Technology',
      'Computer Science & Engineering: Data Science', 
      'Computer Science & Engineering: Artificial Intelligence & Machine Learning', 
      'Civil Engineering',
      'Mechanical Engineering'
    ]
  },

  // Common arrays
  projects: [{
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
  }],
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
  onboardingComplete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  // Add virtuals when converting to JSON
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for club members to improve query performance
userSchema.index({ 'members.userId': 1 });

// Virtual for profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
  const requiredFields = {
    student: ['name', 'email', 'department', 'yearOfStudy'],
    faculty: ['name', 'email', 'department', 'designation'],
    club: ['name', 'email', 'clubType', 'about']
  }[this.accountType] || [];

  const completedFields = requiredFields.filter(field => {
    if (Array.isArray(this[field])) return this[field].length > 0;
    return this[field] && this[field] !== "";
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
});

const User = mongoose.model("User", userSchema);
export default User;