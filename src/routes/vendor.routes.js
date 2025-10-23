import express from "express"
import { 
    registerVendor, 
    loginVendor, 
    getActiveVendors, 
    getSingleVendor,
    getVendorOptions,
    getVendorsForComparison
} from "../controllers/vendor.controller.js";

const router = express.Router();

// -------------------------------------------------------------------
// --- AUTH ROUTES ---
// -------------------------------------------------------------------
router.post('/auth/register', registerVendor);
router.post('/auth/login', loginVendor);

// -------------------------------------------------------------------
// --- COMPARE VENDOR ROUTES (Must be BEFORE dynamic /:identifier) ---
// -------------------------------------------------------------------
router.get('/options', getVendorOptions); 
router.get('/compare', getVendorsForComparison);

// -------------------------------------------------------------------
// --- PUBLIC VENDOR DATA ROUTES ---
// -------------------------------------------------------------------
router.get('/active', getActiveVendors);

// IMPORTANT: This dynamic route MUST be LAST
// Otherwise it will catch /options and /compare as identifiers
router.get('/:identifier', getSingleVendor);

export default router;