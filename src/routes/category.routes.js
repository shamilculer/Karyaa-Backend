import {
  getCategories,
  getCategory
} from "../controllers/category.controller.js";
import express from "express";

const router = express.Router();

// Public route
router.get("/", getCategories);
router.get("/:identifier", getCategory);


export default router;
