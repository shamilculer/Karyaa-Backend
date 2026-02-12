import express from 'express';
import {
    getVendorActiveReviews,
    createReview,
    createPublicReview,
    updateReview,
    deleteReview
} from "../../controllers/shared/reviews.controller.js";
import {
    getAllVendorReviews,
    flagReviewForRemoval,
    unflagReview
} from "../../controllers/vendor/reviews.controller.js";
import {
    getAllReviews,
    getFlaggedReviews,
    adminUpdateReview,
    adminDeleteReview
} from "../../controllers/admin/reviews.controller.js";
import { verifyToken } from '../../middleware/verifyToken.js';
import { verifyAdmin } from '../../middleware/verifyAdmin.js';
import { verifyVendor } from '../../middleware/verifyVendor.js';

const router = express.Router();

// Public routes - Get approved reviews for a vendor
router.get('/vendor/:vendorId', getVendorActiveReviews);
// Optional auth - if token exists, user info will be attached
router.post('/public/new', (req, res, next) => {
    // Try to verify token if present, but don't fail if missing
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (token) {
        verifyToken(req, res, next);
    } else {
        next();
    }
}, createPublicReview);

// User routes - Create, update, delete own reviews
router.post('/new/:vendorId', verifyToken, createReview);
router.patch('/:reviewId', verifyToken, updateReview);
router.delete('/:reviewId', verifyToken, deleteReview);

// Vendor routes - Get all reviews for their vendor, flag reviews
router.get('/vendor/all/:vendorId', verifyVendor, getAllVendorReviews);
router.patch('/flag/:reviewId', verifyVendor, flagReviewForRemoval);
router.patch('/unflag/:reviewId', verifyVendor, unflagReview);

// Admin routes - Manage all reviews
router.get('/admin/all', verifyAdmin, getAllReviews);
router.get('/admin/flagged', verifyAdmin, getFlaggedReviews);
router.patch('/admin/:reviewId', verifyAdmin, adminUpdateReview);
router.delete('/admin/:reviewId', verifyAdmin, adminDeleteReview);

export default router;