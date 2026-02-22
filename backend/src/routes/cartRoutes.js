import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartItemCount,
} from "../controllers/cartController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../validators/cartValidators.js";

const router = express.Router();

// All cart routes require authentication
router.use(authMiddleware);

router.get("/", getCart);
router.get("/count", getCartItemCount);
router.post("/", validateRequest(addToCartSchema), addToCart);
router.put("/:itemId", validateRequest(updateCartItemSchema), updateCartItem);
router.delete("/:itemId", removeFromCart);
router.delete("/", clearCart);

export default router;
