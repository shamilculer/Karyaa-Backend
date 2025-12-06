import express from "express";
import { createPackage, deletePackage, getVendorPackages, updatePackage } from "../../controllers/vendor/packages.controller.js";
import { verifyVendor } from "../../middleware/verifyVendor.js";

const router = express.Router();

router.post("/new", verifyVendor, createPackage);
router.get("/:vendorId", getVendorPackages);
router.put("/update", verifyVendor, updatePackage);
router.delete("/delete", verifyVendor, deletePackage)

export default router