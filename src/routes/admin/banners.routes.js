import express from "express";
import { getActiveBanners } from "../../controllers/admin/banners.controller.js";

const router = express.Router();

router.get("/", getActiveBanners);

export default router