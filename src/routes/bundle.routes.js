import express from "express"
import { getBundlesForRegistration } from "../controllers/bundle.controller.js"

const router = express.Router()

router.get("/registration-options", getBundlesForRegistration);

export default router


