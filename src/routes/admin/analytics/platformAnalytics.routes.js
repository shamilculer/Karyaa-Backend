import express from "express";
import {
  getOverviewStats,
  getUserGrowth,
  getVendorGrowth,
  getVendorDistribution,
  getVendorStatusDistribution,
  getLeadMetrics,
  getEngagementMetrics,
} from "../../../controllers/admin/analytics/platformAnalytics.controller.js";
import { verifyAdmin } from "../../../middleware/verifyAdmin.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyAdmin);

// Overview statistics
router.get("/overview", getOverviewStats);

// User growth trends
router.get("/user-growth", getUserGrowth);

// Vendor growth trends
router.get("/vendor-growth", getVendorGrowth);

// Vendor distribution by category
router.get("/vendor-distribution", getVendorDistribution);

// Vendor status distribution
router.get("/vendor-status", getVendorStatusDistribution);

// Lead metrics
router.get("/lead-metrics", getLeadMetrics);

// Engagement metrics
router.get("/engagement", getEngagementMetrics);

export default router;
