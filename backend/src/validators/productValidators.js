const { z } = require("zod");

const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(100, "Product name must be less than 100 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Product description is required")
    .max(1000, "Product description must be less than 1000 characters"),
  price: z
    .number()
    .positive("Price must be a positive number")
    .min(0.01, "Price must be at least 0.01"),
  stock: z
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative"),
  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .optional()
    .default([]),
  category: z.string().trim().min(1, "Category is required"),
  isFeatured: z.boolean().optional().default(false),
});

const updateProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(100, "Product name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, "Product description is required")
    .max(1000, "Product description must be less than 1000 characters")
    .optional(),
  price: z
    .number()
    .positive("Price must be a positive number")
    .min(0.01, "Price must be at least 0.01")
    .optional(),
  stock: z
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative")
    .optional(),
  images: z.array(z.string().url("Each image must be a valid URL")).optional(),
  category: z.string().trim().min(1, "Category is required").optional(),
  isFeatured: z.boolean().optional(),
});

module.exports = { createProductSchema, updateProductSchema };
