import User from "../models/User.model.js";
import { generateTokens } from "../utils/index.js";
import bcrypt from "bcrypt";
import Category from "../models/Category.model.js";
import mongoose from "mongoose";

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

// -----------------------------------------------------------------------------------
// @desc    Get all vendors saved by the logged-in user
// @route   GET /api/user/saved-vendors
// @access  Protected (User must be logged in)
// -----------------------------------------------------------------------------------
export const getSavedVendors = async (req, res) => {
  try {
    const userId = req.user.id;
    const { categories } = req.query;

    let matchStage = {};

    // If categories filter is provided, find category IDs
    if (categories) {
      const categoryArray = categories.split(',').map(cat => cat.trim());
      const categoryDocs = await Category.find({
        slug: { $in: categoryArray }
      }).select('_id');
      
      const categoryIds = categoryDocs.map(cat => cat._id);
      
      if (categoryIds.length > 0) {
        matchStage = {
          mainCategory: { $in: categoryIds }
        };
      }
    }

    const result = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'vendors', // MongoDB collection name
          localField: 'savedVendors',
          foreignField: '_id',
          as: 'savedVendors',
          pipeline: [
            ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
            {
              $lookup: {
                from: 'galleryitems', // GalleryItem collection name
                localField: '_id',
                foreignField: 'vendor',
                as: 'gallery',
                pipeline: [
                  { $sort: { orderIndex: 1, createdAt: -1 } }, // Sort by orderIndex, then by creation date
                  {
                    $project: {
                      url: 1,
                      isFeatured: 1,
                      orderIndex: 1,
                      createdAt: 1
                    }
                  }
                ]
              }
            },
            {
              $project: {
                businessName: 1,
                slug: 1,
                businessDescription: 1,
                averageRating: 1,
                pricingStartingFrom: 1,
                isRecommended: 1,
                'address.city': 1,
                mainCategory: 1,
                gallery: 1 // Include gallery items
              }
            }
          ]
        }
      },
      {
        $project: {
          savedVendors: 1
        }
      }
    ]);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const savedVendors = result[0].savedVendors;

    res.status(200).json({
      status: "success",
      results: savedVendors.length,
      data: {
        savedVendors,
      },
    });
  } catch (error) {
    console.error("Error fetching saved vendors:", error);
    res.status(500).json({ message: "Failed to retrieve saved vendors." });
  }
};
// -----------------------------------------------------------------------------------
// @desc    Adds or removes a vendor ID from the user's savedVendors list.
// @route   PATCH /api/user/saved-vendors/toggle
// @access  Protected (User must be logged in)
// -----------------------------------------------------------------------------------
export const toggleSavedVendor = async (req, res) => {
  const { vendorId } = req.body;
  const userId = req.user.id;

  if (!vendorId) {
    return res.status(400).json({ message: "Vendor ID is required." });
  }

  try {
    // 1. Check if the vendor is already saved
    const user = await User.findById(userId).select("savedVendors");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isSaved = user.savedVendors.includes(vendorId);

    let updateOperation, message, savedStatus;

    if (isSaved) {
      // 2. If it is saved, UN-SAVE it ($pull removes the ID)
      updateOperation = { $pull: { savedVendors: vendorId } };
      message = "Vendor removed from saved list.";
      savedStatus = false;
    } else {
      // 3. If it is NOT saved, SAVE it ($addToSet adds the ID only if it doesn't exist)
      updateOperation = { $addToSet: { savedVendors: vendorId } };
      message = "Vendor added to saved list.";
      savedStatus = true;
    }

    // 4. Execute the atomic update
    await User.findByIdAndUpdate(userId, updateOperation, { new: true });

    // 5. Send the response with the status and message
    res.status(200).json({
      success: true,
      message: message,
      saved: savedStatus,
    });
  } catch (error) {
    console.error("Error toggling saved vendor:", error);
    // This could capture validation errors (e.g., invalid vendorId format)
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid vendor ID format." });
    }
    res.status(500).json({ message: "Failed to update saved vendor list." });
  }
};

// -------------------------
// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Protected
// -------------------------
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -passwordChangedAt -passwordResetToken -passwordResetExpires -savedVendors -role -isVerified"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
};

// -------------------------
// @desc    Update user profile (including profile image)
// @route   PATCH /api/user/profile
// @access  Protected
// -------------------------
export const updateUserProfile = async (req, res) => {
  const { username, emailAddress, mobileNumber, location, profileImage } = req.body;

  try {
    // 1. Get current user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 2. Check if email is being changed and if it's already taken
    if (emailAddress && emailAddress !== user.emailAddress) {
      const emailExists = await User.exists({
        emailAddress,
        _id: { $ne: req.user.id }
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: "Email address is already in use",
        });
      }
    }

    // 3. Check if mobile number is being changed and if it's already taken
    if (mobileNumber && mobileNumber !== user.mobileNumber) {
      const mobileExists = await User.exists({
        mobileNumber,
        _id: { $ne: req.user.id }
      });

      if (mobileExists) {
        return res.status(409).json({
          success: false,
          message: "Mobile number is already in use",
        });
      }
    }

    // 4. Build update object with all fields including profileImage
    const updateData = {};
    if (username) updateData.username = username;
    if (emailAddress) updateData.emailAddress = emailAddress;
    if (mobileNumber) updateData.mobileNumber = mobileNumber;
    if (location) updateData.location = location;

    // ✅ Handle profile image update
    if (profileImage) {
      updateData.profileImage = profileImage;
    }

    // 5. Apply updates
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: true,
        select: "-password -passwordChangedAt -passwordResetToken -passwordResetExpires -isVerified  -savedVendors"
      }
    );

    // 6. Success response
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Update profile error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `This ${field} is already in use`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// -------------------------
// @desc    Change user password
// @route   PATCH /api/user/profile/change-password
// @access  Protected
// -------------------------
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // 1. Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters",
    });
  }

  try {
    // 2. Get user with password
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 3. Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // 4. Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    // 5. Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    // 6. Success response
    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

// -------------------------
// @desc    Delete user account
// @route   DELETE /api/user/profile
// @access  Protected
// -------------------------
export const deleteUserAccount = async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Password is required to delete account",
    });
  }

  try {
    // 1. Get user with password
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // 3. Delete user
    await User.findByIdAndDelete(req.user.id);

    // 4. Success response
    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });

  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};