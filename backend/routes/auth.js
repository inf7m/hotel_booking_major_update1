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
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
    };

    if (remember) {
        options.maxAge = 1000 * 60 * 60 * 24 * 7; // 7 days
    }

    res.cookie("access_token", token, options);
}

// ================= REGISTER ==================
router.post("/register", async (req, res) => {
    try {
        const { email, password, full_name, phone, rememberMe } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ message: "Thiếu dữ liệu" });
        }

        const exist = await User.findOne({ email }).lean();
        if (exist) {
            return res.status(400).json({ message: "Email đã tồn tại" });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            password: hashed,
            fullName: full_name,
            phone: phone || "",
            role: email === "admin@hotel.com" ? "admin" : "user", // HOTFIX
        });

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                email: user.email, // 🔥 REQUIRED
            },
            process.env.JWT_SECRET || "my-secret",
            { expiresIn: "7d" }
        );

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
        console.error("REGISTER ERROR:", err);
        res.status(500).json({ message: "Lỗi server" });
    }
});

// ================= LOGIN ==================
router.post("/login", async (req, res) => {
    try {
        console.log("📩 BODY LOGIN:", req.body);

        const { email, password, rememberMe } = req.body;

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
        }

        // 🔥 HOTFIX: force admin role
        const role =
            email === "admin@hotel.com" ? "admin" : user.role;

        const token = jwt.sign(
            {
                id: user._id,
                role,
                email: user.email, // 🔥 REQUIRED
            },
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
                role,
            },
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ message: "Lỗi server" });
    }
});

// ================= ME ==================
router.get("/me", async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) return res.json(null);

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "my-secret");

        res.json({
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        });
    } catch (err) {
        console.error("ME ERROR:", err);
        res.json(null);
    }
});

// ================= LOGOUT ==================
router.post("/logout", (req, res) => {
    res.clearCookie("access_token", { path: "/" });
    res.json({ ok: true });
});

module.exports = router;
