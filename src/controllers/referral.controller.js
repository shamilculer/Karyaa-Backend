import Referral from "../models/Referral.model.js";

/**
 * @description Creates a new business referral and saves it to the database.
 * @route POST /api/referrals
 * @access Protected (assuming referrer must be logged in)
 */
export const postReferral = async (req, res) => {
    try {
        const {
            referrerFullname,
            referrerEmail,
            referrerPhone,
            vendors,
        } = req.body;

        
        if (!referrerFullname || !referrerEmail || !vendors || vendors.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: Referrer's name, email, and at least one vendor are mandatory.",
            });
        }

        // Optional: Simple validation for vendor data structure
        const invalidVendor = vendors.some(v => !v.fullname || !v.email);
        if (invalidVendor) {
             return res.status(400).json({
                success: false,
                message: "All vendors must have a full name and an email address.",
            });
        }

        const newReferral = new Referral({
            referrerFullname,
            referrerEmail,
            referrerPhone,
            vendors,
        });

        await newReferral.save(); 

        res.status(201).json({
            success: true,
            message: "Referral submitted successfully!",
            data: {
                id: newReferral._id,
                referralCode: newReferral.referralCode,
            },
        });

    } catch (error) {
        console.error("Error posting referral:", error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: `Validation failed: ${messages.join(' ')}`,
            });
        }
        
        if (error.code === 11000) {
             return res.status(500).json({
                success: false,
                message: "A database conflict occurred while generating the referral code. Please try again.",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to submit referral due to a server error.",
        });
    }
};