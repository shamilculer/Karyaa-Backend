import mongoose from "mongoose";
import GalleryItem from "../../models/GalleryItem.model.js";
import Vendor from "../../models/Vendor.model.js";

/**
 * @desc Get all gallery items for a single vendor (public + private views)
 * @route GET /api/v1/gallery/vendor/:vendorId
 * @access Public
 *
 * Optional query filters:
 *  - category=<id>
 *  - type=image|video
 *  - featured=true
 */
export const getVendorGalleryItems = async (req, res) => {
  try {
    const { vendorId } = req.params;

    // ✅ Validate Vendor ObjectId
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: "Invalid vendor ID." });
    }

    // Base query
    const query = { vendor: vendorId };

    if (req.query.featured === "true") {
      query.isFeatured = true;
    }

    const items = await GalleryItem.find(query)
      .sort({ orderIndex: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: items.length,
      items,
      message: "Gallery items fetched successfully.",
    });

  } catch (error) {
    console.error("Error fetching vendor gallery items:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching gallery items.",
    });
  }
};

export const getAllGalleryItems = async (req, res) => {
  try {
    // pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    // total count
    const totalItems = await GalleryItem.countDocuments();

    // fetch paginated results with media metadata
    const items = await GalleryItem.find()
      .select("url orderIndex vendor mediaType thumbnail")
      .populate({
        path: "vendor",
        select: "businessName businessLogo slug",
      })
      .sort({ orderIndex: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Gallery items fetched successfully.",
      items,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
        hasNextPage: page * limit < totalItems,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching gallery items:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching gallery items.",
    });
  }
};

/**
 * Add one or more gallery items for a vendor
 * Body:
 *  - vendorId (required)
 *  - items: [{ url, type?, category? }, ...]
 */
export const addGalleryItems = async (req, res) => {
  try {
    const { vendorId, items } = req.body;

    if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "vendorId and an array of items are required.",
      });
    }

    // Validate vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found." });
    }

    // Get current max orderIndex to append new items properly
    const lastItem = await GalleryItem.findOne({ vendor: vendorId })
      .sort({ orderIndex: -1 })
      .limit(1);

    let startIndex = lastItem ? lastItem.orderIndex + 1 : 0;

    // Prepare gallery item docs
    const newItems = items.map((it, idx) => ({
      vendor: vendorId,
      url: it.url,
      mediaType: it.mediaType || 'image',
      thumbnail: it.thumbnail || undefined,
      orderIndex: startIndex + idx,
    }));

    const inserted = await GalleryItem.insertMany(newItems);

    return res.status(201).json({
      message: "Gallery items added successfully.",
      count: inserted.length,
      items: inserted,
    });

  } catch (error) {
    console.error("Error adding gallery items:", error);
    return res.status(500).json({
      message: "Failed to add gallery items.",
      error: error.message,
    });
  }
};

export const deleteGalleryItems = async (req, res) => {
  try {
    const { ids } = req.body; // array of gallery item _ids

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    await GalleryItem.deleteMany({ _id: { $in: ids } });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete gallery items" });
  }
};

/**
 * Update a single gallery item for the authenticated vendor.
 * Route: PUT /api/v1/gallery/item/:itemId
 * Body: { url }
 */
export const updateVendorGalleryItem = async (req, res) => {
  try {
    const vendorId = req.user?.id;
    const { itemId } = req.params;
    const { url } = req.body || {};

    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ success: false, message: "Invalid gallery item ID." });
    }

    if (!url || typeof url !== "string") {
      return res.status(400).json({ success: false, message: "New url is required." });
    }

    const existing = await GalleryItem.findOne({ _id: itemId, vendor: vendorId });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Gallery item not found." });
    }

    const oldUrl = existing.url;
    existing.url = url;
    await existing.save();

    // Best-effort: delete old S3 object if URL changed
    if (oldUrl && oldUrl !== url) {
      try {
        const { deleteS3Object, getKeyFromUrl } = await import("../../utils/s3.js");
        const key = getKeyFromUrl(oldUrl);
        if (key) {
          await deleteS3Object(key);
        }
      } catch (s3Error) {
        console.error("Error deleting old gallery media from S3:", s3Error);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Gallery item updated successfully.",
      item: existing.toObject(),
    });
  } catch (error) {
    console.error("Error updating vendor gallery item:", error);
    return res.status(500).json({ success: false, message: "Server error while updating gallery item." });
  }
};

/**
 * Reorder gallery items for the authenticated vendor.
 * Route: PATCH /api/v1/gallery/reorder
 * Body: { orderedIds: string[] }  — full ordered list of item IDs
 */
export const reorderGalleryItems = async (req, res) => {
  try {
    const vendorId = req.user?.id;
    const { orderedIds } = req.body;

    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ success: false, message: "orderedIds array is required." });
    }

    // Validate all IDs are valid ObjectIds
    const invalid = orderedIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalid.length > 0) {
      return res.status(400).json({ success: false, message: "One or more invalid item IDs." });
    }

    // Bulk-write orderIndex updates — one DB round-trip
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, vendor: vendorId },
        update: { $set: { orderIndex: index } },
      },
    }));

    await GalleryItem.bulkWrite(bulkOps);

    return res.status(200).json({ success: true, message: "Gallery order updated." });
  } catch (error) {
    console.error("Error reordering gallery items:", error);
    return res.status(500).json({ success: false, message: "Server error while reordering gallery." });
  }
};
