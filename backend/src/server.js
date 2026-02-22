import express from "express"; // why need to import express
import dotenv from "dotenv"; // to use .env file for environment variables
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { prisma, connectDB, disconnectDB } from "./config/database.js";
import { logger } from "./utils/logger.js";

// import Routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { morganMiddleware } from "./utils/logger.js";

dotenv.config(); // to load .env file
connectDB(); // connect to database

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // use app variable to create server name

// Basic middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for development
  }),
);

// Use morgan middleware from logger
app.use(morganMiddleware);

//body parsing middlewares
//this part is use to parse the data that we send to the body such as (json, urlencoded)
app.use(express.json()); // to parse json data in the body
app.use(express.urlencoded({ extended: true })); // to parse urlencoded data in the body

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Keychain Shop API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// this part is for routes that u import from routes files
// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// the result wil show when u access to localhost:5001/api/health in postman or browser

const PORT = process.env.PORT || 0; // Use 0 to let OS assign a random free port

//  await connectDB();
const server = app.listen(PORT, "0.0.0.0", () => {
  const actualPort = server.address().port;
  logger.info(`
🚀 Server running on port ${actualPort}
📁 Environment: ${process.env.NODE_ENV || "development"}
🔗 Health check: http://localhost:${actualPort}/api/health
  `);
});

// Handle unhandled promise rejections (e.g., database connection errors)
// so in this part, if there is unhandled rejection, it will log the error and close the server and disconnect from database
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

// Handle uncaught exceptions
// so this part will catch any uncaught exceptions in the application, log the error, disconnect from the database, and exit the process
process.on("uncaughtException", async (err) => {
  logger.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1);
});

// Graceful shutdown on SIGTERM and SIGINT
// this part will handle graceful shutdown when the application receives a SIGTERM or SIGINT signal
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});
