import express from "express";
import {
  getTotalRevenue,
  getRevenueByBundle,
  getRevenueOverTime,
  getBundlePerformance,
  getSubscriptionMetrics,
} from "../../../controllers/admin/analytics/revenueAnalytics.controller.js";
import { verifyAdmin } from "../../../middleware/verifyAdmin.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyAdmin);

// Total revenue and overview stats
router.get("/overview", getTotalRevenue);

// Revenue breakdown by bundle
router.get("/by-bundle", getRevenueByBundle);

// Revenue trends over time
router.get("/over-time", getRevenueOverTime);

// Bundle performance metrics
router.get("/bundle-performance", getBundlePerformance);

// Subscription metrics
router.get("/subscriptions", getSubscriptionMetrics);

export default router;
