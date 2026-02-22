import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const adminId = "admin-user-id"; // This will be replaced with the actual admin ID after creation

const products = [
  {
    name: "Naruto Keychain",
    description: "High-quality Naruto Uzumaki keychain with detailed design",
    price: 12.99,
    stock: 100,
    category: "Anime",
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
    ],
  },
  {
    name: "Minecraft Creeper Keychain",
    description: "Glow in the dark Creeper keychain from Minecraft",
    price: 9.99,
    stock: 75,
    category: "Games",
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1606041012202-37a1c6322a9a?w=400&h=400&fit=crop",
    ],
  },
  {
    name: "Star Wars Lightsaber Keychain",
    description: "LED lightsaber keychain with sound effects",
    price: 14.99,
    stock: 50,
    category: "Movies",
    isFeatured: false,
    images: [
      "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400&h=400&fit=crop",
    ],
  },
  {
    name: "Custom Name Keychain",
    description: "Personalized keychain with your name engraved",
    price: 8.99,
    stock: 200,
    category: "Custom",
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1590642915988-3c8f5d6f1c1c?w=400&h=400&fit=crop",
    ],
  },
  {
    name: "Cat Keychain",
    description: "Adorable cat keychain with moving parts",
    price: 7.99,
    stock: 150,
    category: "Animals",
    isFeatured: false,
    images: [
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop",
    ],
  },
  {
    name: "Dragon Ball Z Keychain",
    description: "Collectible Dragon Ball Z character keychain",
    price: 11.99,
    stock: 80,
    category: "Anime",
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=400&h=400&fit=crop",
    ],
  },
  {
    name: "Pokeball Keychain",
    description: "Official Pokemon Pokeball keychain",
    price: 10.99,
    stock: 120,
    category: "Games",
    isFeatured: false,
    images: [
      "https://images.unsplash.com/photo-1611974159858-34c0dbb8add3?w=400&h=400&fit=crop",
    ],
  },
  {
    name: "Harry Potter Wand Keychain",
    description: "Miniature replica of Harry Potter's wand",
    price: 13.99,
    stock: 60,
    category: "Movies",
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
    ],
  },
];

const main = async () => {
  console.log("🌱 Starting database seed...");

  try {
    // Clear existing data
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});

    console.log("✅ Cleared existing data");

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.create({
      data: {
        email: "admin@keychain.com",
        password: adminPassword,
        name: "Admin User",
        isAdmin: true,
        phone: "+1234567890",
        address: "123 Admin Street",
      },
    });
    console.log(`✅ Admin user created: ${admin.email}`);

    // Create regular users
    const users = [];
    for (let i = 1; i <= 3; i++) {
      const password = await bcrypt.hash(`user${i}@123`, 10);
      const user = await prisma.user.create({
        data: {
          email: `user${i}@example.com`,
          password: password,
          name: `User ${i}`,
          phone: `+123456789${i}`,
          address: `${i} User Street`,
        },
      });
      users.push(user);
      console.log(`✅ User created: ${user.email}`);
    }

    // Create carts for all users
    const allUsers = [admin, ...users];
    for (const user of allUsers) {
      await prisma.cart.create({
        data: { userId: user.id },
      });
    }
    console.log("✅ Carts created for all users");

    // Create products
    for (const product of products) {
      await prisma.product.create({
        data: {
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.category,
          isFeatured: product.isFeatured,
          images: product.images,
        },
      });
      console.log(`✅ Created product: ${product.name}`);
    }

    // Create sample orders for regular users
    const allProducts = await prisma.product.findMany();

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      if (allProducts.length >= 2) {
        const order = await prisma.order.create({
          data: {
            userId: user.id,
            total: 45.97,
            status: i === 0 ? "delivered" : "pending",
            address: user.address,
            phone: user.phone,
            notes: i === 0 ? "Left at front door" : null,
            items: {
              create: [
                {
                  productId: allProducts[0].id,
                  quantity: 2,
                  price: allProducts[0].price,
                },
                {
                  productId: allProducts[1].id,
                  quantity: 1,
                  price: allProducts[1].price,
                },
              ],
            },
          },
        });
        console.log(
          `✅ Order created for ${user.email}: ${order.id.slice(0, 8)}`,
        );
      }
    }

    console.log("🎉 Database seed completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
