import { prisma } from "../config/database.js";

const getCart = async (req, res) => {
  let cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // Create cart if it doesn't exist
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  // Calculate totals
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  res.status(200).json({
    status: "success",
    data: {
      cart: {
        id: cart.id,
        items: cart.items,
        subtotal,
        total: subtotal, // Add tax/shipping logic here if needed
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    },
  });
};

const addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  // Check if product exists and has stock
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  if (product.stock < quantity) {
    return res.status(400).json({ error: "Insufficient stock" });
  }

  // Get or create cart
  let cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: req.user.id },
    });
  }

  // Check if item already in cart
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  let cartItem;
  if (existingItem) {
    // Update quantity
    cartItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
      },
      include: {
        product: true,
      },
    });
  } else {
    // Add new item
    cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
      include: {
        product: true,
      },
    });
  }

  res.status(201).json({
    status: "success",
    data: { cartItem },
  });
};

const updateCartItem = async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  // Find cart item and verify ownership
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: true,
      product: true,
    },
  });

  if (!cartItem) {
    return res.status(404).json({ error: "Cart item not found" });
  }

  if (cartItem.cart.userId !== req.user.id) {
    return res
      .status(403)
      .json({ error: "Not allowed to update this cart item" });
  }

  if (cartItem.product.stock < quantity) {
    return res.status(400).json({ error: "Insufficient stock" });
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return res.status(200).json({
      status: "success",
      message: "Item removed from cart",
    });
  }

  const updatedItem = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
    include: {
      product: true,
    },
  });

  res.status(200).json({
    status: "success",
    data: { cartItem: updatedItem },
  });
};

const removeFromCart = async (req, res) => {
  const { itemId } = req.params;

  // Find cart item and verify ownership
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: true,
    },
  });

  if (!cartItem) {
    return res.status(404).json({ error: "Cart item not found" });
  }

  if (cartItem.cart.userId !== req.user.id) {
    return res
      .status(403)
      .json({ error: "Not allowed to remove this cart item" });
  }

  await prisma.cartItem.delete({
    where: { id: itemId },
  });

  res.status(200).json({
    status: "success",
    message: "Item removed from cart",
  });
};

const clearCart = async (req, res) => {
  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
  });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }

  res.status(200).json({
    status: "success",
    message: "Cart cleared",
  });
};

const getCartItemCount = async (req, res) => {
  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: {
      items: true,
    },
  });

  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  res.status(200).json({
    status: "success",
    data: { count },
  });
};

export {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartItemCount,
};
