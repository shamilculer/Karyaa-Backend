import Vendor from "../models/Vendor.model.js";
import Review from "../models/Review.model.js";
import mongoose from "mongoose";

/**
 * ✅ Get Vendor Reviews
 * - Fetches all approved reviews for a specific vendor.
 * - Populates the 'user' field to include the user's name and profile image.
 */
export const getVendorReviews = async (req, res) => {
    try {
        const { vendorId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(vendorId)) {
            return res.status(400).json({ message: "Invalid Vendor ID format." });
        }

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found." });
        }

        const reviews = await Review.find({ 
            vendor: vendorId,
            status: "Approved" 
        })
            // 💡 ADDED POPULATE HERE
            .populate({
                path: 'user',
                select: 'username profileImage _id'
            })
            .sort({ createdAt: -1 })
            .select('-__v');

        res.status(200).json({
            count: reviews.length,
            reviews,
            message: "Successfully fetched approved vendor reviews."
        });
    } catch (error) {
        console.error("Error getting approved vendor reviews:", error);
        res.status(500).json({ message: "Error fetching reviews for the vendor." });
    }
};


/**
 * ✅ Create Review (CLEANED)
 * - The call to updateVendorRating is removed here and handled by the Mongoose 'post' middleware on Review.save()
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

        // ❌ MANUAL CALL REMOVED: await updateVendorRating(vendorId); 

        res.status(201).json({
            message: "Review submitted successfully and vendor statistics updated.",
            review,
        });
        
    } catch (error) {
        if (error.code === 11000) {
            // Handles duplicate check via the unique index { vendor: 1, user: 1 }
            return res
                .status(400)
                .json({ message: "You’ve already reviewed this vendor." });
        }
        console.error("Error creating review:", error);
        res.status(500).json({ message: "Error creating review" });
    }
};

// ------------------------------------------------------------------

/**
 * ✅ Update Review (CLEANED)
 * - The logic to manually check for rating/status changes is simplified, 
 * as .save() triggers the middleware, which always fetches fresh data.
 */
export const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        // userId check can be added here for authorization if necessary (e.g., user can only update their own review)
        const { rating, comment, status } = req.body;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Apply updates
        if (rating) review.rating = rating;
        if (comment) review.comment = comment;
        if (status) review.status = status;

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

// ------------------------------------------------------------------

/**
 * ✅ Delete Review (CLEANED)
 * - The call to updateVendorRating is removed here and handled by the Mongoose 'post' middleware on Review.deleteOne()
 */
export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // The deleteOne() method (called on the document) triggers the 'pre/post' middleware 
        // to call updateVendorRating(vendorId).
        await review.deleteOne(); 

        // ❌ MANUAL CALL REMOVED: await updateVendorRating(vendorId);

        res.status(200).json({ 
            message: "Review deleted successfully and vendor statistics recalculated." 
        });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Error deleting review" });
    }
};