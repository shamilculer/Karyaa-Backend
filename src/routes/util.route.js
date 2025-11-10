import express from "express";
import {
    getCurrentAdminData,
    refreshAccessToken
} from "../controllers/utils.controller.js"

const router = express.Router();

router.post('/refresh-token', refreshAccessToken);
router.get("/admin/:adminId/me", getCurrentAdminData)


export default router;