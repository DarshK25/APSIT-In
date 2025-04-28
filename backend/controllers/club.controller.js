import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import Event from "../models/event.model.js";
import { sendClubMembershipEmail } from "../emails/emailHandlers.js";
import mongoose from "mongoose";

// Get all clubs that have events
export const getClubsWithEvents = async (req, res) => {
  try {
    // First, find all club users
    const clubs = await User.find({ 
      accountType: 'club'
    }).select('_id name username profilePicture members');

    // If no clubs found, return empty array
    if (!clubs || clubs.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get all club IDs
    const clubIds = clubs.map(club => club._id);
    
    // Find all events organized by these clubs
    const events = await Event.find({
      organizer: { $in: clubIds }
    }).select('_id title description date time location image organizer');
    
    // Map events to their respective clubs
    const clubsWithEvents = clubs.map(club => {
      const clubEvents = events.filter(event => 
        event.organizer.toString() === club._id.toString()
      );
      
      return {
        ...club.toObject(),
        events: clubEvents
      };
    });
    
    // Filter out clubs with no events
    const clubsWithEventsFiltered = clubsWithEvents.filter(club => 
      club.events && club.events.length > 0
    );

    return res.json({
      success: true,
      data: clubsWithEventsFiltered
    });
  } catch (error) {
    console.error("Error in getClubsWithEvents:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching clubs with events"
    });
  }
};

// Get all clubs
export const getAllClubs = async (req, res) => {
  try {
    // Find all users with club type account
    const clubs = await User.find({ 
      accountType: 'club'
    }).select('_id name username profilePicture about members');

    // If no clubs found, return empty array
    if (!clubs || clubs.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    return res.json({
      success: true,
      data: clubs
    });
  } catch (error) {
    console.error("Error in getAllClubs:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching clubs"
    });
  }
};

// Get club by ID with members
export const getClubById = async (req, res) => {
  try {
    const { clubId } = req.params;
    
    // Get the club
    const club = await User.findById(clubId)
      .where('accountType').equals('club')
      .select('_id name username profilePicture about members')
      .populate('members.userId', '_id name username profilePicture');
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found"
      });
    }
    
    // Get all events for this club
    const events = await Event.find({
      organizer: clubId
    }).select('_id title description date time location image');
    
    // Add events to the club object
    const clubData = {
      ...club.toObject(),
      events: events
    };
    
    return res.json({
      success: true,
      data: clubData
    });
  } catch (error) {
    console.error("Error in getClubById:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching club"
    });
  }
};

// Get club members
export const getClubMembers = async (req, res) => {
  try {
    const { clubId } = req.params;
    
    const club = await User.findById(clubId)
      .where('accountType').equals('club')
      .select('members')
      .populate('members.userId', '_id name username profilePicture');
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found"
      });
    }
    
    return res.json({
      success: true,
      data: club.members
    });
  } catch (error) {
    console.error("Error in getClubMembers:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching club members"
    });
  }
};

