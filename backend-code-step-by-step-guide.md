# Backend Code Step-by-Step Guide

## Table of Contents

1. [Server Startup Process](#server-startup-process)
2. [Request Lifecycle](#request-lifecycle)
3. [Authentication Flow (Register/Login)](#authentication-flow)
4. [Protected Route Access](#protected-route-access)
5. [Database Operations](#database-operations)
6. [Error Handling](#error-handling)

## Server Startup Process

### Step 1: Initialize Server

```javascript
// File: backend/src/server.js
import app from "./app.js";
import dotenv from "dotenv";
import { prisma, connectDB, disconnectDB } from "./config/database.js";

dotenv.config(); // Load environment variables from .env file
```

### Step 2: Connect to Database

```javascript
// File: backend/src/server.js
async function testDatabase() {
  try {
    await connectDB(); // Calls function from config/database.js
    logger.info("✅ Database connected successfully");

    // Test connection by counting records
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();

    logger.info(
      `📊 Database has ${userCount} users and ${productCount} products`,
    );
    return true;
  } catch (error) {
    logger.error("❌ Database connection failed:", error.message);
    return false;
  }
}
```

### Step 3: Start Express Server

```javascript
// File: backend/src/server.js
const server = app.listen(PORT, () => {
  logger.info(`
🚀 Server running on port ${PORT}
📁 Environment: ${process.env.NODE_ENV || "development"}
🔗 Health check: http://localhost:${PORT}/api/health
  `);
});
```

### Step 4: Setup Graceful Shutdown

```javascript
// File: backend/src/server.js
const gracefulShutdown = async () => {
  logger.info("📦 Received shutdown signal, closing connections...");

  server.close(async () => {
    logger.info("✅ HTTP server closed");

    try {
      await disconnectDB(); // Close database connection
      logger.info("✅ Database connection closed");
      process.exit(0);
    } catch (error) {
      logger.error("❌ Error during shutdown:", error);
      process.exit(1);
    }
  });
};

// Listen for shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
```

## Request Lifecycle

### Step 1: Express App Configuration

```javascript
// File: backend/src/app.js
const app = express();

// Apply middleware in order
app.use(cors()); // Enable CORS
app.use(helmet()); // Security headers
app.use(morganMiddleware); // Request logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
```

### Step 2: Route Matching

```javascript
// File: backend/src/app.js
// API Routes - Express matches incoming requests to these patterns
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
```

### Step 3: Route Handler Execution

```javascript
// Example: backend/src/routes/authRoutes.js
router.post("/register", validateRequest(registerSchema), register);
// When POST /api/auth/register is received:
// 1. validateRequest middleware runs first
// 2. If validation passes, register controller runs
```

## Authentication Flow (Register/Login)

### Registration Process Step-by-Step

#### Step 1: Client Sends Request

```javascript
// Client sends POST request to /api/auth/register
// Body contains: { name, email, password, phone?, address? }
```

#### Step 2: Route Handler

```javascript
// File: backend/src/routes/authRoutes.js
router.post("/register", validateRequest(registerSchema), register);
```

#### Step 3: Validation Middleware

```javascript
// File: backend/src/middleware/validate.js
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Format validation errors
      const formatted = result.error.format();
      const flatErrors = Object.values(formatted)
        .flat()
        .filter(Boolean)
        .map((err) => err._errors)
        .flat();

      return res.status(400).json({
        status: "error",
        message: flatErrors.join(", "),
      });
    }

    req.body = result.data; // Replace with validated data
    next(); // Continue to next middleware/controller
  };
};
```

#### Step 4: Controller Execution

```javascript
// File: backend/src/controllers/authController.js
const register = async (req, res) => {
  const { name, email, password } = req.body; // Already validated

  // Step 4a: Check if user already exists
  const userExists = await prisma.user.findUnique({
    where: { email: email },
  });

  if (userExists) {
    return res
      .status(400)
      .json({ error: "User already exists with this email" });
  }

  // Step 4b: Hash password
  const salt = await bcrypt.genSalt(10); // Generate salt
  const hashedPassword = await bcrypt.hash(password, salt); // Hash password

  // Step 4c: Create user in database
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  // Step 4d: Generate JWT token
  const token = generateToken(user.id, res);

  // Step 4e: Send response
  res.status(201).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      token,
    },
  });
};
```

#### Step 5: JWT Token Generation

```javascript
// File: backend/src/utils/generateToken.js
import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });

  // Set cookie
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token;
};
```

### Login Process Step-by-Step

#### Step 1: Client Sends Request

```javascript
// Client sends POST request to /api/auth/login
// Body contains: { email, password }
```

#### Step 2: Validation (same as register)

```javascript
// Validates email format and password presence
```

#### Step 3: Controller Execution

```javascript
// File: backend/src/controllers/authController.js
const login = async (req, res) => {
  const { email, password } = req.body;

  // Step 3a: Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Step 3b: Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Step 3c: Generate JWT token
  const token = generateToken(user.id, res);

  // Step 3d: Send response
  res.status(200).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      token,
    },
  });
};
```

## Protected Route Access

### Step 1: Client Sends Request with Token

```javascript
// Options:
// 1. Authorization header: "Bearer <token>"
// 2. Cookie: jwt=<token>
```

### Step 2: Authentication Middleware

```javascript
// File: backend/src/middleware/auth.js
export const authMiddleware = async (req, res, next) => {
  let token;

  // Step 2a: Extract token from header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token provided" });
  }

  try {
    // Step 2b: Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 2c: Find user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    // Step 2d: Attach user to request
    req.user = user;
    next(); // Continue to controller
  } catch (err) {
    return res.status(401).json({ error: "Not authorized, token failed" });
  }
};
```

### Step 3: Controller Access to User

```javascript
// File: backend/src/controllers/authController.js
const getProfile = async (req, res) => {
  // req.user is available thanks to authMiddleware
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      avatar: true,
      isAdmin: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    status: "success",
    data: { user },
  });
};
```

## Database Operations

### Step 1: Prisma Client Initialization

```javascript
// File: backend/src/config/database.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});
```

### Step 2: Database Connection

```javascript
// File: backend/src/config/database.js
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("DB Connected via Prisma");
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};
```

### Step 3: Example Database Operations

```javascript
// Create operation
const user = await prisma.user.create({
  data: {
    name: "John Doe",
    email: "john@example.com",
    password: "hashedPassword",
  },
});

// Read operation
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
    // Exclude password
  },
});

// Update operation
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: {
    name: "Jane Doe",
    email: "jane@example.com",
  },
});

// Delete operation
await prisma.user.delete({
  where: { id: userId },
});
```

## Error Handling

### Step 1: Error Detection

```javascript
// Errors can occur at any point:
// - Validation errors in middleware
// - Database errors in controllers
// - JWT verification errors in auth middleware
// - Unexpected errors anywhere
```

### Step 2: Error Handler Middleware

```javascript
// File: backend/src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    err.statusCode = 400;
    err.message = "Invalid data provided";
  }

  // Handle Prisma unique constraint violations
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const field = err.meta?.target?.[0] || "field";
      err.statusCode = 400;
      err.message = `${field} already exists`;
    }
  }

  // Send error response
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    // Only include stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
```

### Step 3: 404 Handler

```javascript
// File: backend/src/middleware/errorHandler.js
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};
```

### Step 4: Error Response Format

```javascript
// Consistent error response format:
{
  "status": "error",
  "message": "Detailed error message",
  "stack": "Stack trace (development only)"
}
```

## Complete Request Example

### Example: User Registration Complete Flow

1. **Client Request**

   ```javascript
   POST /api/auth/register
   Content-Type: application/json

   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "password123"
   }
   ```

2. **Express App Receives Request**
   - CORS middleware runs
   - Body parser parses JSON
   - Route matches `/api/auth/register`

3. **Validation Middleware Runs**
   - Validates name (min 2 chars)
   - Validates email format
   - Validates password (min 6 chars)
   - If valid, continues to controller

4. **Controller Executes**
   - Checks if user exists
   - Hashes password with bcrypt
   - Creates user in database
   - Generates JWT token
   - Sets cookie
   - Returns response

5. **Response Sent to Client**
   ```javascript
   {
     "status": "success",
     "data": {
       "user": {
         "id": "user_id_here",
         "name": "John Doe",
         "email": "john@example.com",
         "isAdmin": false
       },
       "token": "jwt_token_here"
     }
   }
   ```

This step-by-step guide shows how your backend code processes requests from start to finish, following the workflow patterns you outlined. Your implementation is well-structured and follows best practices at each step!
