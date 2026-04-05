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

const app = express();

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

// ─────────────────────────────────────────
// GENERAL MIDDLEWARE
// ─────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

module.exports = app;