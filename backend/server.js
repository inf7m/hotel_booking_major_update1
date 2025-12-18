// ==============================
//   LOAD ENVIRONMENT
// ==============================
require("dotenv").config();

// ==============================
//   IMPORTS (COMMONJS)
// ==============================
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

// Nếu deploy sau Nginx / Render / Heroku
app.set("trust proxy", 1);

// ==============================
//   CORS SETUP
// ==============================
const ENV_ORIGINS = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  ""
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const FALLBACK_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  // "http://localhost:5000", // Thêm dòng này cho production mode
  // "http://127.0.0.1:5000", // Thêm dòng này cho production mode
];

const ALLOWED_ORIGINS = [...new Set([
    ...ENV_ORIGINS,
    ...FALLBACK_ORIGINS,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://hoteltransylvania.up.railway.app",
    "https://hoteltransylvania.up.railway.app"
])];
app.use(
  cors({
    origin(origin, cb) {
      // Cho phép không có origin (same-origin requests, Postman, mobile app)
      if (!origin) return cb(null, true);

      // Kiểm tra origin có trong danh sách cho phép
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);

      // Từ chối các origin khác
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ==============================
//   BODY PARSER
// ==============================
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// ==============================
//   STATIC: UPLOADS
// ==============================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "7d",
    immutable: true,
  })
);

// ==============================
//   ROUTES
// ==============================
const authRoutes = require("./routes/auth");
const hotelRoutes = require("./routes/hotels");
const roomRoutes = require("./routes/rooms");
const bookingRoutes = require("./routes/bookings");
const adminRoutes = require("./routes/admin");

app.use("/api/auth", authRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

// health check
app.get("/api/health", (_req, res) => res.json({ status: "OK" }));

// ==============================
//   SERVE FRONTEND (PRODUCTION)
// ==============================
if (process.env.NODE_ENV === "production") {
  console.log("🚀 Serving frontend from ../frontend/dist");

  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// ==============================
//   ERROR HANDLER
// ==============================
app.use((err, _req, res, _next) => {
  console.error("🔥 Server error:", err.stack);
  res.status(500).json({ message: "Có lỗi xảy ra trên server" });
});

// ==============================
//   404 HANDLER
// ==============================
app.use((_req, res) =>
  res.status(404).json({ message: "Route không tồn tại" })
);

// ==============================
//   START SERVER
// ==============================
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGODB_URI_ORIGINAL;

async function startServer() {
    const connectDB = require("./config/mongodbConnection.js");
    try {
        mongodbConnection = await connectDB()
        console.log(mongodbConnection.connection.readyState)
        console.log("✅ MongoDB connected");

    const publicUrl =
      process.env.BACKEND_PUBLIC_URL || `http://localhost:${PORT}`;

    app.listen(PORT, () => {
      console.log(`🚀 Server started at ${publicUrl}`);
      console.log("🌐 Allowed origins:", ALLOWED_ORIGINS.join(", "));
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}
console.log(process.env.MONGODB_URI_ORIGINAL)
startServer();
