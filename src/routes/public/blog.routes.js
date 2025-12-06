import express from "express";
import {
  getPublishedBlogs,
  getBlogPost,
} from "../../controllers/public/blog.controller.js"

const router = express.Router();

// Public routes
router.get("/published", getPublishedBlogs);
router.get("/:slugOrId", getBlogPost);

export default router;
