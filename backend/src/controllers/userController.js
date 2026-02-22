import { prisma } from "../config/database.js";
import bcrypt from "bcryptjs";

/**
 * Get all users with pagination and search
 * Admin only function
 * Requires admin middleware
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    const total = await prisma.user.count({ where });

    res.status(200).json({
      status: "success",
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/**
 * Get a specific user by ID
 * Admin only function
 * Requires admin middleware
 */
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

/**
 * Update user information
 * Admin only function
 * Requires admin middleware
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
};

/**
 * Delete a user
 * Admin only function
 * Requires admin middleware
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (req.user && req.user.id === id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

/**
 * Update user role (admin status)
 * Admin only function
 * Requires admin middleware
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent admin from removing their own admin status
    if (req.user && req.user.id === id && !isAdmin) {
      return res
        .status(400)
        .json({ error: "Cannot remove your own admin status" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isAdmin: isAdmin === true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      status: "success",
      data: { user: updatedUser },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user role" });
  }
};

/**
 * Reset user password
 * Admin only function
 * Requires admin middleware
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a random password
    const newPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // In a real application, you would send this password via email
    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
      data: { newPassword }, // Note: In production, send via email only
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset password" });
  }
};

/**
 * Get user statistics
 * Admin only function
 * Requires admin middleware
 */
const getUserStats = async (req, res) => {
  try {
    const [totalUsers, newUsersThisMonth, adminUsers, regularUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            },
          },
        }),
        prisma.user.count({ where: { isAdmin: true } }),
        prisma.user.count({ where: { isAdmin: false } }),
      ]);

    const stats = {
      totalUsers,
      newUsersThisMonth,
      adminUsers,
      regularUsers,
    };

    res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user statistics" });
  }
};

export {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserRole,
  resetUserPassword,
  getUserStats,
};
