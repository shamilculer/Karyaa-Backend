import express from "express";
import { createContactSubmission } from "../controllers/contact.controller.js";

const router = express.Router();

router.post("/new", createContactSubmission);

export default router;
