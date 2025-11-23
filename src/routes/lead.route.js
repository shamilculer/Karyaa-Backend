import express from "express";
import { 
    deleteLead,
    getVendorLeads,
    postLead,
    updateLeadStatus
} from "../controllers/lead.controller.js";
import { verifyVendor } from "../middleware/verifyVendor.js"

const router = express.Router();

// Route to handle lead submission
router.post("/new", postLead);
router.get("/vendor", verifyVendor, getVendorLeads)
router.patch("/status", verifyVendor, updateLeadStatus)
router.delete("/delete", verifyVendor, deleteLead)

export default router;
