import { prisma } from "../config/database.js";

const getDashboardStats = async (req, res) => {
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
    totalProducts,
    totalUsers,
    pendingOrders,
    completedOrders,
    lowStockProducts,
    outOfStockProducts,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startDate } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { total: true },
    }),
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.count({
      where: { status: "pending", createdAt: { gte: startDate } },
    }),
    prisma.order.count({
      where: { status: "delivered", createdAt: { gte: startDate } },
    }),
    prisma.product.count({
      where: { stock: { lt: 10, gt: 0 } },
    }),
    prisma.product.count({
      where: { stock: 0 },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const dashboardData = {
    overview: {
      totalRevenue: totalRevenue._sum.total || 0,
      totalOrders,
      totalProducts,
      totalUsers,
      growthRate:
        totalOrders > 0
          ? ((completedOrders / totalOrders) * 100).toFixed(2)
          : "0.00",
    },
    stats: {
      pendingOrders,
      completedOrders,
      lowStockProducts,
      outOfStockProducts,
    },
    recentOrders,
    timeRange,
  };

  res.status(200).json({
    status: "success",
    data: dashboardData,
  });
};

const getSalesAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "startDate and endDate are required" });
  }

  const analytics = await prisma.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as orders,
      SUM(total) as revenue
    FROM orders
    WHERE created_at >= ${new Date(startDate)} AND created_at <= ${new Date(endDate)}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;

  res.status(200).json({
    status: "success",
    data: { analytics },
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

const getAllUsers = async (req, res) => {
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
};

const getAllProducts = async (req, res) => {
  const { page = 1, limit = 20, category, search } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {};

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    skip,
    take,
    orderBy: {
      createdAt: "desc",
    },
  });

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

const getSystemStats = async (req, res) => {
  const [
    totalOrders,
    totalRevenue,
    totalProducts,
    totalUsers,
    pendingOrders,
    lowStockCount,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.product.count({ where: { stock: { lt: 10, gt: 0 } } }),
  ]);

  const systemStats = {
    totals: {
      orders: totalOrders,
      revenue: totalRevenue._sum.total || 0,
      products: totalProducts,
      users: totalUsers,
    },
    pending: {
      orders: pendingOrders,
      lowStock: lowStockCount,
    },
    performance: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    },
  };

  res.status(200).json({
    status: "success",
    data: systemStats,
  });
};

const bulkUpdateProducts = async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: "Updates must be an array" });
  }

  const results = [];

  for (const update of updates) {
    try {
      const { id, ...updateData } = update;
      const product = await prisma.product.update({
        where: { id },
        data: updateData,
      });
      results.push({ id, success: true, product });
    } catch (error) {
      results.push({
        id: update.id,
        success: false,
        error: error.message,
      });
    }
  }

  res.status(200).json({
    status: "success",
    data: { results },
  });
};

const sendBulkEmail = async (req, res) => {
  const { subject, message, userIds } = req.body;

  if (!subject || !message) {
    return res.status(400).json({
      error: "Subject and message are required",
    });
  }

  // In a real implementation, this would send emails to all specified users
  // For now, just simulate

  res.status(200).json({
    status: "success",
    data: {
      recipients: userIds?.length || "all users",
      subject,
      messagePreview: message.substring(0, 100) + "...",
    },
  });
};

const exportData = async (req, res) => {
  const { type, format = "json" } = req.query;

  let data;
  let filename;

  switch (type) {
    case "orders":
      const orders = await prisma.order.findMany({
        take: 1000,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      data = orders;
      filename = `orders-export-${new Date().toISOString().split("T")[0]}`;
      break;

    case "products":
      const products = await prisma.product.findMany({
        take: 1000,
        orderBy: { createdAt: "desc" },
      });
      data = products;
      filename = `products-export-${new Date().toISOString().split("T")[0]}`;
      break;

    case "users":
      const users = await prisma.user.findMany({
        take: 1000,
        orderBy: { createdAt: "desc" },
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
      data = users;
      filename = `users-export-${new Date().toISOString().split("T")[0]}`;
      break;

    default:
      return res.status(400).json({ error: "Invalid export type" });
  }

  if (format === "csv") {
    // Convert to CSV (simplified)
    let csv = "";
    if (data.length > 0) {
      const headers = Object.keys(data[0]).join(",");
      csv += headers + "\n";

      data.forEach((item) => {
        const row = Object.values(item)
          .map((val) => (typeof val === "object" ? JSON.stringify(val) : val))
          .join(",");
        csv += row + "\n";
      });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}.csv"`,
    );
    return res.send(csv);
  } else {
    // JSON format
    res.status(200).json({
      status: "success",
      data: {
        type,
        format,
        count: data.length,
        data,
      },
    });
  }
};

export {
  getDashboardStats,
  getSalesAnalytics,
  updateOrderStatus,
  getAllOrders,
  getAllUsers,
  getAllProducts,
  getSystemStats,
  bulkUpdateProducts,
  sendBulkEmail,
  exportData,
};
