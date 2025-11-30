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
    getOverviewStats,
    trackWhatsAppClick,
} from "../../controllers/vendor/analytics.controller.js";
import {
    trackPackageInterest,
    getPackageInterestsOverTime,
    getInterestsByPackage,
} from "../../controllers/vendor/packageAnalytics.controller.js";
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
router.get("/vendor/overview-stats", verifyVendor, getOverviewStats);
router.post("/track-whatsapp", trackWhatsAppClick);

// Package analytics endpoints
router.post("/package/interest", trackPackageInterest); // Public - no auth
router.get("/package/interests-over-time", verifyVendor, getPackageInterestsOverTime);
router.get("/package/interests-by-package", verifyVendor, getInterestsByPackage);

export default router;
