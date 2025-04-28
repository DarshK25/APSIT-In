import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  getClubsWithEvents, 
  getAllClubs,
  getClubById,
  getClubMembers,
  addClubMember,
  updateClubMemberRole,
  removeClubMember,
  getUserClubs,
  checkClubMembership,
  getClubByUsername
} from "../controllers/club.controller.js";

const router = express.Router();

// Route to get all clubs that have events
router.get("/with-events", protectRoute, getClubsWithEvents);

// Route to get all clubs
router.get("/all", protectRoute, getAllClubs);

// Route to get clubs where the current user is a member
router.get("/my-clubs", protectRoute, getUserClubs);

// Route to get a club by username
router.get("/username/:username", protectRoute, getClubByUsername);

// Route to check if user is a member of a specific club
router.get("/:clubId/check-membership", protectRoute, checkClubMembership);

// Route to get a specific club by ID
router.get("/:clubId", protectRoute, getClubById);

// Route to get club members
router.get("/:clubId/members", protectRoute, getClubMembers);

// Route to add a member to a club
router.post("/:clubId/members", protectRoute, addClubMember);

// Route to update a member's role in a club
router.put("/:clubId/members/:memberId", protectRoute, updateClubMemberRole);

// Route to remove a member from a club
router.delete("/:clubId/members/:memberId", protectRoute, removeClubMember);

export default router; 