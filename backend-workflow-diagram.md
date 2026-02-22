# Backend Workflow Diagram

## Request Flow Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Request│───▶│     Express App  │───▶│   Route Handler │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Response      │◀───│   Error Handler  │◀───│   Controller    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                ▲                        │
                                │                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Logger/Utils   │    │   Database      │
                       └──────────────────┘    └─────────────────┘
```

## Authentication Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   Register  │───▶│   Validate   │───▶│ Check Email │───▶│ Hash Pwd    │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
                                                                │
                                                                ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   Response  │◀───│  JWT Token   │◀───│ Create User │◀───│ Save to DB  │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘

┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│    Login    │───▶│   Validate   │───▶│ Find User   │───▶│ Verify Pwd  │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
                                                                │
                                                                ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   Response  │◀───│  JWT Token   │◀───│ User Data   │◀───│ Valid Pwd   │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
```

## Middleware Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        Express App                              │
├─────────────────────────────────────────────────────────────────┤
│  1. CORS Configuration                                          │
│  2. Helmet Security                                             │
│  3. Morgan Logging                                             │
│  4. Body Parser (JSON & URL-encoded)                           │
│  5. Static Files                                               │
├─────────────────────────────────────────────────────────────────┤
│                        Route Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Auth Routes │  │Product Routes│  │ Cart Routes │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                    Middleware per Route                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Validation  │  │ Auth Check  │  │ Admin Check │            │
│  │ Middleware  │  │ Middleware  │  │ Middleware  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                      Controller Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Auth Ctrl   │  │Product Ctrl │  │ Cart Ctrl   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                      Service Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Auth Service│  │Product Svc  │  │ Cart Service│            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                     Database Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Prisma    │  │ PostgreSQL   │  │   Models     │            │
│  │   Client    │  │  Database   │  │  Relations  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                     Error Handling                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ 404 Handler │  │ Error Mdw   │  │   Logger    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure Map

```
backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server startup & graceful shutdown
│   ├── config/
│   │   └── database.js        # Prisma client & DB connection
│   ├── controllers/
│   │   ├── authController.js  # Auth logic (register, login, etc.)
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   └── orderController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   ├── validate.js        # Request validation middleware
│   │   └── errorHandler.js    # Global error handling
│   ├── routes/
│   │   ├── authRoutes.js      # Auth endpoints
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   └── orderRoutes.js
│   ├── validators/
│   │   └── authValidator.js   # Zod validation schemas
│   ├── services/
│   │   └── authService.js     # Business logic services
│   └── utils/
│       ├── generateToken.js   # JWT token generation
│       └── logger.js          # Logging utilities
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Database seeding
└── package.json
```

## Data Flow Example (User Registration)

```
1. Client POST /api/auth/register
   ↓
2. Express App receives request
   ↓
3. Route: router.post("/register", validateRequest(registerSchema), register)
   ↓
4. Middleware: validateRequest(registerSchema)
   - Validates name, email, password
   - Returns 400 if invalid
   ↓
5. Controller: register(req, res)
   - Check if user exists in DB
   - Hash password with bcrypt
   - Create user in DB
   - Generate JWT token
   - Set cookie
   - Return response
   ↓
6. Response sent to client
```

## Security Flow

```
┌─────────────────┐
│   Protected     │
│     Route       │
└─────────────────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐
│ Check for Token │───▶│ No Token Found  │
│ (Header/Cookie) │    │ Return 401      │
└─────────────────┘    └─────────────────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐
│  Verify JWT      │───▶│ Invalid Token   │
│  Signature       │    │ Return 401      │
└─────────────────┘    └─────────────────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐
│  Find User in   │───▶│ User Not Found  │
│  Database       │    │ Return 401      │
└─────────────────┘    └─────────────────┘
          │
          ▼
┌─────────────────┐
│ Attach User to  │
│   req.user      │
└─────────────────┘
          │
          ▼
┌─────────────────┐
│   next()        │
│ Continue to     │
│   Controller    │
└─────────────────┘
```

This workflow diagram shows how your backend follows a clean, modular architecture with proper separation of concerns. Your implementation matches the example workflow perfectly and adds additional features for a more robust e-commerce application.
