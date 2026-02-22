import express from "express";
import {
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
} from "../controllers/orderController.js";
import {
  getProducts,
  getProductStats,
} from "../controllers/productController.js";
import { adminMiddleware } from "../middleware/auth.js";
import { validateRequest, validateQuery } from "../middleware/validate.js";
import {
  updateOrderStatusSchema,
  orderQuerySchema,
} from "../validators/orderValidator.js";
import { productQuerySchema } from "../validators/productValidator.js";

const router = express.Router();

// All admin routes require admin authentication
router.use(adminMiddleware);

// Dashboard
router.get("/dashboard/stats", getOrderStats);

// Order management
router.get("/orders", validateQuery(orderQuerySchema), getAllOrders);
router.put(
  "/orders/:id/status",
  validateRequest(updateOrderStatusSchema),
  updateOrderStatus,
);

// Product management
router.get("/products", validateQuery(productQuerySchema), getProducts);
router.get("/products/stats", getProductStats);

export default router;
