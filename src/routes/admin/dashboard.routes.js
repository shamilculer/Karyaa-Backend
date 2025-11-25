import express from "express";
import { getDashboardOverview, getActionItemsList } from "../../controllers/admin/dashboard.controller.js";
import { verifyAdmin } from "../../middleware/verifyAdmin.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyAdmin);

// Dashboard overview statistics
router.get("/overview", getDashboardOverview);

// Admin action items list
router.get("/action-items", getActionItemsList);

export default router;
