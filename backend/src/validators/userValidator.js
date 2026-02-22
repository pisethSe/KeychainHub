import { z } from "zod";

/**
 * Validation schema for user query parameters
 * Validates pagination, search, and sorting options
 */
const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
  search: z.string().max(100).optional(),
  sortBy: z
    .enum(["email", "name", "createdAt"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

/**
 * Validation schema for updating user information
 * All fields are optional, but if provided, must meet validation rules
 */
const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .optional(),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please provide a valid email")
    .toLowerCase()
    .optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

/**
 * Validation schema for updating user role
 * Validates the isAdmin field
 */
const updateUserRoleSchema = z.object({
  isAdmin: z.boolean({
    required_error: "isAdmin field is required",
    invalid_type_error: "isAdmin must be a boolean",
  }),
});

export { userQuerySchema, updateUserSchema, updateUserRoleSchema };
