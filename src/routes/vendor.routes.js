import express from "express";
import {
    registerVendor,
    loginVendor,
    getSingleVendor,
    getVendorOptions,
    getVendorsForComparison,
    getVendorReviewStats,
    getVendorCities,
    getApprovedVendors,
    updateVendor,
    getVendorProfileForEdit,
    updateVendorPassword,
} from "../controllers/vendor.controller.js";
import { verifyVendor } from "../middleware/verifyVendor.js"
import {
    requestVendorPasswordReset,
    resetVendorPassword
} from "../controllers/vendor/passwordReset.controller.js";

const router = express.Router();

// -------------------------------------------------------------------
// --- AUTH ROUTES ---
// -------------------------------------------------------------------
// Auth Routes
router.post('/auth/register', registerVendor);
router.post('/auth/login', loginVendor);
router.post('/auth/forgot-password', requestVendorPasswordReset);
router.post('/auth/reset-password', resetVendorPassword);


// -------------------------------------------------------------------
// --- COMPARE VENDOR ROUTES (Must be BEFORE dynamic /:identifier) ---
// -------------------------------------------------------------------
router.get('/options', getVendorOptions);
router.get('/compare', getVendorsForComparison);

router.get("/profile", verifyVendor, getVendorProfileForEdit)
router.put("/password/update", verifyVendor, updateVendorPassword)
router.put("/:vendorId", verifyVendor, updateVendor)

// -------------------------------------------------------------------
// --- PUBLIC VENDOR DATA ROUTES ---
// -------------------------------------------------------------------
router.get('/active', getApprovedVendors);
router.get('/review-stats/:vendorId', getVendorReviewStats);

// IMPORTANT: This dynamic route MUST be LAST
// Otherwise it will catch /options and /compare as identifiers
router.get('/:identifier', getSingleVendor);

router.get("/cities", getVendorCities)

export default router;
