import Referral from "../../models/Referral.model.js";

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

        if (!referrerFullname || !referrerEmail || !referrerPhone || !vendors || vendors.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: Referrer's name, email, phone number and at least one vendor are mandatory.",
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

export const getReferrals = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Only Admin users can manage administrator access control.",
        });
    }
    try {
        const {
            page = 1,
            limit = 30,
            status,
            search,
        } = req.query;

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        let filter = {};

        if (status) {
            const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
            if (["Pending", "Completed", "Canceled"].includes(normalizedStatus)) {
                filter.status = normalizedStatus;
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status filter value. Must be Pending, Completed, or Canceled.",
                });
            }
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { referrerFullname: searchRegex },
                { referrerEmail: searchRegex },
                { 'vendors.fullname': searchRegex },
                { 'vendors.email': searchRegex },
                { referralCode: searchRegex },
            ];
        }

        const referrals = await Referral.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .select('-vendors._id -__v');

        const totalReferrals = await Referral.countDocuments(filter);

        const totalPages = Math.ceil(totalReferrals / limitNumber);

        res.status(200).json({
            success: true,
            message: "Referrals retrieved successfully.",
            data: referrals,
            pagination: {
                totalItems: totalReferrals,
                totalPages,
                currentPage: pageNumber,
                itemsPerPage: limitNumber,
                hasNextPage: pageNumber < totalPages,
            },
        });

    } catch (error) {
        console.error("Error fetching referrals:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve referrals due to a server error.",
        });
    }
};

export const updateReferralStatus = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Only Admin users can update referral status.",
        });
    }

    try {
        let { ids, status } = req.body;

        if (!ids) {
            return res.status(400).json({
                success: false,
                message: "Invalid request. 'ids' is required.",
            });
        }

        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        if (ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid request. 'ids' must contain at least one ID.",
            });
        }

        if (!status || !["Pending", "Completed", "Canceled"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be 'Pending', 'Completed', or 'Canceled'.",
            });
        }

        const invalidIds = ids.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid referral IDs: ${invalidIds.join(', ')}`,
            });
        }

        const result = await Referral.updateMany(
            { _id: { $in: ids } },
            { $set: { status } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "No referrals found with the provided IDs.",
            });
        }

        const message = ids.length === 1 
            ? `Successfully updated referral to '${status}'.`
            : `Successfully updated ${result.modifiedCount} referral(s) to '${status}'.`;

        res.status(200).json({
            success: true,
            message,
            data: {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
                requestedIds: ids.length,
            },
        });

    } catch (error) {
        console.error("Error updating referral status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update referral status due to a server error.",
        });
    }
};

export const deleteReferrals = async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Only Admin users can delete referrals.",
        });
    }

    try {
        let { ids } = req.body;

        // Normalize ids to always be an array (supports single or multiple)
        if (!ids) {
            return res.status(400).json({
                success: false,
                message: "Invalid request. 'ids' is required.",
            });
        }

        // Convert single ID to array for consistent handling
        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        if (ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid request. 'ids' must contain at least one ID.",
            });
        }

        // Validate all IDs are valid MongoDB ObjectIds
        const invalidIds = ids.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid referral IDs: ${invalidIds.join(', ')}`,
            });
        }

        // Perform bulk delete
        const result = await Referral.deleteMany(
            { _id: { $in: ids } }
        );

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "No referrals found with the provided IDs.",
            });
        }

        const message = ids.length === 1 
            ? "Successfully deleted referral."
            : `Successfully deleted ${result.deletedCount} referral(s).`;

        res.status(200).json({
            success: true,
            message,
            data: {
                deletedCount: result.deletedCount,
                requestedIds: ids.length,
            },
        });

    } catch (error) {
        console.error("Error deleting referrals:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete referrals due to a server error.",
        });
    }
};