const authorizedEmails = {
    admin: ["darshkalathiya25@gmail.com", "23102187@apsit.edu.in"],
    moderators: [
        "codersclub@apsit.edu.in",
        "aimlclub@apsit.edu.in",
        "devopsclub@apsit.edu.in",
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

const checkAccess = (role) => (req, res, next) => {
    const userEmail = req.user.email; // Assumes email is stored in req.user
    if (authorizedEmails[role]?.includes(userEmail)) {
        return next();
    }
    res.status(403).json({ success: false, message: "Access denied: Unauthorized" });
};

export default checkAccess;
