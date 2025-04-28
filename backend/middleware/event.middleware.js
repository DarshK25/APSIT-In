import User from "../models/user.model.js";

const authorizedEmails = {
    admin: ["darshkalathiya25@gmail.com", "23102187@apsit.edu.in", "devopsclub@apsit.edu.in"],
    moderators: [
        "codersclub@apsit.edu.in",
        "aimlclub@apsit.edu.in",
        "cybersecurityclub@apsit.edu.in",
        "datascienceclub@apsit.edu.in",
        "macclub@apsit.edu.in",
        "studentcouncil@apsit.edu.in",
        "ojusteam@apsit.edu.in",
        "gdgapsit@apsit.edu.in",
        "nssunit@apsit.edu.in",
        "ieee@apsit.edu.in",
        "antarang@apsit.edu.in"
    ]
};

const checkAccessByEmail = (role) => (req, res, next) => {
    const userEmail = req.user.email; // Assumes email is stored in req.user
    if (authorizedEmails[role]?.includes(userEmail)) {
        return next();
    }
    
    // If not found in hardcoded list, continue to the next middleware
    // to check if they have access as a club member
    return checkClubMemberAccess(req, res, next);
};

const checkClubMemberAccess = async (req, res, next) => {
    try {
        const userId = req.user._id;
        
        // If the user is a club account, they automatically have access
        if (req.user.accountType === 'club') {
            return next();
        }
        
        // Find all clubs where this user is a member (any role)
        const clubs = await User.find({
            accountType: 'club',
            'members.userId': userId
        });
        
        if (clubs && clubs.length > 0) {
            // User is a member of at least one club
            return next();
        }
        
        // No access found
        return res.status(403).json({ 
            success: false, 
            message: "Access denied: You need to be a club member to manage events" 
        });
    } catch (error) {
        console.error("Error checking club member access:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server error checking access privileges" 
        });
    }
};

const checkAccess = (role) => (req, res, next) => {
    // First check hardcoded emails for backward compatibility
    const userEmail = req.user.email;
    if (authorizedEmails[role]?.includes(userEmail)) {
        return next();
    }
    
    // Then check if user is a club member with sufficient privileges
    return checkClubMemberAccess(req, res, next);
};

export default checkAccess;
