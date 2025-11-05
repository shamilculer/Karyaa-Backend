import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import Vendor from "../models/Vendor.model.js";
import Admin from "../models/Admin.model.js";
import { generateTokens } from "../utils/index.js";

// -------------------------
// @desc    Refresh access token for User, Vendor, or Admin
// @route   POST /api/util/refresh-token
// @access  Public
// -------------------------
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // ✅ Verify refresh token
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({ 
        message: "Invalid or expired refresh token" 
      });
    }

    // ✅ Determine which model to query based on role in JWT
    let account = null;
    let role = payload.role || 'user'; // Fallback to 'user' if no role in token

    // Query the appropriate model based on role
    switch (role) {
      case 'user':
        account = await User.findById(payload.id).select("-password -passwordChangedAt");
        break;
      
      case 'vendor':
        account = await Vendor.findById(payload.id).select("-password");
        break;
      
      case 'admin':
        account = await Admin.findById(payload.id).select("-password");
        break;
      
      default:
        return res.status(400).json({ 
          message: "Invalid role in refresh token" 
        });
    }

    // ✅ Check if account exists
    if (!account) {
      return res.status(404).json({ 
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} account not found` 
      });
    }

    // ✅ Check if account is active (optional, but recommended)
    if (account.status === 'inactive' || account.status === 'suspended') {
      return res.status(403).json({ 
        message: "Account is inactive or suspended" 
      });
    }

    // ✅ Generate new tokens (includes role automatically)
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(account);


    res.status(200).json({
      success: true,
      role: account.role,
      accessToken,
      refreshToken: newRefreshToken,
    });

  } catch (err) {
    console.error("Token refresh error:", err);
    res.status(500).json({ 
      message: "Failed to refresh token",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
