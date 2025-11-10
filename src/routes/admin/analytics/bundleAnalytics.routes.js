import express from "express"
import { getBundleStats } from "../../../controllers/admin/analytics/bundleStats.controller.js"
import {verifyToken} from "../../../middleware/verifyToken.js"

const router = express.Router();

router.get("/bundle-overview", verifyToken, getBundleStats);

export default router
