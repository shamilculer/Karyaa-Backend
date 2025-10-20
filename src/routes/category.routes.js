import {
  getCategories,
  createCategory,
  editCategory,
  deleteCategory,
  getCategory
} from "../controllers/category.controller.js";
import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Public route
router.get("/", getCategories);
router.get("/:identifier", getCategory);

// Admin-only routes
router.post("/create", verifyToken, createCategory);
router.put("/edit/:id", verifyToken, editCategory);
router.delete("/delete/:id", verifyToken, deleteCategory);

export default router;
