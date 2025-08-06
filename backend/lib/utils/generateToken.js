import jwt from "jsonwebtoken";
export const generateTokenAndSetCookie = async (userId, res) => {
    try {
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
        const cookieOptions = {
            httpOnly: true,
            maxAge: 15 * 24 * 60 * 60 * 1000,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
            // In production, don't set domain to allow cross-site cookies
            ...(process.env.NODE_ENV !== "production" && { domain: "localhost" })
        };
        
        console.log('🔑 Generated JWT for user:', userId);
        console.log('🍪 Cookie options:', cookieOptions);
        console.log('🌐 Environment:', process.env.NODE_ENV);
        
        res.cookie("jwt-apsitin", token, cookieOptions);
        console.log('✅ Cookie set successfully');
    } catch (err) {
        console.log("❌ Error in generateTokenAndSetCookie:", err);
        throw new Error("Error generating token and setting cookie");
    }
};
