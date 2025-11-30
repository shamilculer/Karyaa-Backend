import express from "express";
import {
    getEnquiriesOverTime,
    getLeadSourceBreakdown,
    getProfileViewSourceBreakdown,
    getEnquiriesByEventType,
    getEnquiriesByLocation,
    getLeadStatusDistribution,
    getReviewInsights,
    trackProfileView,
    getProfileViewsOverTime,
    getViewsVsEnquiries,
} from "../../controllers/vendor/analytics.controller.js";
import { verifyVendor } from "../../middleware/verifyVendor.js";

const router = express.Router();

// Lead analytics endpoints (vendor-specific)
router.get("/leads/enquiries-over-time", verifyVendor, getEnquiriesOverTime);
router.get("/leads/lead-source", verifyVendor, getLeadSourceBreakdown);
router.get("/leads/by-event-type", verifyVendor, getEnquiriesByEventType);
router.get("/leads/by-location", verifyVendor, getEnquiriesByLocation);
router.get("/leads/status-distribution", verifyVendor, getLeadStatusDistribution);

// Review insights endpoint
router.get("/reviews/insights", verifyVendor, getReviewInsights);

// Profile view tracking (public endpoint - no auth required)
router.post("/track-view", trackProfileView);

// Profile view analytics (vendor-specific)
router.get("/profile-views", verifyVendor, getProfileViewsOverTime);
router.get("/profile-view-source", verifyVendor, getProfileViewSourceBreakdown);
router.get("/views-vs-enquiries", verifyVendor, getViewsVsEnquiries);

export default router;
