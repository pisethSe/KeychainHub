import express from "express";
import {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateRequest, validateQuery } from "../middleware/validate.js";
import {
  createOrderSchema,
  orderQuerySchema,
} from "../validators/orderValidator.js";

const router = express.Router();

// All order routes require authentication
router.use(authMiddleware);

router.post("/", validateRequest(createOrderSchema), createOrder);
router.get("/", validateQuery(orderQuerySchema), getUserOrders);
router.get("/:id", getOrder);
router.put("/:id/cancel", cancelOrder);

export default router;
