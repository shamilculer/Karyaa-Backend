import express from "express";
import {
  getPublishedBlogs,
  getBlogPost,
} from "../controllers/blog.controller.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Public routes
router.get("/published", getPublishedBlogs);
router.get("/:slugOrId", getBlogPost);


export default router;
