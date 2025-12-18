
import User from "../models/user_model.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// ---------------- Register ----------------
export const register = asyncHandler(async (req, res) => {
    const { userName, email, password, profileImage, role } = req.body;

    const existUser = await User.findOne({ email });
    if (existUser) {
        return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
        userName,
        email,
        password: hashedPassword,
        profileImage,
        role,
        provider: "local"
    });

    res.status(201).json({
        message: "User registered successfully",
        user: newUser
    });
});

// ---------------- Login ----------------
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    // لو مستخدم Google → ما ينفعش يدخل بالباسورد
    if (user.provider === "google") {
        return res.status(400).json({ message: "Please login with Google" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
        message: "Login successful",
        token,
        user
    });
});

// ---------------- Get All Users ----------------
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({});
    res.status(200).json(users);
});
