import express from "express"
import {
    getAllActiveBundles,
    getBundlesForRegistration,
    getVendorSubscriptionStatus,
    sendBundleEnquiry
} from "../../controllers/admin/bundles.controller.js"
import { verifyVendor } from "../../middleware/verifyVendor.js"

const router = express.Router()

router.get("/registration-options", getBundlesForRegistration);
router.get("/active", verifyVendor, getAllActiveBundles);
router.post("/enquiry", verifyVendor, sendBundleEnquiry);
router.get("/status", verifyVendor, getVendorSubscriptionStatus)

export default router