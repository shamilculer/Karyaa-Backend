import express from "express"
import { registerVendor, loginVendor, getActiveVendors, getSingleVendor } from "../controllers/vendor.auth.controller.js";

const router = express.Router();

router.post('/auth/register', registerVendor);
router.post('/auth/login', loginVendor);
router.get('/active', getActiveVendors);
router.get('/:identifier', getSingleVendor);

export default router