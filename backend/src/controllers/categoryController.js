import { prisma } from "../config/database.js";

/**
 * Get all categories with product counts
 * Public function
 */
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.product.groupBy({
      by: ["category"],
      where: {
        category: { not: null },
      },
      _count: true,
    });

    res.status(200).json({
      status: "success",
      data: { categories },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

/**
 * Get products in a specific category
 * Public function with pagination and sorting
 */
const getCategoryProducts = async (req, res) => {
  try {
    const { category } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Check if category exists
    const categoryExists = await prisma.product.findFirst({
      where: { category },
    });

    if (!categoryExists) {
      return res.status(404).json({ error: "Category not found" });
    }

    const products = await prisma.product.findMany({
      where: { category },
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    const total = await prisma.product.count({ where: { category } });

    res.status(200).json({
      status: "success",
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch category products" });
  }
};

/**
 * Get category statistics with product counts and stock levels
 * Public function
 */
const getCategoryStats = async (req, res) => {
  try {
    const categories = await prisma.product.groupBy({
      by: ["category"],
      where: {
        category: { not: null },
      },
      _count: true,
      _sum: { stock: true },
    });

    // Sort by product count descending
    categories.sort((a, b) => b._count - a._count);

    res.status(200).json({
      status: "success",
      data: { categories },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch category statistics" });
  }
};

/**
 * Validate if a category exists and get all valid categories
 * Public function
 */
const validateCategory = async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    const categoryExists = await prisma.product.findFirst({
      where: { category },
    });

    const isValid = !!categoryExists;

    // Get all available categories
    const allCategories = await prisma.product.groupBy({
      by: ["category"],
      where: {
        category: { not: null },
      },
    });

    const validCategories = allCategories.map((c) => c.category);

    res.status(200).json({
      status: "success",
      data: {
        isValid,
        validCategories,
        ...(isValid && { category }),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to validate category" });
  }
};

export {
  getCategories,
  getCategoryProducts,
  getCategoryStats,
  validateCategory,
};
