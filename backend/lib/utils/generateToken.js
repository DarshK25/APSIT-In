import jwt from "jsonwebtoken";
export const generateTokenAndSetCookie = async (userId, res) => {
    try {
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
        const cookieOptions = {
            httpOnly: true,
            maxAge: 15 * 24 * 60 * 60 * 1000,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
            // Don't set domain in production to allow cross-origin cookies
            // Only set domain for localhost in development
            ...(process.env.NODE_ENV !== "production" && { domain: "localhost" })
        };
        
        console.log('🔑 Generated JWT for user:', userId);
        console.log('🍪 Cookie options:', cookieOptions);
        console.log('🌐 Environment:', process.env.NODE_ENV);
        console.log('🔐 Token preview:', token.substring(0, 20) + '...');
        
        res.cookie("jwt-apsitin", token, cookieOptions);
        console.log('✅ Cookie set successfully with name: jwt-apsitin');
        
        // Also set the token in response header for debugging
        if (process.env.NODE_ENV === "production") {
            res.header('X-Debug-Token-Set', 'true');
        }
    } catch (err) {
        console.log("❌ Error in generateTokenAndSetCookie:", err);
        throw new Error("Error generating token and setting cookie");
    }
};
