import User from "../models/user.model.js"; 
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // for password hashing
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
//for example 123456 => SKefhjw_2jbjJB  

export const signup = async (req, res) => {
    try {
        const { name, username, email, password, accountType = "student" } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Validate email based on account type
        const emailPrefix = email.split('@')[0];
        let emailValid = false;
        
        switch(accountType) {
            case 'student':
                emailValid = /^\d{8}@apsit\.edu\.in$/i.test(email);
                break;
            case 'faculty':
                emailValid = /^[a-z]+@apsit\.edu\.in$/i.test(email);
                break;
            case 'club':
                emailValid = /^[a-z]+club@apsit\.edu\.in$/i.test(email);
                break;
            default:
                emailValid = false;
        }

        if (!emailValid) {
            return res.status(400).json({ 
                message: `Invalid email format for ${accountType} account` 
            });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Username already exists" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ 
            name, 
            username, 
            email, 
            password: hashedPassword, 
            accountType 
        });

        // Set account-specific defaults
        if (accountType === 'student') {
            newUser.studentId = emailPrefix.substring(0, 8);
        }

        await newUser.save();

        // Generate token and set cookie
        await generateTokenAndSetCookie(newUser._id, res);

        // Send welcome email
        try {
            const profileUrl = `http://localhost:5173/profile/${newUser.username}`;
            await sendWelcomeEmail(newUser.email, newUser.name, profileUrl);
        } catch (emailError) {
            console.error("Error in sending email:", emailError);
        }

        res.status(201).json({ 
            success: true, 
            message: "User registered successfully",
            user: {
                id: newUser._id,
                username: newUser.username,
                accountType: newUser.accountType
            }
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((err) => err.message);
            return res.status(400).json({ 
                success: false, 
                message: messages.join(", ") 
            });
        }
        console.error("Error in signup:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req, res) => {
	try {
		const { username, password } = req.body;

		// Check if user exists
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		// Check password
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		// Create and send token for user
		generateTokenAndSetCookie(user._id, res);

		res.json({ message: "Logged in successfully" });

        
	} catch (error) {
		console.error("Error in login controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const logout = (req, res) => {
	res.clearCookie("jwt-apsitin");
	res.json({ message: "Logged out successfully" });
};

export const getMe = (req, res) => {
    try {
      // Check if the user is authenticated (assuming the user object is attached to req)
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized. Please log in." });
      }
      // Send back user info
      res.status(200).json({
        success: true,
        data: req.user,  // Send the user object, which contains user details
      });
    } catch (error) {
      console.error("Error in getMe controller:", error); // Log error to console
      res.status(500).json({ message: "Server error" });
    }
  };
  