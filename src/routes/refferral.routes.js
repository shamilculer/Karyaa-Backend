import express from "express";
import { postReferral } from "../controllers/referral.controller.js";

const router = express.Router();

router.post("/new", postReferral);

export default router