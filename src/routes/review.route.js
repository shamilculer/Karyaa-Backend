import express from "express";
import {
    createReview,
    updateReview,
    deleteReview,
    getVendorActiveReviews,
    getAllVendorReviews,
    flagReviewForRemoval,
    getFlaggedReviews,
    adminUpdateReview,
    getAllReviews
} from "../controllers/reviews.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyVendor } from "../middleware/verifyVendor.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

router.get("/vendor/:vendorId", getVendorActiveReviews)
router.post("/new/:vendorId", verifyToken, createReview);
router.put("/:reviewId", verifyToken, updateReview); 
router.delete("/:reviewId", verifyToken, deleteReview);

router.get('/vendor/all/:vendorId', verifyVendor, getAllVendorReviews)
router.patch("/flag/:reviewId", verifyVendor, flagReviewForRemoval);

// Admin Routes
router.get("/admin/all", verifyAdmin, getAllReviews);
router.get("/admin/flagged", verifyAdmin, getFlaggedReviews);
router.patch("/admin/:reviewId", verifyAdmin, adminUpdateReview);

export default router;