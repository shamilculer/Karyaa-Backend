import User from "../models/User.model.js";
import { generateTokens } from "../utils/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// -------------------------
// @desc    Register new user
// @route   POST /api/user/auth/register
// @access  Public (Admin can create any role)
// -------------------------
export const createUser = async (req, res) => {
  const { username, emailAddress, mobileNumber, location, password, role } = req.body;

  try {
    // 1. Check if user already exists
    const doesUserExist = await User.exists({ emailAddress });
    if (doesUserExist) {
      return res
        .status(409)
        .json({ message: "User with this email address already exists" });
    }

    // 2. Set role: only allow admin to assign roles other than 'user'
    let assignedRole = "user";
    if (role && req.user?.role === "admin") {
      if (["user", "vendor", "admin"].includes(role)) {
        assignedRole = role;
      }
    }

    // 3. Create the user
    const newUser = new User({
      username,
      emailAddress,
      mobileNumber,
      location,
      password,
      role: assignedRole,
      profileImage: `https://ui-avatars.com/api/?background=random&color=fff&name=${encodeURIComponent(
        username
      )}`,
    });

    await newUser.save();

    // 4. Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser);

    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.passwordChangedAt;

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ message: "Failed to register user" });
  }
};

// -------------------------
// @desc    Login user
// @route   POST /api/user/auth/login
// @access  Public
// -------------------------
export const loginUser = async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res
      .status(400)
      .json({ message: "Login field and password are required." });
  }

  try {
    const user = await User.findOne({
      $or: [{ emailAddress: login }, { mobileNumber: login }],
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials (password)." });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.passwordChangedAt;

    return res.status(200).json({
      message: "Login successful.",
      user: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login Server Error:", error);
    return res
      .status(500)
      .json({ message: "An unexpected error occurred during login." });
  }
};

// -------------------------
// @desc    Logout user
// @route   POST /api/user/auth/logout
// @access  Public
// -------------------------
export const logoutUser = async (req, res) => {
  return res
    .status(200)
    .json({ message: "Logged out successfully" });
};

// -------------------------
// @desc    Refresh access token
// @route   POST /api/user/auth/refresh-token
// @access  Public
// -------------------------
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(payload.id).select("-password -passwordChangedAt");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("Token refresh error:", err);
    res.status(500).json({ message: "Failed to refresh token" });
  }
};

// -------------------------
// @desc    Fetch logged-in user session
// @route   GET /api/user/auth/session
// @access  Protected
// -------------------------
export const fetchUserSession = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -passwordChangedAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("Session fetch error:", err);
    res.status(500).json({ message: "Failed to fetch session" });
  }
};
