import express from "express"
import { 
    registerVendor, 
    loginVendor, 
    getActiveVendors, 
    getSingleVendor,
    // --- NEW IMPORTS ---
    getVendorOptions, 
    getVendorsForComparison // Import the new controller functions
} from "../controllers/vendor.controller.js";

const router = express.Router();

// -------------------------------------------------------------------
// --- AUTH ROUTES ---
// -------------------------------------------------------------------
router.post('/auth/register', registerVendor);
router.post('/auth/login', loginVendor);


// -------------------------------------------------------------------
// --- COMPARISON ROUTES (NEW) ---
// -------------------------------------------------------------------

// GET /api/vendors/options - Fetches minimal data for the comparison combobox dropdowns
router.get('/options', getVendorOptions);

// GET /api/vendors/compare?slugs=... - Fetches detailed data for the comparison table
router.get('/compare', getVendorsForComparison);


// -------------------------------------------------------------------
// --- PUBLIC VENDOR DATA ROUTES ---
// -------------------------------------------------------------------
router.get('/active', getActiveVendors);
router.get('/:identifier', getSingleVendor);


export default router;