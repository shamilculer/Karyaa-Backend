import User from "../../models/User.model.js";
import Category from "../../models/Category.model.js";
import mongoose from "mongoose";

// -----------------------------------------------------------------------------------
// @desc    Get all vendors saved by the logged-in user
// @route   GET /api/user/saved-vendors
// @access  Protected (User must be logged in)
// -----------------------------------------------------------------------------------
export const getSavedVendors = async (req, res) => {
    try {
        const userId = req.user.id;
        const { categories } = req.query;

        let matchStage = {};

        // If categories filter is provided, find category IDs
        if (categories) {
            const categoryArray = categories.split(',').map(cat => cat.trim());
            const categoryDocs = await Category.find({
                slug: { $in: categoryArray }
            }).select('_id');

            const categoryIds = categoryDocs.map(cat => cat._id);

            if (categoryIds.length > 0) {
                matchStage = {
                    mainCategory: { $in: categoryIds }
                };
            }
        }

        const result = await User.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: 'vendors', // MongoDB collection name
                    localField: 'savedVendors',
                    foreignField: '_id',
                    as: 'savedVendors',
                    pipeline: [
                        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
                        {
                            $lookup: {
                                from: 'galleryitems', // GalleryItem collection name
                                localField: '_id',
                                foreignField: 'vendor',
                                as: 'gallery',
                                pipeline: [
                                    { $sort: { orderIndex: 1, createdAt: -1 } }, // Sort by orderIndex, then by creation date
                                    {
                                        $project: {
                                            url: 1,
                                            isFeatured: 1,
                                            mediaType: 1,
                                            thumbnail: 1,
                                            orderIndex: 1,
                                            createdAt: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $project: {
                                businessName: 1,
                                slug: 1,
                                businessDescription: 1,
                                averageRating: 1,
                                pricingStartingFrom: 1,
                                isRecommended: 1,
                                'address.city': 1,
                                mainCategory: 1,
                                gallery: 1 // Include gallery items
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    savedVendors: 1
                }
            }
        ]);

        if (!result || result.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const savedVendors = result[0].savedVendors;

        res.status(200).json({
            status: "success",
            results: savedVendors.length,
            data: {
                savedVendors,
            },
        });
    } catch (error) {
        console.error("Error fetching saved vendors:", error);
        res.status(500).json({ message: "Failed to retrieve saved vendors." });
    }
};

// -----------------------------------------------------------------------------------
// @desc    Adds or removes a vendor ID from the user's savedVendors list.
// @route   PATCH /api/user/saved-vendors/toggle
// @access  Protected (User must be logged in)
// -----------------------------------------------------------------------------------
export const toggleSavedVendor = async (req, res) => {
    const { vendorId } = req.body;
    const userId = req.user.id;

    if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required." });
    }

    try {
        // 1. Check if the vendor is already saved
        const user = await User.findById(userId).select("savedVendors");
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const isSaved = user.savedVendors.includes(vendorId);

        let updateOperation, message, savedStatus;

        if (isSaved) {
            // 2. If it is saved, UN-SAVE it ($pull removes the ID)
            updateOperation = { $pull: { savedVendors: vendorId } };
            message = "Vendor removed from saved list.";
            savedStatus = false;
        } else {
            // 3. If it is NOT saved, SAVE it ($addToSet adds the ID only if it doesn't exist)
            updateOperation = { $addToSet: { savedVendors: vendorId } };
            message = "Vendor added to saved list.";
            savedStatus = true;
        }

        // 4. Execute the atomic update
        await User.findByIdAndUpdate(userId, updateOperation, { new: true });

        // 5. Send the response with the status and message
        res.status(200).json({
            success: true,
            message: message,
            saved: savedStatus,
        });
    } catch (error) {
        console.error("Error toggling saved vendor:", error);
        // This could capture validation errors (e.g., invalid vendorId format)
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid vendor ID format." });
        }
        res.status(500).json({ message: "Failed to update saved vendor list." });
    }
};
