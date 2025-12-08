import Vendor from "../../models/Vendor.model.js";
import { sendEmail } from "../../services/email.service.js";
import crypto from "crypto";

// -------------------------
// @desc    Request password reset for vendor
// @route   POST /api/vendor/auth/forgot-password
// @access  Public
// -------------------------
export const requestVendorPasswordReset = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email address is required",
        });
    }

    try {
        const vendor = await Vendor.findOne({ email });

        // Don't reveal if vendor exists for security
        if (!vendor) {
            return res.status(200).json({
                success: true,
                message: "If an account exists with this email, a password reset link has been sent",
            });
        }

        // Generate reset token (random 32-byte hex string)
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash token before storing
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Set token and expiry (10 minutes)
        vendor.passwordResetToken = hashedToken;
        vendor.passwordResetExpires = Date.now() + 10 * 60 * 1000;
        await vendor.save({ validateBeforeSave: false });

        // Send email with unhashed token
        const resetUrl = `${process.env.FRONTEND_URL}/vendor/reset-password?token=${resetToken}`;

        try {
            await sendEmail({
                to: email,
                template: "password-reset",
                data: {
                    name: vendor.ownerName,
                    resetUrl,
                    expiryMinutes: 10,
                },
            });

            console.log(`✅ Password reset email sent to vendor: ${email}`);
        } catch (emailError) {
            // Rollback token if email fails
            vendor.passwordResetToken = undefined;
            vendor.passwordResetExpires = undefined;
            await vendor.save({ validateBeforeSave: false });

            console.error("Error sending vendor password reset email:", emailError);
            return res.status(500).json({
                success: false,
                message: "Failed to send password reset email. Please try again later.",
            });
        }

        res.status(200).json({
            success: true,
            message: "If an account exists with this email, a password reset link has been sent",
        });
    } catch (error) {
        console.error("Vendor password reset request error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process password reset request",
        });
    }
};

// -------------------------
// @desc    Reset vendor password with token
// @route   POST /api/vendor/auth/reset-password
// @access  Public
// -------------------------
export const resetVendorPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Token and new password are required",
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long",
        });
    }

    try {
        // Hash the token from URL to compare with stored hash
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Find vendor with valid token
        const vendor = await Vendor.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!vendor) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token. Please request a new password reset.",
            });
        }

        // Update password (will be hashed by pre-save hook)
        vendor.password = newPassword;
        vendor.passwordResetToken = undefined;
        vendor.passwordResetExpires = undefined;
        await vendor.save();

        console.log(`✅ Password reset successful for vendor: ${vendor.email}`);

        res.status(200).json({
            success: true,
            message: "Password reset successful. You can now login with your new password.",
        });
    } catch (error) {
        console.error("Vendor password reset error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reset password. Please try again.",
        });
    }
};
