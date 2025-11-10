import express from "express";
import { getActiveBanners } from "../controllers/adBanner.controller.js";


const router = express.Router();

router.get("/", getActiveBanners);

export default router