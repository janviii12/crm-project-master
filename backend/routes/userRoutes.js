import express from "express";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getStaffUsers,
  updateProfile,
  changePassword,
  uploadAvatar
} from "../controllers/userController.js";
import upload from "../middleware/upload.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication globally to all routes
router.use(authenticateToken);

// Get all users
router.get("/", getAllUsers);

// Create new user
router.post("/", createUser);

// Update user
router.put("/:id", updateUser);

// Delete user
router.delete("/:id", deleteUser);

// Get staff - Admin only
router.get("/staff", requireAdmin, getStaffUsers);

// Update profile
router.put("/:id/profile", updateProfile);

// Change password
router.put("/:id/password", changePassword);

// Upload avatar
router.post("/:id/avatar", upload.single("avatar"), uploadAvatar);

export default router;
