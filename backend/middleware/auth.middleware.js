import jwt from "jsonwebtoken";
import User from "../models/user.model.js";


export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies["jwt-apsitin"]; //extracting the jwt token 
        console.log('=== AUTH MIDDLEWARE DEBUG ===');
        console.log('🍪 All cookies received:', req.cookies);
        console.log('🍪 Cookie names:', Object.keys(req.cookies));
        console.log('🔑 JWT Token (jwt-apsitin):', token ? 'Present' : 'Missing');
        console.log('🌍 Origin:', req.headers.origin);
        console.log('🌍 User-Agent:', req.headers['user-agent']);
        console.log('================================');
        
        if (!token) {
            console.log('❌ No token found in cookies - Request URL:', req.url);
            console.log('❌ Headers:', req.headers);
            return res.status(401).json({ message: "Unauthorized - No Token Provided" });//checking if token exists
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);//Verifying tokem using secret key & decoded for extracting id from it 
        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized - Invalid Token" });
        }

        //The user ID from the token is used to query User model. This ensures that the user exists in the database and is active.
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User not found" }); //If no user is found (e.g., account deleted), an error is returned.
        }
        /*
        .select("-password"):
        The .select() method in MongoDB/Mongoose allows you to include or exclude specific fields when fetching a document.
        A minus sign (-) indicates exclusion. Here, "-password" means the password field should not be included in the result.
        Why Exclude the Password?
        The password field typically stores the user's hashed password.
        Excluding it ensures sensitive data is not inadvertently exposed or included in the response object (req.user in this case).
        It's a security best practice to limit sensitive data exposure.
        */
        req.user = user;

        next(); //passes the request to the next middleware or controller. This ensures the authenticated user can access the protected resource.
    } catch (error) {
        console.log("Error in protectRoute middleware:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
