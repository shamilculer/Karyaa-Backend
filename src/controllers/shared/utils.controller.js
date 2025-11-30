import jwt from "jsonwebtoken";
import User from "../../models/User.model.js";
import Vendor from "../../models/Vendor.model.js";
import Admin from "../../models/Admin.model.js";
import { generateTokens } from "../../utils/index.js";

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


export const getCurrentAdminData = async (req, res) => {
  const adminId = req.params.adminId;

  if (!adminId) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed. No admin ID found in request."
    });
  }

  try {
    const admin = await Admin.findById(adminId)
      .select("fullName profileImage role email phoneNumber adminLevel accessControl isActive");


    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found."
      });
    }

    // 🟢 RESTRICTED ADMIN RESPONSE PAYLOAD (Map Mongoose document to a simple object)
    const adminResponse = {
      id: admin._id,
      fullName: admin.fullName,
      profileImage: admin.profileImage,
      role: admin.role,
      email: admin.email,
      phoneNumber: admin.phoneNumber,
      adminLevel: admin.adminLevel,
      accessControl: admin.accessControl,
      isActive: admin.isActive,
    };

    // Return the fresh, filtered admin object
    return res.status(200).json({
      success: true,
      admin: adminResponse,
      message: "Fresh admin data retrieved successfully."
    });

  } catch (error) {
    console.error("Error fetching current admin data:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving admin data."
    });
  }
};

export const getCurrentUserData = async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed. No user ID found in request."
    });
  }

  try {
    const user = await User.findById(userId)
      .select("username emailAddress mobileNumber profileImage role location isVerified");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found."
      });
    }

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.emailAddress,
      mobileNumber: user.mobileNumber,
      profileImage: user.profileImage,
      role: user.role,
      location: user.location,
      isVerified: user.isVerified,
    };

    return res.status(200).json({
      success: true,
      user: userResponse,
      message: "Fresh user data retrieved successfully."
    });

  } catch (error) {
    console.error("Error fetching current user data:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving user data."
    });
  }
};

export const getCurrentVendorData = async (req, res) => {
  const vendorId = req.params.vendorId;

  if (!vendorId) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed. No vendor ID found in request."
    });
  }

  try {
    const vendor = await Vendor.findById(vendorId)
      .select("businessName email phoneNumber businessLogo role slug tagline vendorStatus selectedBundle")
      .populate("selectedBundle", "_id name");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor account not found."
      });
    }

    const vendorResponse = {
      id: vendor._id,
      businessName: vendor.businessName,
      email: vendor.email,
      phoneNumber: vendor.phoneNumber,
      businessLogo: vendor.businessLogo,
      role: vendor.role,
      slug: vendor.slug,
      tagline: vendor.tagline,
      vendorStatus: vendor.vendorStatus,
      bundle: vendor.selectedBundle?._id || null,
    };

    return res.status(200).json({
      success: true,
      vendor: vendorResponse,
      message: "Fresh vendor data retrieved successfully."
    });

  } catch (error) {
    console.error("Error fetching current vendor data:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving vendor data."
    });
  }
};
