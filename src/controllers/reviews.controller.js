import Vendor from "../models/Vendor.model.js";
import Review from "../models/Review.model.js";
import mongoose from "mongoose";

/**
 * ✅ Get Vendor Reviews (Paginated + FIltered)
 * - Fetches paginated approved reviews for a vendor
 * - Populates user details
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
 * @desc Paginated + filtered + searchable vendor reviews (all statuses)
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


/**
 * @desc Get all flagged reviews (Admin Action)
 * @route GET /api/v1/reviews/admin/flagged
 * @access Admin (protected via verifyAdmin middleware)
 */
export const getFlaggedReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const rating = req.query.rating ? parseInt(req.query.rating) : null;
    const status = req.query.status || null;
    const search = req.query.search?.trim() || "";

    // Base query for flagged reviews
    let query = { flaggedForRemoval: true };

    // Apply status filter
    if (status && status !== "all" && ["Pending", "Approved", "Rejected"].includes(status)) {
      query.status = status;
    }

    // Apply rating filter
    if (rating && rating >= 1 && rating <= 5) {
      query.rating = { $lte: rating };
    }

    // Apply search filter
    if (search.length > 0) {
      query.$or = [
        { comment: { $regex: search, $options: "i" } },
      ];
    }

    const totalReviews = await Review.countDocuments(query);

    const reviews = await Review.find(query)
      .populate({
        path: "user",
        select: "username profileImage email _id",
      })
      .populate({
        path: "vendor",
        select: "businessName logo _id",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    // Filter out reviews where user might be null (if search doesn't match)
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
      message: "Successfully fetched flagged reviews.",
    });

  } catch (error) {
    console.error("Error getting flagged reviews:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching flagged reviews.",
    });
  }
};


/**
 * @desc Bulk action on reviews (Admin Action)
 * @route POST /api/v1/reviews/admin/bulk-action
 * @access Admin (protected via verifyAdmin middleware)
 */
export const bulkActionReviews = async (req, res) => {
  try {
    const { reviewIds, action } = req.body;

    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Review IDs array is required.",
      });
    }

    if (!["approve", "reject", "delete"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'approve', 'reject', or 'delete'.",
      });
    }

    let result;

    if (action === "delete") {
      // Delete reviews
      result = await Review.deleteMany({ _id: { $in: reviewIds } });
      
      return res.status(200).json({
        success: true,
        message: `${result.deletedCount} review(s) deleted successfully.`,
        deletedCount: result.deletedCount,
      });
    } else if (action === "approve") {
      // Approve reviews and unflag them
      result = await Review.updateMany(
        { _id: { $in: reviewIds } },
        { $set: { status: "Approved", flaggedForRemoval: false } }
      );

      return res.status(200).json({
        success: true,
        message: `${result.modifiedCount} review(s) approved successfully.`,
        modifiedCount: result.modifiedCount,
      });
    } else if (action === "reject") {
      // Reject reviews
      result = await Review.updateMany(
        { _id: { $in: reviewIds } },
        { $set: { status: "Rejected" } }
      );

      return res.status(200).json({
        success: true,
        message: `${result.modifiedCount} review(s) rejected successfully.`,
        modifiedCount: result.modifiedCount,
      });
    }

  } catch (error) {
    console.error("Error performing bulk action:", error);
    res.status(500).json({
      success: false,
      message: "Error performing bulk action on reviews.",
    });
  }
};


/**
 * @desc Single action on a review (Admin Action)
 * @route POST /api/v1/reviews/admin/action/:reviewId
 * @access Admin (protected via verifyAdmin middleware)
 */
export const singleActionReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { action } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID format.",
      });
    }

    if (!["approve", "reject", "delete"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'approve', 'reject', or 'delete'.",
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    if (action === "delete") {
      await review.deleteOne();
      return res.status(200).json({
        success: true,
        message: "Review deleted successfully.",
      });
    } else if (action === "approve") {
      review.status = "Approved";
      review.flaggedForRemoval = false;
      await review.save();

      return res.status(200).json({
        success: true,
        message: "Review approved successfully.",
        review,
      });
    } else if (action === "reject") {
      review.status = "Rejected";
      await review.save();

      return res.status(200).json({
        success: true,
        message: "Review rejected successfully.",
        review,
      });
    }

  } catch (error) {
    console.error("Error performing single action:", error);
    res.status(500).json({
      success: false,
      message: "Error performing action on review.",
    });
  }
};