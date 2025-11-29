import express from "express";
import {
    getCurrentAdminData,
    getCurrentUserData,
    getCurrentVendorData,
    refreshAccessToken
} from "../../controllers/shared/utils.controller.js";

const router = express.Router();

router.post('/refresh-token', refreshAccessToken);
router.get("/admin/:adminId/me", getCurrentAdminData);
router.get("/user/:userId/me", getCurrentUserData);
router.get("/vendor/:vendorId/me", getCurrentVendorData);

export default router;