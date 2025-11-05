import express from "express";
import {
    createReview,
    updateReview,
    deleteReview,
    getVendorActiveReviews,
    getAllVendorReviews,
    flagReviewForRemoval
} from "../controllers/reviews.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyVendor } from "../middleware/verifyVendor.js";

const router = express.Router();

router.get("/vendor/:vendorId", getVendorActiveReviews)
router.post("/new/:vendorId", verifyToken, createReview);
router.put("/:reviewId", verifyToken, updateReview); 
router.delete("/:reviewId", verifyToken, deleteReview);

router.get('/vendor/all/:vendorId', verifyVendor, getAllVendorReviews)
router.patch("/flag/:reviewId", verifyVendor, flagReviewForRemoval);

export default router;