import AdBanner from "../../models/AdBanner.model.js";
import Vendor from "../../models/Vendor.model.js";
import mongoose from "mongoose";

// --- Helper function for consistent response formatting ---
const sendSuccess = (res, data, message, status = 200) => {
    res.status(status).json({ success: true, message, data });
};

const sendError = (res, error, status = 500) => {
    // Check if the error is a Mongoose validation error from the pre-save hook
    const errorMessage = error.message.includes('required for') ? error.message : "An unexpected error occurred.";
    res.status(status).json({ success: false, message: errorMessage });
};
// ---------------------------------------------------------------------------------

/**
 * @route POST /api/admin/banners
 * @desc Create a new Ad Banner
 * @access Private (Admin)
 */
export const createBanner = async (req, res) => {
    try {
        const {
            name,
            imageUrl,
            placement,
            isVendorSpecific,
            vendor,
            customUrl,
            status,
            // New fields
            title,
            tagline,
            mobileImageUrl,
            activeFrom,
            activeUntil,
            mediaType,
            videoUrl,
            showTitle,
            displayMode,
            showOverlay
        } = req.body;

        if (!name || !placement || placement.length === 0) {
            return sendError(res, { message: "Name and placement are required." }, 400);
        }

        if (isVendorSpecific) {
            if (!vendor) {
                return sendError(res, { message: "Vendor required." }, 400);
            }
            if (!mongoose.Types.ObjectId.isValid(vendor)) {
                return sendError(res, { message: "Invalid Vendor ID." }, 400);
            }
            const existing = await Vendor.findById(vendor);
            if (!existing) {
                return sendError(res, { message: "Vendor not found." }, 404);
            }
        } else {
            if (!customUrl) {
                return sendError(res, { message: "Custom URL required." }, 400);
            }
        }

        const banner = new AdBanner({
            name,
            imageUrl, // Model will validate this if mediaType is image
            placement,
            isVendorSpecific,
            vendor: isVendorSpecific ? vendor : null,
            customUrl: !isVendorSpecific ? customUrl : null,
            status: status || "Active",
            title,
            tagline,
            mobileImageUrl,
            activeFrom,
            activeUntil,
            mediaType: mediaType || 'image',
            videoUrl,
            showTitle: showTitle ?? true,
            displayMode: displayMode || 'standard',
            showOverlay: showOverlay ?? true
        });

        const saved = await banner.save();
        sendSuccess(res, saved, "Ad Banner created!", 201);

    } catch (error) {
        sendError(res, error, 400);
    }
};

// ---------------------------------------------------------------------------------

/**
 * @route PUT /api/admin/banners/:id
 * @desc Update an existing Ad Banner
 * @access Private (Admin)
 */
export const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, { message: 'Invalid Banner ID format.' }, 400);
        }

        if (updates.isVendorSpecific === true && updates.vendor) {
            if (!mongoose.Types.ObjectId.isValid(updates.vendor)) {
                return sendError(res, { message: 'Invalid Vendor ID format.' }, 400);
            }
            const existingVendor = await Vendor.findById(updates.vendor);
            if (!existingVendor) {
                return sendError(res, { message: 'Specified Vendor not found.' }, 404);
            }
        }

        if (updates.isVendorSpecific === true) {
            updates.customUrl = null;
        } else if (updates.isVendorSpecific === false) {
            updates.vendor = null;
        }

        // 3. Update with validation
        const updatedBanner = await AdBanner.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true } // runValidators ensures the pre-save hook runs
        );

        if (!updatedBanner) {
            return sendError(res, { message: 'Ad Banner not found.' }, 404);
        }

        sendSuccess(res, updatedBanner, 'Ad Banner updated successfully!');
    } catch (error) {
        sendError(res, error, 400); // 400 for validation errors
    }
};

// ---------------------------------------------------------------------------------

/**
 * @route PUT /api/admin/banners/:id/toggle-status
 * @desc Toggle the status (Active/Inactive) of an Ad Banner
 * @access Private (Admin)
 */
export const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, { message: 'Invalid Banner ID format.' }, 400);
        }

        const banner = await AdBanner.findById(id);

        if (!banner) {
            return sendError(res, { message: 'Ad Banner not found.' }, 404);
        }

        // Toggle the status
        const newStatus = banner.status === 'Active' ? 'Inactive' : 'Active';
        banner.status = newStatus;

        await banner.save();

        sendSuccess(res, banner, `Ad Banner status set to ${newStatus}.`);
    } catch (error) {
        sendError(res, error);
    }
};

// ---------------------------------------------------------------------------------

/**
 * @route DELETE /api/admin/banners/:id
 * @desc Delete an Ad Banner
 * @access Private (Admin)
 */
export const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, { message: 'Invalid Banner ID format.' }, 400);
        }

        const deletedBanner = await AdBanner.findByIdAndDelete(id);

        if (!deletedBanner) {
            return sendError(res, { message: 'Ad Banner not found.' }, 404);
        }

        sendSuccess(res, null, 'Ad Banner deleted successfully!');
    } catch (error) {
        sendError(res, error);
    }
};

// ---------------------------------------------------------------------------------

/**
 * @route GET /api/admin/banners
 * @desc Get all Ad Banners with filtering, searching, and pagination
 * @access Private (Admin)
 */
export const getAllBanners = async (req, res) => {
    try {
        const {
            search,
            status,
            placement,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};

        // 1. Search Query (by name)
        if (search) {
            query.name = { $regex: new RegExp(search, 'i') };
        }

        // 2. Status Filter
        if (status && ['Active', 'Inactive'].includes(status)) {
            query.status = status;
        }

        // 3. Placement Filter (handles array in model)
        if (placement) {
            const placements = Array.isArray(placement)
                ? placement
                : placement.split(',').map(p => p.trim());

            query.placement = { $in: placements };
        }

        // 4. Sorting
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // 5. Fetch all banners matching the query (NO LIMIT/SKIP)
        const banners = await AdBanner.find(query)
            // Removed .limit() and .skip()
            .sort(sort)
            .populate('vendor', 'businessLogo businessName'); // Only populate the vendor's name

        // Send back the full list directly
        sendSuccess(res, {
            data: banners,
            // Removed pagination block
        }, 'Ad Banners fetched successfully.');
    } catch (error) {
        sendError(res, error);
    }
};