import express from "express";
import {
    createReview,
    updateReview,
    deleteReview,
    getVendorReviews
} from "../controllers/reviews.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/vendor/:vendorId", getVendorReviews)
router.post("/new/:vendorId", verifyToken, createReview);
router.put("/:reviewId", verifyToken, updateReview); 
router.delete("/:reviewId", verifyToken, deleteReview);

export default router;