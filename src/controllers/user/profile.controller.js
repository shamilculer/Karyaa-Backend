import User from "../../models/User.model.js";
import bcrypt from "bcrypt";

// -------------------------
// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Protected
// -------------------------
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select(
            "-password -passwordChangedAt -passwordResetToken -passwordResetExpires -role -isVerified"
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
