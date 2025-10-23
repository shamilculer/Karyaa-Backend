import express from "express";
import { 
    postLead
} from "../controllers/lead.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Route to handle lead submission
router.post("/new", verifyToken, postLead);

export default router;