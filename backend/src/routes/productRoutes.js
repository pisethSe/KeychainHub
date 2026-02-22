import express from "express";
import {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getProductsByCategory,
  searchProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductStats,
} from "../controllers/productController.js";
import {
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware,
} from "../middleware/auth.js";
import { validateRequest, validateQuery } from "../middleware/validate.js";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from "../validators/productValidator.js";
import {
  uploadProductImages,
  handleUploadError,
} from "../middleware/upload.js";

const router = express.Router();

// Public routes
router.get(
  "/",
  validateQuery(productQuerySchema),
  optionalAuthMiddleware,
  getProducts,
);
router.get("/featured", getFeaturedProducts);
router.get("/search", searchProducts);
router.get("/categories", getCategories);
router.get("/category/:category", getProductsByCategory);
router.get("/:id", getProduct);

// Admin routes
router.post(
  "/",
  adminMiddleware,
  uploadProductImages,
  handleUploadError,
  validateRequest(createProductSchema),
  createProduct,
);

router.put(
  "/:id",
  adminMiddleware,
  uploadProductImages,
  handleUploadError,
  validateRequest(updateProductSchema),
  updateProduct,
);

router.delete("/:id", adminMiddleware, deleteProduct);
router.put("/:id/stock", adminMiddleware, updateStock);
router.get("/admin/stats", adminMiddleware, getProductStats);

export default router;
