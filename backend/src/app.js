const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

// Routes
const authRoutes = require("./routes/auth.routes");
const businessRoutes = require("./routes/business.routes");
const warehouseRoutes = require("./routes/warehouse.routes");
const teamRoutes = require("./routes/team.routes");
const productRoutes = require("./routes/product.routes");
const stockRoutes = require("./routes/stock.routes");
const transactionRoutes = require("./routes/transaction.routes");
const reportRoutes = require("./routes/report.routes");
const platformRoutes = require("./routes/superadmin.routes");

const app = express();

// ─────────────────────────────────────────
// REQUEST LOGGER
// ─────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─────────────────────────────────────────
// SECURITY MIDDLEWARE
// ─────────────────────────────────────────
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use("/api", limiter);

// Stricter limiter specifically for login, to slow down credential brute-forcing
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again later.",
  skipSuccessfulRequests: true,
});
app.use("/api/auth/login", loginLimiter);

// ─────────────────────────────────────────
// GENERAL MIDDLEWARE
// ─────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://192.168.0.101:5173",
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/businesses/:businessId/warehouses", warehouseRoutes);
app.use("/api/businesses/:businessId/team", teamRoutes);
app.use("/api/businesses/:businessId/products", productRoutes);
app.use("/api/businesses/:businessId/stock", stockRoutes);
app.use("/api/businesses/:businessId/transactions", transactionRoutes);
app.use("/api/businesses/:businessId/reports", reportRoutes);
app.use("/api/platform", platformRoutes);

// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// ─────────────────────────────────────────
// 404 HANDLER
// ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.isOperational ? err.statusCode : 500;
  const message = err.isOperational ? err.message : "Internal server error";

  if (!err.isOperational) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
  });
});

module.exports = app;