import Vendor from "../../models/Vendor.model.js";
import Review from "../../models/Review.model.js";
import mongoose from "mongoose";

/**
 * ✅ Get Vendor Reviews (Paginated + Filtered)
 * - Fetches paginated approved reviews for a vendor
 * - Populates user details
 * @route GET /api/v1/reviews/vendor/:vendorId
 * @access Public
 */
export const getVendorActiveReviews = async (req, res) => {
    try {
        const { vendorId } = req.params;

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Optional rating filter (1-5)
        const rating = req.query.rating ? parseInt(req.query.rating) : null;

        // ✅ Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(vendorId)) {
            return res.status(400).json({ message: "Invalid Vendor ID format." });
        }

        // ✅ Check vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found." });
        }

        // ✅ Base query
        const query = {
            vendor: vendorId,
            status: "Approved",
        };

        // ✅ Apply rating filter if specified
        if (rating && rating >= 1 && rating <= 5) {
            query.rating = rating;
        }

        // ✅ Total count with filters
        const totalReviews = await Review.countDocuments(query);

        // ✅ Execute paginated query
        const reviews = await Review.find(query)
            .populate({
                path: "user",
                select: "username profileImage _id",
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("-__v");

        res.status(200).json({
            success: true,
            page,
            limit,
            totalReviews,
            totalPages: Math.ceil(totalReviews / limit),
            count: reviews.length,
            ratingFilter: rating || "all",
            reviews,
            message: "Successfully fetched vendor reviews.",
        });
    } catch (error) {
        console.error("Error getting approved vendor reviews:", error);
        res.status(500).json({
            message: "Error fetching reviews for the vendor.",
        });
    }
};

/**
 * ✅ Create Review (CLEANED)
 * - The call to updateVendorRating is removed here and handled by the Mongoose 'post' middleware on Review.save()
 * @route POST /api/v1/reviews/new/:vendorId
 * @access Protected (User)
 */
export const createReview = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const userId = req.user.id;
        const { rating, comment } = req.body;

        if (!mongoose.Types.ObjectId.isValid(vendorId)) {
            return res.status(400).json({ message: "Invalid Vendor ID" });
        }

        // Ensure vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        // The .create() method calls .save(), which automatically triggers the
        // Mongoose 'post' middleware to call updateVendorRating(vendorId).
        const review = await Review.create({
            vendor: vendorId,
            user: userId,
            rating,
            comment,
        });

        res.status(201).json({
            message: "Review submitted successfully and vendor statistics updated.",
            review,
        });

    } catch (error) {
        console.log(error)
        if (error.code === 11000) {
            // Handles duplicate check via the unique index { vendor: 1, user: 1 }
            return res
                .status(400)
                .json({ message: "You've already reviewed this vendor." });
        }
        console.error("Error creating review:", error);
        res.status(500).json({ message: "Error creating review" });
    }
};

/**
 * ✅ Update Review (CLEANED)
 * - The logic to manually check for rating/status changes is simplified, 
 * as .save() triggers the middleware, which always fetches fresh data.
 * @route PATCH /api/v1/reviews/:reviewId
 * @access Protected (User - own reviews only)
 */
export const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Ensure user can only update their own review
        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this review" });
        }

        // Apply updates
        if (rating) review.rating = rating;
        if (comment) review.comment = comment;

        // The .save() method triggers the 'post' middleware to call updateVendorRating(review.vendor).
        await review.save();

        res.status(200).json({
            message: "Review updated successfully and vendor statistics recalculated.",
            review,
        });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ message: "Error updating review" });
    }
};

/**
 * ✅ Delete Review (CLEANED)
 * - The call to updateVendorRating is removed here and handled by the Mongoose 'post' middleware on Review.deleteOne()
 * @route DELETE /api/v1/reviews/:reviewId
 * @access Protected (User - own reviews only)
 */
export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Ensure user can only delete their own review
        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this review" });
        }

        // The deleteOne() method (called on the document) triggers the 'pre/post' middleware 
        // to call updateVendorRating(vendorId).
        await review.deleteOne();

        res.status(200).json({
            message: "Review deleted successfully and vendor statistics recalculated."
        });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Error deleting review" });
    }
};
