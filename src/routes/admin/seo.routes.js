import express from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import {
    getAllPageSEO,
    updatePageSEO,
    getPageSEOByIdentifier,
    getAllCategorySEO,
    updateCategorySEO,
    getAllSubCategorySEO,
    updateSubCategorySEO
} from "../../controllers/admin/seo.controller.js";

const router = express.Router();

// Static Pages
router.get("/static", verifyToken, getAllPageSEO); // Admin list
router.put("/static/:pageIdentifier", verifyToken, updatePageSEO); // Admin update
router.get("/static/public/:identifier", getPageSEOByIdentifier); // Public fetch (no token needed?) - keeping it here or separate public route. 
// Ideally public routes should be in public folder, but for now we can mount this here or reuse controller.
// Actually, let's keep public access open or minimal if used by layout.js server-side.

// Categories
router.get("/categories", verifyToken, getAllCategorySEO);
router.put("/categories/:id", verifyToken, updateCategorySEO);

// SubCategories
router.get("/subcategories", verifyToken, getAllSubCategorySEO);
router.put("/subcategories/:id", verifyToken, updateSubCategorySEO);

export default router;
