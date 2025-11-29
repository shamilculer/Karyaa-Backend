import express from "express";
import { getBrandDetails } from "../../controllers/shared/brandDetails.controller.js";

const router = express.Router();

router.get("/", getBrandDetails);

export default router

