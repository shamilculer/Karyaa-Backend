import express from "express"
import { getBulkContent, getContentByKey } from "../../controllers/public/pages.controller.js";


const router = express.Router();

router.get("/:key", getContentByKey);
router.post("/bulk", getBulkContent);

export default router

