// models/Review.model.js

import mongoose from "mongoose";
import { updateVendorRating } from "../utils/updateVendorRating.js";

const reviewSchema = new mongoose.Schema(
    {
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: [true, "Vendor ID is required for the review"],
            index: true,
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

        // ✅ Admin Approval Field
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Approved",
            index: true,
        },

        // ✅ Flag system for moderation
        flaggedForRemoval: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true }
);

reviewSchema.index({ vendor: 1, user: 1 }, { unique: true }); 

// --- Mongoose Middleware Hooks for Vendor Stat Recalculation ---
reviewSchema.post("save", async function () {
    await updateVendorRating(this.vendor);
});

reviewSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    this._vendorId = this.vendor; 
    next();
});

reviewSchema.post("deleteOne", { document: true, query: false }, async function () {
    await updateVendorRating(this._vendorId);
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
