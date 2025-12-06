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

    // fetch paginated results (url + orderIndex only)
    const items = await GalleryItem.find()
      .select("url orderIndex vendor")
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
