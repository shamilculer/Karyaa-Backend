import express from "express";
import { postReferral } from "../../controllers/user/referral.controller.js";

const router = express.Router();

router.post("/new", postReferral);

export default router