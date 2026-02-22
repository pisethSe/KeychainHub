import express from "express";
const router = express.Router();
import categoryController from "../controllers/categoryController.js";
import { optionalAuthMiddleware, adminMiddleware } from "../middleware/auth.js";

// Public routes
router.get("/", categoryController.getCategories);

router.get("/stats", categoryController.getCategoryStats);

router.get("/:category/products", categoryController.getCategoryProducts);

// Admin/validation route
router.post("/validate", adminMiddleware, categoryController.validateCategory);

export default router;
