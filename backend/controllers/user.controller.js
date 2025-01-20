import cloudinary from "../lib/cloudinary.js";
import User from "../models/user.model.js"

// Only get the users that are not in my connection and is not myself
export const getSuggestedConnections = async (req, res) => {
    try{
        const currentUser = await User.findById(req.user._id).select("connections");
        
        const suggestedUser = await User.find({
            _id: {
                $ne: req.user._id, // $ne is not equal to in mongodb
                $nin: currentUser.connections // $nin is not in in mongodb
            }
        })
        .select("name username profilePicture headline")
        .limit(10); // Get the selected properties of the user and show only 10 users

        res.json({success: "true", suggestedUser: suggestedUser});
    } catch(error) {
        console.error("Error in getSuggestedConnections: ", error);
        res.status(500).json({success:"false", message:"Server Error"});
    }   
}

export const getPublicProfile = async (req, res) => {
    try{
        const user = await User.findOne({username: req.params.username}).select("-password");
        if(!user){
            return res.status(404).json({success:"false", message:"User not found."});
        }
        res.json({success: "true", user});
    } catch(error) {
        console.error("Error in getPublicProfile: ", error);
        res.status(500).json({success:"false", message:"Server Error"});
    }   
}

export const updateProfile = async (req, res) => {
    try{
        const allowedFields = [
            "name","username", "headline", "about", "location", "profilePicture", "bannerImg", "skills", "studentId", "projects", "experience", "education", "yearOfStudy", "department"
        ];

        const updatedData = {};
        for (const field of allowedFields) {
            if (req.body[field]) {
                updatedData[field] = req.body[field];
            }
        }

        if(req.body.profilePicture){
            const result = await cloudinary.upload(req.body.profilePicture);
            updatedData.profilePicture = result.secure_url;
        }
        if(req.body.bannerImg){
            const result = await cloudinary.upload(req.body.bannerImg);
            updatedData.bannerImg = result.secure_url;
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {$set : updatedData}, 
            {new: true})
            .select("-password"); //$set comes from mongodb and means set the value of the field
        
        res.json({success: "true", message:"Profile updated Successfully.", user});
    } catch(error) {
        console.error("Error in updateProfile: ", error);
        res.status(500).json({success:"false", message:"Server Error"});
    }
}

