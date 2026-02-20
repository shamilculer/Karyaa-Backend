import { 
    addGalleryItems,
    deleteGalleryItems,
    getAllGalleryItems,
    getVendorGalleryItems,
    updateVendorGalleryItem,
    reorderGalleryItems
} from "../../controllers/vendor/gallery.controller.js";
import express from "express";
import { verifyVendor } from "../../middleware/verifyVendor.js";

const router = express.Router();

router.get("/", getAllGalleryItems)
router.get("/:vendorId", getVendorGalleryItems);
router.post("/add", verifyVendor, addGalleryItems)
router.delete("/", verifyVendor, deleteGalleryItems);
router.put("/item/:itemId", verifyVendor, updateVendorGalleryItem);
router.patch("/reorder", verifyVendor, reorderGalleryItems);

export default router