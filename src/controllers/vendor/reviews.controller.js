import Review from "../../models/Review.model.js";
import Vendor from "../../models/Vendor.model.js";
import mongoose from "mongoose";

/**
 * @desc Paginated + filtered + searchable vendor reviews (all statuses)
 * @route GET /api/v1/reviews/vendor/all/:vendorId
 * @access Private (Vendor/Admin only)
 */
export const getAllVendorReviews = async (req, res) => {
    try {
        const { vendorId } = req.params;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const rating = req.query.rating ? parseInt(req.query.rating) : null;
        const status = req.query.status || null;
        const search = req.query.search?.trim() || "";

        if (!mongoose.Types.ObjectId.isValid(vendorId)) {
            return res.status(400).json({ message: "Invalid Vendor ID format." });
        }

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found." });
        }

        let query = { vendor: vendorId };

        if (status && status !== "all" && ["Pending", "Approved", "Rejected"].includes(status)) {
            query.status = status;
        }

        if (rating && rating >= 1 && rating <= 5) {
            query.rating = rating;
        }

        if (search.length > 0) {
            query.$or = [
                { comment: { $regex: search, $options: "i" } },
            ];
        }

        const totalReviews = await Review.countDocuments(query);

        const reviews = await Review.find(query)
            .populate({
                path: "user",
                select: "username profileImage _id",
                match: search
                    ? { username: { $regex: search, $options: "i" } }
                    : {}
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("-__v");

        const filteredReviews = search
            ? reviews.filter(r => r.user !== null)
            : reviews;

        res.status(200).json({
            success: true,
            page,
            limit,
            totalReviews,
            totalPages: Math.ceil(totalReviews / limit),
            count: filteredReviews.length,
            ratingFilter: rating || "all",
            statusFilter: status || "all",
            searchTerm: search || "",
            reviews: filteredReviews,
            message: "Successfully fetched vendor reviews.",
        });

    } catch (error) {
        console.error("Error getting vendor reviews:", error);

        res.status(500).json({
            success: false,
            message: "Error fetching vendor reviews.",
        });
    }
};

/**
 * @desc Flag a review for removal (Vendor Action)
 * @route PATCH /api/v1/reviews/flag/:reviewId
 * @access Vendor (protected via verifyVendor middleware)
 */
export const flagReviewForRemoval = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const vendorId = req.user?.id; // decoded from JWT

        // ✅ Ensure a valid review ID format
        if (!reviewId) {
            return res.status(400).json({ message: "Review ID is required." });
        }

        // ✅ Find the review
        const review = await Review.findById(reviewId).populate("vendor");
        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        // ✅ Ensure review belongs to this vendor
        if (review.vendor._id.toString() !== vendorId) {
            return res.status(403).json({
                message: "You are not allowed to flag reviews for other vendors.",
            });
        }

        // ✅ Prevent duplicate flags
        if (review.flaggedForRemoval === true) {
            return res.status(400).json({
                message: "This review has already been flagged for removal.",
            });
        }

        // ✅ Update status + flag
        review.flaggedForRemoval = true;
        review.status = "Pending";
        await review.save();

        return res.status(200).json({
            success: true,
            message: "Review successfully flagged for removal and set to Pending.",
            review,
        });

    } catch (error) {
        console.error("Error flagging review for removal:", error);
        return res.status(500).json({
            message: "Server error while flagging review.",
        });
    }
};
