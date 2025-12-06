import User from "../../models/User.model.js";
import { generateTokens } from "../../utils/index.js";
import bcrypt from "bcrypt";

// -------------------------
// @desc    Register new user
// @route   POST /api/user/auth/register
// @access  Public (Admin can create any role)
// -------------------------
export const createUser = async (req, res) => {
    const { username, emailAddress, mobileNumber, location, password, role } = req.body;

    try {
        // ✅ 1. Check if user already exists
        const doesUserExist = await User.exists({ emailAddress });
        if (doesUserExist) {
            return res.status(409).json({
                success: false,
                message: "User with this email address already exists",
            });
        }

        // ✅ 2. Set role properly (only admins can elevate)
        let assignedRole = "user";
        if (role && req.user?.role === "admin") {
            if (["user", "vendor", "admin"].includes(role)) {
                assignedRole = role;
            }
        }

        // ✅ 3. Create the user
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

        // ✅ 4. Generate tokens
        const { accessToken, refreshToken } = generateTokens(newUser);

        // ✅ 5. Remove sensitive fields
        const userResponse = newUser.toObject();
        delete userResponse.password;
        delete userResponse.passwordChangedAt;
        delete userResponse.savedVendors;

        // ✅ 6. Success response
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: userResponse,
            accessToken,
            refreshToken,
        });

    } catch (error) {
        console.error("Registration error:", error);

        // ✅ 7. Handle Mongoose validation errors cleanly
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((val) => val.message);

            return res.status(400).json({
                success: false,
                message: messages.join(", "),
            });
        }

        // ✅ 8. Generic fallback for unknown server crashes
        return res.status(500).json({
            success: false,
            message: "Failed to register user",
        });
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
            .json({ success: false, message: "Login field and password are required." });
    }

    try {
        const user = await User.findOne({
            $or: [{ emailAddress: login }, { mobileNumber: login }],
        }).select("+password");

        if (!user) {
            return res.status(401).json({ success: false, message: "User with the login doesn't exist." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res
                .status(401)
                .json({ success: false, message: "Invalid credentials (password)." });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.savedVendors;
        delete userResponse.passwordChangedAt;

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            user: userResponse,
            accessToken,
            refreshToken,
        });
    } catch (error) {
        console.error("Login Server Error:", error);
        return res
            .status(500)
            .json({ success: false, message: "An unexpected error occurred during login." });
    }
};

// -------------------------
// @desc    Logout user
// @route   POST /api/user/auth/logout
// @access  Public
// -------------------------
export const logoutUser = async (req, res) => {
    return res.status(200).json({ message: "Logged out successfully" });
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
