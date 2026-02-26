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
router.get("/static/public/:identifier", getPageSEOByIdentifier); // Public fetch — MUST be before /:pageIdentifier to avoid Express shadowing
router.put("/static/:pageIdentifier", verifyToken, updatePageSEO); // Admin update

// Categories
router.get("/categories", verifyToken, getAllCategorySEO);
router.put("/categories/:id", verifyToken, updateCategorySEO);

// SubCategories
router.get("/subcategories", verifyToken, getAllSubCategorySEO);
router.put("/subcategories/:id", verifyToken, updateSubCategorySEO);

export default router;
