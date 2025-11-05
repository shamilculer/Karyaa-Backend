import { 
    addGalleryItems,
    deleteGalleryItems,
    getVendorGalleryItems
} from "../controllers/gallery.controller.js";
import express from "express";
import { verifyVendor } from "../middleware/verifyVendor.js";

const router = express.Router();

router.get("/:vendorId", getVendorGalleryItems);
router.post("/add", verifyVendor, addGalleryItems)
router.delete("/", verifyVendor, deleteGalleryItems);

export default router