import Review from "../../models/Review.model.js";

/**
 * @desc Get all reviews system-wide (Admin only)
 * @route GET /api/v1/reviews/admin/all
 * @access Admin
 */
export const getAllReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const status = req.query.status; // Pending, Approved, Rejected
        const rating = req.query.rating ? parseInt(req.query.rating) : null;
        const search = req.query.search?.trim() || "";
        const flagged = req.query.flagged === 'true';

        let query = {};

        if (status && status !== "All") {
            query.status = status;
        }

        if (rating) {
            query.rating = rating;
        }

        if (flagged) {
            query.flaggedForRemoval = true;
        }

        if (search) {
            query.$or = [
                { comment: { $regex: search, $options: "i" } }
            ];
        }

        const totalReviews = await Review.countDocuments(query);

        const reviews = await Review.find(query)
            .populate({
                path: "user",
                select: "username profileImage _id emailAddress mobileNumber",
            })
            .populate({
                path: "vendor",
                select: "businessName _id businessLogo email phoneNumber whatsAppNumber ownerName",
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            reviews,
            totalReviews,
            totalPages: Math.ceil(totalReviews / limit),
            currentPage: page,
        });

    } catch (error) {
        console.error("Error fetching all reviews:", error);
        res.status(500).json({ message: "Error fetching all reviews" });
    }
};

/**
 * @desc Get all flagged reviews (Admin only)
 * @route GET /api/v1/reviews/admin/flagged
 * @access Admin
 */
export const getFlaggedReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const status = req.query.status; // Pending, Approved, Rejected
        const search = req.query.search?.trim() || "";

        let query = { flaggedForRemoval: true };

        if (status && status !== "All") {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { comment: { $regex: search, $options: "i" } }
            ];
        }

        const totalReviews = await Review.countDocuments(query);

        const reviews = await Review.find(query)
            .populate({
                path: "user",
                select: "username profileImage _id emailAddress mobileNumber",
            })
            .populate({
                path: "vendor",
                select: "businessName _id businessLogo email phoneNumber whatsAppNumber ownerName",
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            reviews,
            totalReviews,
            totalPages: Math.ceil(totalReviews / limit),
            currentPage: page,
        });

    } catch (error) {
        console.error("Error fetching flagged reviews:", error);
        res.status(500).json({ message: "Error fetching flagged reviews" });
    }
};

/**
 * @desc Admin update review (status or dismiss flag)
 * @route PATCH /api/v1/reviews/admin/:reviewId
 * @access Admin
 */
export const adminUpdateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { status, flaggedForRemoval } = req.body;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        if (status) {
            review.status = status;
            // If admin approves a review, automatically unflag it
            if (status === 'Approved') {
                review.flaggedForRemoval = false;
            }
        }

        if (typeof flaggedForRemoval === 'boolean') {
            review.flaggedForRemoval = flaggedForRemoval;
            // If admin dismisses a flag (sets to false), automatically approve the review
            if (flaggedForRemoval === false) {
                review.status = 'Approved';
            }
        }

        await review.save();

        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            review
        });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ message: "Error updating review" });
    }
};