// Add member to club
export const addClubMember = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { userId, role } = req.body;
    
    console.log("Add member request:", { clubId, userId, role });
    
    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: "User ID and role are required"
      });
    }
    
    // Validate role
    const validRoles = ['president', 'vice-president', 'secretary', 'member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: president, vice-president, secretary, member"
      });
    }
    
    // Check if club exists and is a club account
    let club;
    try {
      club = await User.findById(clubId);
      console.log("Found club:", club ? club._id : "Not found");
    } catch (error) {
      console.error("Error finding club:", error);
      return res.status(400).json({
        success: false,
        message: "Invalid club ID format"
      });
    }
    
    if (!club || club.accountType !== 'club') {
      return res.status(404).json({
        success: false,
        message: "Club not found"
      });
    }
    
    // Check if user is authorized to add members (must be same club account)
    if (club._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add members to this club"
      });
    }
    
    // Check if user exists
    let user;
    try {
      user = await User.findById(userId);
      console.log("Found user:", user ? user._id : "Not found");
    } catch (error) {
      console.error("Error finding user:", error);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Log the current members array before modification
    console.log("Current members array:", club.members);
    
    // Initialize members array if it doesn't exist or not an array
    if (!club.members || !Array.isArray(club.members)) {
      console.log("Initializing empty members array");
      club.members = [];
    }
    
    // Check if user is already a member - using proper string comparison
    const isMember = club.members.some(member => 
      member.userId && member.userId.toString() === userId.toString()
    );
    
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this club"
      });
    }
    
    // Add user to club members with proper ObjectId handling
    try {
      // Try to safely convert to ObjectId if needed
      const userObjectId = typeof userId === 'string' 
        ? mongoose.Types.ObjectId.createFromHexString(userId)
        : userId;
      
      // Add to club members array
      club.members.push({
        userId: userObjectId,
        role,
        joinDate: new Date()
      });
      
      console.log("After adding member:", club.members);
    } catch (idError) {
      console.error("Error creating ObjectId from userId:", idError);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        error: idError.message
      });
    }
    
    // Save with error handling
    try {
      const savedClub = await club.save();
      console.log("Club saved successfully, members count:", savedClub.members.length);
      
      // Verify the club was actually saved by fetching it again
      const verifyClub = await User.findById(clubId);
      console.log("Verification - club members after save:", verifyClub.members);
      
      // Create notification
      await createMembershipNotification(userId, clubId, role);
      
      return res.json({
        success: true,
        message: `${user.name} has been added as a ${role} in ${club.name}`,
        data: verifyClub.members
      });
    } catch (saveError) {
      console.error("Error saving club:", saveError);
      return res.status(500).json({
        success: false,
        message: "Error saving club data",
        error: saveError.message
      });
    }
  } catch (error) {
    console.error("Error in addClubMember:", error);
    return res.status(500).json({
      success: false,
      message: "Server error adding club member",
      error: error.message
    });
  }
};

// Update club member role
export const updateClubMemberRole = async (req, res) => {
  try {
    const { clubId, memberId } = req.params;
    const { role } = req.body;
    
    console.log("Update member role request:", { clubId, memberId, role });
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required"
      });
    }
    
    // Validate role
    const validRoles = ['president', 'vice-president', 'secretary', 'member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: president, vice-president, secretary, member"
      });
    }
    
    // Check if club exists and is a club account
    let club;
    try {
      club = await User.findById(clubId);
      console.log("Found club:", club ? club._id : "Not found");
    } catch (error) {
      console.error("Error finding club:", error);
      return res.status(400).json({
        success: false,
        message: "Invalid club ID format"
      });
    }
    
    if (!club || club.accountType !== 'club') {
      return res.status(404).json({
        success: false,
        message: "Club not found"
      });
    }
    
    // Check if user is authorized to update member roles (must be same club account)
    if (club._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update member roles for this club"
      });
    }
    
    // Initialize members array if it doesn't exist or not an array
    if (!club.members || !Array.isArray(club.members)) {
      console.log("Initializing empty members array");
      club.members = [];
      return res.status(404).json({
        success: false,
        message: "This club has no members"
      });
    }
    
    // Log the current members array before modification
    console.log("Current members array:", club.members);
    
    // Find member in the club by userId - treat memberId as the user's ID
    const memberIndex = club.members.findIndex(member => 
      member.userId && member.userId.toString() === memberId
    );
    
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Member not found in this club"
      });
    }
    
    // Store the old role for notification
    const oldRole = club.members[memberIndex].role;
    
    // Update member role
    club.members[memberIndex].role = role;
    
    try {
      const savedClub = await club.save();
      console.log("Club saved successfully, members count:", savedClub.members.length);
      
      // Create notification for role change
      const notification = new Notification({
        recipient: memberId,
        sender: clubId,
        type: 'club_role_changed',
        message: `Your role in ${club.name} has been changed from ${oldRole} to ${role}`,
        relatedClub: clubId
      });
      await notification.save();
      
      return res.json({
        success: true,
        message: `Member role updated to ${role}`,
        data: savedClub.members
      });
    } catch (saveError) {
      console.error("Error saving club:", saveError);
      return res.status(500).json({
        success: false,
        message: "Error saving club data",
        error: saveError.message
      });
    }
  } catch (error) {
    console.error("Error in updateClubMemberRole:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating club member role",
      error: error.message
    });
  }
};

