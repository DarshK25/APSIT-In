import User from "../models/user.model.js"; 
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // for password hashing
import { sendWelcomeEmail, sendPasswordResetEmail } from "../emails/emailHandlers.js";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import crypto from 'crypto'; // Import crypto for generating tokens
import { sendEmail } from '../utils/emailService.js';
//for example 123456 => SKefhjw_2jbjJB  

export const signup = async (req, res) => {
    try {
        const { name, username, email, password, accountType = "student" } = req.body;
        console.log("\n=== Signup Attempt Details ===");
        console.log("Name:", name);
        console.log("Username:", username);
        console.log("Email:", email);
        console.log("Account Type:", accountType);
        console.log("Raw Password:", password);

        if (!name || !username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Validate email based on account type
        const emailPrefix = email.split('@')[0];
        let emailValid = false;
        
        // Bypass email validation for specific admin email
        if (email === 'darshkalathiya25@gmail.com') {
            emailValid = true;
        } else {
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

        // Check for existing username with exact case match
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Username already exists" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        console.log("\n=== Creating New User ===");
        const newUser = new User({ 
            name, 
            username, // Store username with original case
            email, 
            password, // The pre-save middleware will hash this
            accountType 
        });

        // Set account-specific defaults
        if (email === 'darshkalathiya25@gmail.com') {
            newUser.studentId = 12345678; // Set a default studentId for admin email
        } else if (accountType === 'student') {
            newUser.studentId = emailPrefix.substring(0, 8);
        }

        console.log("User object before save:", {
            username: newUser.username,
            email: newUser.email,
            password: newUser.password // This should be the raw password before hashing
        });

        await newUser.save();
        
        console.log("\n=== User Saved to Database ===");
        console.log("User ID:", newUser._id);
        console.log("Username:", newUser.username);
        console.log("Stored Password Hash:", newUser.password);

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
        console.error("\n=== Signup Error ===", error);
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((err) => err.message);
            return res.status(400).json({ 
                success: false, 
                message: messages.join(", ") 
            });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req, res) => {
	try {
		const { username, password } = req.body;
        console.log("\n=== Login Attempt Details ===");
        console.log("Username provided:", username);
        console.log("Password provided:", password);

		// --- Start: Test Account Bypass ---
		const testEmail = 'darshkalathiya25@gmail.com'; // Use admin email as test email
		const testPassword = 'abcdef'; // Define the password for the admin email

		if (username === testEmail && password === testPassword) {
			const testUser = await User.findOne({ email: testEmail });

			if (testUser) {
				console.log("Backend: Admin account login successful via bypass!");
				
				// Send email notification for test account login
				try {
					const emailSubject = 'Test Account Login Alert';
					const emailContent = `
						<h2>Test Account Login Alert</h2>
						<p>Someone has logged in to the test account.</p>
						<p><strong>Login Details:</strong></p>
						<ul>
							<li>Time: ${new Date().toLocaleString()}</li>
							<li>IP Address: ${req.ip}</li>
							<li>User Agent: ${req.headers['user-agent']}</li>
						</ul>
						<p>Please monitor the account for any suspicious activity.</p>
					`;
					
					await sendEmail({
						to: 'darshkalathiya25@gmail.com',
						subject: emailSubject,
						html: emailContent
					});
					
					console.log("Test account login notification email sent successfully");
				} catch (emailError) {
					console.error("Failed to send test account login notification:", emailError);
					// Don't block login if email fails
				}

				generateTokenAndSetCookie(testUser._id, res);
				res.status(200).json({ success: true, message: "Logged in successfully as Admin Account" });
				return;
			} else {
				console.error("Backend: Admin account user not found in database. Cannot bypass, attempting standard login.");
			}
		}
		// --- End: Test Account Bypass ---

		// Check if user exists with exact username match (case-sensitive)
		const user = await User.findOne({ username });
        
        if (!user) {
            console.log("❌ No user found with username:", username);
            return res.status(400).json({ 
                success: false, 
                message: "Username not found. Please check your username or sign up if you don't have an account."
            });
        }

        console.log("\n=== User Found in Database ===");
        console.log("Username:", user.username);
        console.log("Email:", user.email);
        console.log("Account Type:", user.accountType);
        console.log("Stored Password Hash:", user.password);

		// Check password using the model's comparePassword method
		const isMatch = await user.comparePassword(password);
        console.log("\n=== Password Comparison ===");
        console.log("Provided Password:", password);
        console.log("Password Match Result:", isMatch);
        
		if (!isMatch) {
            console.log("❌ Password mismatch for user:", username);
			return res.status(400).json({ 
                success: false, 
                message: "Incorrect password. Please check your password and try again."
            });
		}

        console.log("✅ Login successful!");

		// Create and send token for user
		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({ 
            success: true, 
            message: "Logged in successfully",
            user: {
                id: user._id,
                username: user.username,
                accountType: user.accountType
            }
        });
        
	} catch (error) {
		console.error("\n❌ Error in login controller:", error);
		res.status(500).json({ success: false, message: "Server error" });
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

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found with that email' });
        }

        // Generate reset token (a simple code for now)
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash the token and set expiry
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes

        await user.save({ validateBeforeSave: false }); // Save without re-validating all fields

        // Send the email with the reset token
        try {
            const resetUrl = `${resetToken}`;
            await sendPasswordResetEmail(user.email, resetUrl);

            res.status(200).json({ success: true, message: 'Password reset code sent to your email' });

        } catch (emailError) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            console.error('Error sending password reset email:', emailError);
            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Hash the incoming token to compare with the hashed token in the database
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user by hashed token and check expiry
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() } // $gt: greater than
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
        }

        // Set the new password
        user.password = newPassword;
        user.resetPasswordToken = undefined; // Clear the token fields
        user.resetPasswordExpire = undefined;

        await user.save(); // Save with pre-save hook to hash the new password

        res.status(200).json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateAccountType = async (req, res) => {
    try {
        const { accountType } = req.body;
        const userId = req.user._id;

        // Validate account type
        if (!['student', 'faculty', 'club'].includes(accountType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid account type'
            });
        }

        // Check if user is the test account
        const user = await User.findById(userId);
        if (!user || user.email !== 'darshkalathiya25@gmail.com') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Only test account can change account type'
            });
        }

        // Update user's account type and reset onboarding
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    accountType,
                    onboardingComplete: false,
                    headline: null // Clear headline when account type is changed
                }
            },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating account type:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
  