import Vendor from "../models/Vendor.model.js";
import Review from "../models/Review.model.js"; 

/**
 * Utility function to recalculate vendor's rating stats.
 * It fetches the current approved reviews and updates the Vendor document.
 * @param {mongoose.Types.ObjectId} vendorId The ID of the vendor to update.
 */
export const updateVendorRating = async (vendorId) => {
    try {
        // Fetch all approved reviews for that vendor
        const approvedReviews = await Review.find({
            vendor: vendorId,
            status: "Approved",
        }).select('rating');

        const reviewCount = approvedReviews.length;
        const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; 

        approvedReviews.forEach((r) => {
            const ratingKey = r.rating.toString();
            ratingBreakdown[ratingKey] = (ratingBreakdown[ratingKey] || 0) + 1;
        });

        const totalRatingSum = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = reviewCount > 0 ? totalRatingSum / reviewCount : 0;

        // Update Vendor model
        await Vendor.findByIdAndUpdate(vendorId, {
            averageRating: averageRating.toFixed(1),
            reviewCount,
            ratingBreakdown,
        }, { new: true });
        
    } catch (err) {
        console.error("Error updating vendor rating:", err);
    }
};