// Remove member from club
export const removeClubMember = async (req, res) => {
  try {
    const { clubId, memberId } = req.params;
    
    console.log("Remove member request:", { clubId, memberId });
    
    // Check if club exists and is a club account
    let club;
    try {
      club = await User.findById(clubId);
      console.log("Found club:", club ? club._id : "Not found");
    } catch (error) {
      console.error("Error finding club:", error);
      return res.status(400).json({
        success: false,
        message: "Invalid club ID format"
      });
    }
    
    if (!club || club.accountType !== 'club') {
      return res.status(404).json({
        success: false,
        message: "Club not found"
      });
    }
    
    // Check if user is authorized to remove members (must be same club account)
    if (club._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to remove members from this club"
      });
    }
    
    // Initialize members array if it doesn't exist or not an array
    if (!club.members || !Array.isArray(club.members)) {
      console.log("Initializing empty members array");
      club.members = [];
      return res.status(404).json({
        success: false,
        message: "This club has no members"
      });
    }
    
    // Log the current members array before modification
    console.log("Current members array:", club.members);
    
    // Find member in the club by userId - treat memberId as the user's ID
    const memberIndex = club.members.findIndex(member => 
      member.userId && member.userId.toString() === memberId
    );
    
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Member not found in this club"
      });
    }
    
    // Get member info before removing
    let memberName;
    try {
      const memberInfo = await User.findById(memberId).select('name');
      memberName = memberInfo ? memberInfo.name : 'Member';
    } catch (error) {
      console.error("Error getting member name:", error);
      memberName = 'Member';
    }
    
    const memberRole = club.members[memberIndex].role;
    
    // Remove member from club
    club.members.splice(memberIndex, 1);
    
    try {
      const savedClub = await club.save();
      console.log("Club saved successfully, members count:", savedClub.members.length);
      
      // Create notification
      const notification = new Notification({
        recipient: memberId,
        sender: clubId,
        type: 'club_removed',
        message: `You have been removed from ${club.name}`,
        relatedClub: clubId
      });
      await notification.save();
      
      return res.json({
        success: true,
        message: `${memberName} has been removed from ${club.name}`,
        data: savedClub.members
      });
    } catch (saveError) {
      console.error("Error saving club:", saveError);
      return res.status(500).json({
        success: false,
        message: "Error saving club data",
        error: saveError.message
      });
    }
  } catch (error) {
    console.error("Error in removeClubMember:", error);
    return res.status(500).json({
      success: false,
      message: "Server error removing club member",
      error: error.message
    });
  }
};

// Get clubs where user is a member
export const getUserClubs = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Getting clubs for user:", userId);
    
    // Find all clubs where the user is a member using proper string comparison
    const clubs = await User.find({
      accountType: 'club'
    }).select('_id name username profilePicture about members');
    
    console.log(`Found ${clubs.length} clubs total`);
    
    // Filter clubs where the user is a member
    const userClubs = clubs.filter(club => {
      if (!club.members || !Array.isArray(club.members)) {
        return false;
      }
      
      // Check if user is in members array with proper string comparison
      return club.members.some(member => 
        member.userId && member.userId.toString() === userId.toString()
      );
    });
    
    console.log(`User is a member of ${userClubs.length} clubs`);
    
    // For each club, find the user's role
    const clubsWithRole = userClubs.map(club => {
      const memberData = club.members.find(member => 
        member.userId && member.userId.toString() === userId.toString()
      );
      
      return {
        _id: club._id,
        name: club.name,
        username: club.username,
        profilePicture: club.profilePicture,
        about: club.about,
        role: memberData ? memberData.role : null,
        joinDate: memberData ? memberData.joinDate : null
      };
    });
    
    return res.json({
      success: true,
      data: clubsWithRole
    });
  } catch (error) {
    console.error("Error in getUserClubs:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching user's clubs",
      error: error.message
    });
  }
};

