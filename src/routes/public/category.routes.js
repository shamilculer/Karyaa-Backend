import {
  getCategories,
  getCategory,
  getCategoriesWithVendors
} from "../../controllers/public/category.controller.js";
import express from "express";

const router = express.Router();

// Public routes
router.get("/", getCategories);
router.get("/with-vendors", getCategoriesWithVendors); // Must be before /:identifier
router.get("/:identifier", getCategory);

export default router;
