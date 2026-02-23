const { z } = require("zod");

/**
 * Validation schema for user registration
 * Validates name, email format, and password strength
 */
// this part is about register function and the validation for register function
const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please provide a valid email")
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

/**
 * Validation schema for user login
 * Validates email format and ensures password is provided
 */
// this part is about login function and the validation for login function
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please provide a valid email")
    .toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

module.exports = { registerSchema, loginSchema };
