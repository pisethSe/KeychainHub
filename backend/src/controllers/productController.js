import { prisma } from "../config/database.js";
import fs from "fs";
import path from "path";

const getProducts = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    minPrice,
    maxPrice,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    isFeatured,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = {};

  if (category) {
    where.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = parseFloat(minPrice);
    if (maxPrice !== undefined) where.price.lte = parseFloat(maxPrice);
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (isFeatured !== undefined) {
    where.isFeatured = isFeatured === "true";
  }

  // Get products
  const products = await prisma.product.findMany({
    where,
    skip,
    take,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  // Get total count for pagination
  const total = await prisma.product.count({ where });

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
};

const getProduct = async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.status(200).json({
    status: "success",
    data: { product },
  });
};

const getFeaturedProducts = async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  const products = await prisma.product.findMany({
    where: { isFeatured: true },
    take: limit,
  });

  res.status(200).json({
    status: "success",
    data: { products },
  });
};

const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  const limit = parseInt(req.query.limit) || 20;

  const products = await prisma.product.findMany({
    where: { category },
    take: limit,
  });

  res.status(200).json({
    status: "success",
    data: { products },
  });
};

const searchProducts = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Search query is required" });
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 20,
  });

  res.status(200).json({
    status: "success",
    data: { products },
  });
};

const getCategories = async (req, res) => {
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
};

// Admin controllers
const createProduct = async (req, res) => {
  const { name, description, price, stock, category, isFeatured } = req.body;

  // Handle uploaded images
  const images = req.files
    ? req.files.map((file) => `/uploads/products/${file.filename}`)
    : [];

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      isFeatured: isFeatured === "true",
      images,
    },
  });

  res.status(201).json({
    status: "success",
    data: { product },
  });
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, category, isFeatured } = req.body;

  // Check if product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    return res.status(404).json({ error: "Product not found" });
  }

  // Handle new images
  let images = existingProduct.images;
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map(
      (file) => `/uploads/products/${file.filename}`,
    );
    images = [...images, ...newImages];
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: name || existingProduct.name,
      description: description || existingProduct.description,
      price: price ? parseFloat(price) : existingProduct.price,
      stock: stock ? parseInt(stock) : existingProduct.stock,
      category: category || existingProduct.category,
      isFeatured:
        isFeatured !== undefined
          ? isFeatured === "true"
          : existingProduct.isFeatured,
      images,
    },
  });

  res.status(200).json({
    status: "success",
    data: { product },
  });
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  // Delete associated images
  if (product.images && product.images.length > 0) {
    product.images.forEach((imagePath) => {
      const fullPath = path.join(process.cwd(), imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });
  }

  await prisma.product.delete({
    where: { id },
  });

  res.status(200).json({
    status: "success",
    message: "Product deleted successfully",
  });
};

const updateStock = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const product = await prisma.product.update({
    where: { id },
    data: {
      stock: parseInt(quantity),
    },
  });

  res.status(200).json({
    status: "success",
    data: { product },
  });
};

const getProductStats = async (req, res) => {
  const [
    totalProducts,
    totalStock,
    averagePrice,
    categoryStats,
    featuredCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.aggregate({ _sum: { stock: true } }),
    prisma.product.aggregate({ _avg: { price: true } }),
    prisma.product.groupBy({
      by: ["category"],
      _count: true,
      _sum: { stock: true },
    }),
    prisma.product.count({ where: { isFeatured: true } }),
  ]);

  const lowStock = await prisma.product.count({
    where: { stock: { lt: 10, gt: 0 } },
  });

  const outOfStock = await prisma.product.count({
    where: { stock: 0 },
  });

  res.status(200).json({
    status: "success",
    data: {
      totalProducts,
      totalStock: totalStock._sum.stock || 0,
      averagePrice: averagePrice._avg.price || 0,
      featuredCount,
      lowStock,
      outOfStock,
      categoryStats,
    },
  });
};

export {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getProductsByCategory,
  searchProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductStats,
};
