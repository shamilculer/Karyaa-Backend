import express from "express";
import {
  getIdeas,
  getIdeaCategories
} from "../../controllers/public/idea.controller.js"

const router = express.Router();

// Public routes
router.get("/", getIdeas);
router.get("/categories", getIdeaCategories);


export default router;
