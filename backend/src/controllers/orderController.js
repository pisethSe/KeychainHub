import { prisma } from "../config/database.js";

const createOrder = async (req, res) => {
  const { address, phone, notes } = req.body;

  // Get user's cart with items
  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  // Calculate total and verify stock
  let total = 0;
  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      return res.status(400).json({
        error: `Insufficient stock for ${item.product.name}`,
      });
    }
    total += item.product.price * item.quantity;
  }

  // Create order with items
  const order = await prisma.$transaction(async (tx) => {
    // Create order
    const newOrder = await tx.order.create({
      data: {
        userId: req.user.id,
        total,
        address,
        phone,
        notes,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Update product stock
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Clear cart
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return newOrder;
  });

  res.status(201).json({
    status: "success",
    data: { order },
  });
};

const getUserOrders = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    userId: req.user.id,
  };

  if (status) {
    where.status = status;
  }

  const orders = await prisma.order.findMany({
    where,
    skip,
    take,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  const total = await prisma.order.count({ where });

  res.status(200).json({
    status: "success",
    data: {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
};

const getOrder = async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  // Check if user owns this order (unless admin)
  if (order.userId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: "Not allowed to view this order" });
  }

  res.status(200).json({
    status: "success",
    data: { order },
  });
};

const cancelOrder = async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (order.userId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: "Not allowed to cancel this order" });
  }

  if (order.status !== "pending") {
    return res
      .status(400)
      .json({ error: "Only pending orders can be cancelled" });
  }

  // Cancel order and restore stock
  const cancelledOrder = await prisma.$transaction(async (tx) => {
    // Restore stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    // Update order status
    return await tx.order.update({
      where: { id },
      data: { status: "cancelled" },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  });

  res.status(200).json({
    status: "success",
    data: { order: cancelledOrder },
  });
};

// Admin controllers
const getAllOrders = async (req, res) => {
  const { page = 1, limit = 20, status, startDate, endDate } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {};

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const orders = await prisma.order.findMany({
    where,
    skip,
    take,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  const total = await prisma.order.count({ where });

  res.status(200).json({
    status: "success",
    data: {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  res.status(200).json({
    status: "success",
    data: { order: updatedOrder },
  });
};

const getOrderStats = async (req, res) => {
  const { timeRange = "month" } = req.query;

  const now = new Date();
  let startDate;

  switch (timeRange) {
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "year":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  const [
    totalOrders,
    totalRevenue,
    pendingOrders,
    completedOrders,
    dailyStats,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startDate } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { status: "pending", createdAt: { gte: startDate } },
    }),
    prisma.order.count({
      where: { status: "delivered", createdAt: { gte: startDate } },
    }),
    prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total) as revenue
      FROM orders
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
  ]);

  res.status(200).json({
    status: "success",
    data: {
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingOrders,
      completedOrders,
      dailyStats,
    },
  });
};

export {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
};
