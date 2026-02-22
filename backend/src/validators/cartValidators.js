import { z } from "zod";

/**
 * Validation schema for adding items to cart
 * Validates product ID and quantity
 */
const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.coerce
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .optional()
    .default(1),
});

/**
 * Validation schema for updating cart item quantity
 * Validates quantity (can be 0 to remove item)
 */
const updateCartItemSchema = z.object({
  quantity: z.coerce
    .number()
    .int("Quantity must be an integer")
    .min(0, "Quantity cannot be negative"),
});

export { addToCartSchema, updateCartItemSchema };
