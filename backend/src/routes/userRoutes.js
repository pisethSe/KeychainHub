import express from "express";
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserRole,
  resetUserPassword,
  getUserStats,
} from "../controllers/userController.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { validateRequest, validateQuery } from "../middleware/validate.js";
import {
  userQuerySchema,
  updateUserSchema,
  updateUserRoleSchema,
} from "../validators/userValidator.js";

const router = express.Router();

// Admin-only routes for user management
router.use(adminMiddleware);

// User statistics
router.get("/stats", getUserStats);

// User management
router.get("/", validateQuery(userQuerySchema), getUsers);
router.get("/:id", getUser);
router.put("/:id", validateRequest(updateUserSchema), updateUser);
router.put("/:id/role", validateRequest(updateUserRoleSchema), updateUserRole);
router.post("/:id/reset-password", resetUserPassword);
router.delete("/:id", deleteUser);

export default router;
