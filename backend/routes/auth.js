// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ================= COOKIE HELPER ==================
function setAuthCookie(res, token, remember = false) {
    const isProd = process.env.NODE_ENV === "production";
    const options = {
        httpOnly: true,             // cannot access from JS
        secure: isProd,             // only HTTPS in production
        sameSite: isProd ? "none" : "lax", // cross-site for production
        path: "/",                  // cookie path
    };

    if (remember) {
        options.maxAge = 1000 * 60 * 60 * 24 * 7; // 7 days
    } else {
        options.maxAge = 1000 * 60 * 60 * 24; // 1 day default
    }

    res.cookie("access_token", token, options);
}

// ================= REGISTER ==================
router.post("/register", async (req, res) => {
    try {
        const { email, password, full_name, phone, rememberMe } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ message: "Thiếu dữ liệu gửi lên server" });
        }

        // Check if email exists
        const exist = await User.findOne({ email }).lean();
        if (exist) {
            return res.status(400).json({ message: "Email đã tồn tại" });
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            password: hashed,
            fullName: full_name, // match schema
            phone: phone || "",
            role: "user",
        });

        // Create JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || "my-secret",
            { expiresIn: "7d" }
        );

        // Set cookie
        setAuthCookie(res, token, !!rememberMe);

        res.status(201).json({
            message: "Đăng ký thành công",
            user: {
                id: user._id,
                email: user.email,
                full_name: user.fullName,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (err) {
        console.error("🔥 REGISTER ERROR:", err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ", detail: err.message });
        }
        res.status(500).json({ message: "Lỗi server khi đăng ký" });
    }
});

// ================= LOGIN ==================
router.post("/login", async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        const user = await User.findOne({ email }).select("+password");
        if (!user) return res.status(401).json({ message: "Sai email hoặc mật khẩu" });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ message: "Sai email hoặc mật khẩu" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || "my-secret",
            { expiresIn: "7d" }
        );

        setAuthCookie(res, token, !!rememberMe);

        res.json({
            message: "Đăng nhập thành công",
            user: {
                id: user._id,
                email: user.email,
                full_name: user.fullName,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (err) {
        console.error("🔥 LOGIN ERROR:", err);
        res.status(500).json({ message: "Lỗi server khi đăng nhập" });
    }
});

// ================= GET CURRENT USER ==================
router.get("/me", async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) return res.json(null);

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "my-secret");

        const user = await User.findById(decoded.id).select("email fullName phone role");
        if (!user) return res.json(null);

        res.json({
            id: user._id,
            email: user.email,
            full_name: user.fullName,
            phone: user.phone,
            role: user.role,
        });
    } catch (err) {
        console.error("🔥 ME ERROR:", err);
        res.json(null); // token invalid/expired
    }
});

// ================= LOGOUT ==================
router.post("/logout", (req, res) => {
    res.clearCookie("access_token", { path: "/" });
    res.json({ ok: true });
});

module.exports = router;
