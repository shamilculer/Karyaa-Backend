import express from "express";
import {
  getAllIdeas,
  getPublishedIdeas,
  getIdeaPost,
  postIdea,
  editIdea,
  deleteIdea,
} from "../controllers/idea.controller.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Public routes
router.get("/published", getPublishedIdeas);
router.get("/:slugOrId", getIdeaPost);

// Admin routes
router.get("/all", verifyToken, getAllIdeas);
router.post("/create", verifyToken, postIdea);
router.put("/edit/:id", verifyToken, editIdea);
router.delete("/delete/:id", verifyToken, deleteIdea);

export default router;
