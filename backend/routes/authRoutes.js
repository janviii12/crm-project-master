import express from "express";
import rateLimit from "express-rate-limit";
import { loginUser, refreshToken, logoutUser } from "../controllers/authController.js";

const router = express.Router();

// Rate limiter for refresh token endpoint
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: "Too many refresh attempts, please try again later."
});

router.post("/login", loginUser);
router.post("/refresh-token", refreshLimiter, refreshToken);
router.post("/logout", logoutUser);

export default router;
