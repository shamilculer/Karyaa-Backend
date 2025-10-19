import express from "express";
import {
  getAllBlogs,
  getPublishedBlogs,
  getBlogPost,
  postBlog,
  editBlog,
  deleteBlog,
} from "../controllers/blog.controller.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Public routes
router.get("/published", getPublishedBlogs);
router.get("/:slugOrId", getBlogPost);

// Admin routes
router.get("/all", verifyToken, getAllBlogs);
router.post("/create", verifyToken, postBlog);
router.put("/edit/:id", verifyToken, editBlog);
router.delete("/delete/:id", verifyToken, deleteBlog);

export default router;
