import User from "../models/User.model.js"; 
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // for password hashing
//for example 123456 => SKefhjw_2jbjJB  

export const signup = async(req, res) => {
    try{
        const {name, username, email, password} = req.body; //req.body is an object that contains all the data from the form
        const existingEmail = await User.findOne({email}); // checking if email already exists
        //await means it will wait for the promise to be resolved and findOne() is for searching in database
        if( !name || !username || !email || !password){
            return res.status(400).json({message: "All fields are required"});
        }
        if(existingEmail){
            return res.status(400).json({message: "Email already exists"});
        }
        //Do the same for username
        const existingUsername = await User.findOne({username});
        if(existingUsername){
            return res.status(400).json({message: "Username already exists"});
        }
        if(password.length < 6){
            return res.status(400).json({message: "Password must be at least 6 characters"});
        }
        const salt  = await bcrypt.genSalt(10);//salt means random string added to the password
        //generate salt of length 10
        const hashedPassword = await bcrypt.hash(password, salt); //hashing the password
        
        const user = new User({
            name, username, email, password: hashedPassword 
        })
        //constructor to initialize user with these data
        
        await user.save(); //Saved to user database!!!!
        const token = jwt.sign( {userID: user._id}, process.env.JWT_SECRET ); 
        //generating token which is used for authentication which means the user is logged in
        //jwt.sign is a method to sign token and has parameters payload(an object), secret key and options
        //secret key stored in .env file 
        // a cookie is a small piece of data that is sent with every request to the server 
        //and stored in the browser, it helps us by sending a token to the server and the server verifies token 
        
        res.cookie("jwt-apsitin", token, {
            httpOnly: true, // only accessible by the server and prevents XSS attack(cross-side scripting) 
            //and does not allow users to access this cookie
            maxAge: 3 * (24 * 60 * 60 * 1000), // This is in milliseconds which is equal to 3*24 hours, This is token's validity age
            sameSite: "strict", // prevents CSRF / XSRF attacks, these attack
            secure: process.env.NODE_ENV === "production", // This means that the cookie will only be sent over HTTPS & prevents man-in-the-middle attacks
        });

        res.status(201).json({message: "User registered succesfully"}); 
        //todo: send welcome email in a nested try catch

        const profileUrl = "http://localhost/5173/profile/" + user.username; //React port 5173 => profile page
        //user.username in profileUrl is required because 
        try{
            await sendWelcomeEmail(user.email, user.name, profileUrl) 
        }
        catch(emailError){
            console.error("Error in sending email", emailError)
        }
    }
    catch(error){
         console.log("Error in signup", error.message);
         res.status(500).json({message: "Internal server error"});
    }
}

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
		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
		await res.cookie("jwt-linkedin", token, {
			httpOnly: true,
			maxAge: 3 * 24 * 60 * 60 * 1000,
			sameSite: "strict",
			secure: process.env.NODE_ENV === "production",
		});

		res.json({ message: "Logged in successfully" });
	} catch (error) {
		console.error("Error in login controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const logout = (req, res) => {
	res.clearCookie("jwt-linkedin");
	res.json({ message: "Logged out successfully" });
};

export const getCurrentUser = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		console.error("Error in getCurrentUser controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};