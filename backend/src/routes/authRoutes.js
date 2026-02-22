import express from "express";
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/authValidator.js";

const router = express.Router();

// Public routes
router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);
router.post("/logout", logout);

// Protected routes
router.get("/profile", authMiddleware, getProfile);
router.put(
  "/profile",
  authMiddleware,
  validateRequest(updateProfileSchema),
  updateProfile,
);
router.put(
  "/change-password",
  authMiddleware,
  validateRequest(changePasswordSchema),
  changePassword,
);

export default router;
