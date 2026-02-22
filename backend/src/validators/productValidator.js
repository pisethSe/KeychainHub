import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().trim().min(3, "Product name must be at least 3 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  stock: z.coerce
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative"),
  category: z.string().optional(),
  isFeatured: z.enum(["true", "false"]).optional(),
});

const updateProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Product name must be at least 3 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .optional(),
  price: z.coerce.number().positive("Price must be greater than 0").optional(),
  stock: z.coerce
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative")
    .optional(),
  category: z.string().optional(),
  isFeatured: z.enum(["true", "false"]).optional(),
});

const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["name", "price", "createdAt", "updatedAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  isFeatured: z.enum(["true", "false"]).optional(),
});

export { createProductSchema, updateProductSchema, productQuerySchema };
