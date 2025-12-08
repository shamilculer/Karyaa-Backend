import User from "../../models/User.model.js";
import { sendEmail } from "../../services/email.service.js";
import crypto from "crypto";

// -------------------------
// @desc    Request password reset
// @route   POST /api/user/auth/forgot-password
// @access  Public
// -------------------------
export const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email address is required",
        });
    }

    try {
        const user = await User.findOne({ emailAddress: email });

        // Check if user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address.",
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
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
        await user.save({ validateBeforeSave: false });

        // Send email with unhashed token
        const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

        try {
            await sendEmail({
                to: email,
                template: "password-reset",
                data: {
                    name: user.username,
                    resetUrl,
                    expiryMinutes: 10,
                },
            });

            console.log(`✅ Password reset email sent to ${email}`);
        } catch (emailError) {
            // Rollback token if email fails
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            console.error("Error sending password reset email:", emailError);
            return res.status(500).json({
                success: false,
                message: "Failed to send password reset email. Please try again later.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Password reset link has been sent to your email.",
        });
    } catch (error) {
        console.error("Password reset request error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process password reset request",
        });
    }
};

// -------------------------
// @desc    Reset password with token
// @route   POST /api/user/auth/reset-password
// @access  Public
// -------------------------
export const resetPassword = async (req, res) => {
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

        // Find user with valid token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token. Please request a new password reset.",
            });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        console.log(`✅ Password reset successful for user: ${user.emailAddress}`);

        res.status(200).json({
            success: true,
            message: "Password reset successful. You can now login with your new password.",
        });
    } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reset password. Please try again.",
        });
    }
};