// Create a notification for a user when they are added to a club
export const createMembershipNotification = async (userId, clubId, role) => {
  try {
    const club = await User.findById(clubId).select('name username');
    const user = await User.findById(userId).select('name email');
    
    if (!club || !user) return null;

    // Create a notification for the user
    const notification = new Notification({
      recipient: userId,
      sender: clubId,
      type: 'club_membership',
      message: `You have been added as a ${role} in ${club.name}`,
      relatedClub: clubId
    });

    await notification.save();
    
    // Send an email notification
    try {
      const clubProfileUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/club/${club.username}`;
      await sendClubMembershipEmail(
        user.email,
        user.name,
        club.name,
        role,
        clubProfileUrl
      );
    } catch (emailError) {
      console.error("Error sending club membership email:", emailError);
      // Continue even if email fails
    }
    
    return notification;
  } catch (error) {
    console.error("Error creating membership notification:", error);
    return null;
  }
};

// Check if user is a member of a club
export const checkClubMembership = async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.user._id;
    
    console.log("Checking membership:", { clubId, userId });
    
    // Get the club
    const club = await User.findById(clubId)
      .where('accountType').equals('club')
      .select('members');
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found"
      });
    }
    
    // Check if club has members array
    if (!club.members || !Array.isArray(club.members)) {
      return res.json({
        success: true,
        isMember: false,
        role: null
      });
    }
    
    // Check if user is a member
    const memberData = club.members.find(member => 
      member.userId && member.userId.toString() === userId.toString()
    );
    
    if (!memberData) {
      return res.json({
        success: true,
        isMember: false,
        role: null
      });
    }
    
    return res.json({
      success: true,
      isMember: true,
      role: memberData.role,
      joinDate: memberData.joinDate
    });
  } catch (error) {
    console.error("Error in checkClubMembership:", error);
    return res.status(500).json({
      success: false,
      message: "Server error checking club membership",
      error: error.message
    });
  }
};

export const getClubDetailsForEvent = async (req, res) => {
    try {
        const { clubId } = req.params;

        const club = await User.findOne({ 
            _id: clubId,
            accountType: 'club'
        }).select('name username profilePicture description category department');

        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        // Get the club's upcoming events count
        const upcomingEventsCount = await Event.countDocuments({
            organizer: clubId,
            date: { $gte: new Date() }
        });

        // Get the club's total events count
        const totalEventsCount = await Event.countDocuments({
            organizer: clubId
        });

        const clubDetails = {
            ...club.toObject(),
            upcomingEventsCount,
            totalEventsCount
        };

        res.status(200).json(clubDetails);
    } catch (error) {
        console.error('Error fetching club details:', error);
        res.status(500).json({ message: 'Error fetching club details' });
    }
};

export const getClubByUsername = async (req, res) => {
    try {
        const { username } = req.params;

        const club = await User.findOne({ 
            username,
            accountType: 'club'
        }).select('name username profilePicture description category department');

        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        // Get the club's upcoming events count
        const upcomingEventsCount = await Event.countDocuments({
            organizer: club._id,
            date: { $gte: new Date() }
        });

        // Get the club's total events count
        const totalEventsCount = await Event.countDocuments({
            organizer: club._id
        });

        const clubDetails = {
            ...club.toObject(),
            upcomingEventsCount,
            totalEventsCount
        };

        res.status(200).json(clubDetails);
    } catch (error) {
        console.error('Error fetching club by username:', error);
        res.status(500).json({ message: 'Error fetching club details' });
    }
}; 