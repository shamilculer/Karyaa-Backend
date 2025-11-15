// models/Review.model.js
import mongoose from "mongoose";
import { updateVendorRating } from "../utils/updateVendorRating.js";

const reviewSchema = new mongoose.Schema(
    {
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: [true, "Vendor ID is required for the review"],
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", 
            required: [true, "User ID is required"],
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: [true, "Rating value is required (1-5)"],
        },
        comment: {
            type: String,
            trim: true,
            required: [true, "Review comment is required"],
        },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Approved",
            index: true,
        },
        flaggedForRemoval: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true }
);

reviewSchema.index({ vendor: 1, user: 1 }, { unique: true }); 

// ✅ FIXED: Store previous state in pre-save hook
reviewSchema.pre("save", async function (next) {
    if (!this.isNew) {
        // Store the previous values before the document is modified
        const Review = mongoose.model("Review");
        const previousReview = await Review.findById(this._id).lean();
        this._previousState = previousReview;
    }
    next();
});

// ✅ FIXED: Always trigger rating update after save
reviewSchema.post("save", async function (doc) {
    try {
        // Check if this is a new review OR if status/rating changed
        const isNewReview = !this._previousState;
        const statusChanged = this._previousState && this._previousState.status !== doc.status;
        const ratingChanged = this._previousState && this._previousState.rating !== doc.rating;

        if (isNewReview || statusChanged || ratingChanged) {
            await updateVendorRating(doc.vendor);
        }
    } catch (error) {
        console.error("Error in review post-save hook:", error);
    }
});

// ✅ FIXED: Handle deleteOne on document instance
reviewSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    try {
        this._vendorToUpdate = this.vendor; // Store vendor ID for post hook
    } catch (error) {
        console.error("Error in review pre-deleteOne hook:", error);
    }
    next();
});

reviewSchema.post("deleteOne", { document: true, query: false }, async function (doc) {
    try {
        if (this._vendorToUpdate) {
            await updateVendorRating(this._vendorToUpdate);
        }
    } catch (error) {
        console.error("Error in review post-deleteOne hook:", error);
    }
});

// ✅ FIXED: Handle findOneAndDelete (used by findByIdAndDelete)
reviewSchema.pre("findOneAndDelete", async function (next) {
    try {
        const docToDelete = await this.model.findOne(this.getQuery()).lean();
        if (docToDelete) {
            this._vendorToUpdate = docToDelete.vendor;
        }
    } catch (error) {
        console.error("Error in review pre-findOneAndDelete hook:", error);
    }
    next();
});

reviewSchema.post("findOneAndDelete", async function (doc) {
    try {
        if (this._vendorToUpdate) {
            await updateVendorRating(this._vendorToUpdate);
        }
    } catch (error) {
        console.error("Error in review post-findOneAndDelete hook:", error);
    }
});

const Review = mongoose.model("Review", reviewSchema);
export default Review;