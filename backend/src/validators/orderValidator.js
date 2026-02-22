import { z } from "zod";

/**
 * Validation schema for creating a new order
 * Validates delivery address, phone number, and optional notes
 */
const createOrderSchema = z.object({
  address: z.string().trim().min(10, "Address must be at least 10 characters"),
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 characters"),
  notes: z.string().optional(),
});

/**
 * Validation schema for updating order status
 * Validates that status is one of the allowed values
 */
const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

/**
 * Validation schema for order query parameters
 * Validates pagination, status filtering, and date range
 */
const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  status: z
    .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export { createOrderSchema, updateOrderStatusSchema, orderQuerySchema };
