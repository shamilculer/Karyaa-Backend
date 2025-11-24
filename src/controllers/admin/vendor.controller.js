import Vendor from "../../models/Vendor.model.js";
import GalleryItem from "../../models/GalleryItem.model.js";
import Package from "../../models/Package.model.js";
import Bundle from "../../models/Bundle.model.js";
import mongoose from "mongoose";

// Get all vendors with pagination and filters (for admin table)
export const getAllVendors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = "",
      vendorStatus = "",
      city = "",
      isInternational = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (page - 1) * limit;

    // Build match query for filters (non-search)
    const matchQuery = {};
    if (vendorStatus) matchQuery.vendorStatus = vendorStatus;
    if (city) matchQuery["address.city"] = city;
    if (isInternational !== "") matchQuery.isInternational = isInternational === "true";

    // If no search, use simple query
    if (!search || search.trim() === "") {
      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

      const vendors = await Vendor.find(matchQuery)
        .select(
          "businessName businessLogo ownerName ownerProfileImage email phoneNumber address.city address.country isInternational averageRating vendorStatus selectedBundle subscriptionStartDate subscriptionEndDate mainCategory createdAt"
        )
        .populate("selectedBundle", "name price")
        .populate("mainCategory", "name")
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip);

      const total = await Vendor.countDocuments(matchQuery);

      // Format response
      const formattedVendors = vendors.map((vendor) => ({
        _id: vendor._id,
        businessName: vendor.businessName,
        businessLogo: vendor.businessLogo,
        ownerName: vendor.ownerName,
        ownerProfileImage: vendor.ownerProfileImage,
        email: vendor.email,
        phoneNumber: vendor.phoneNumber,
        city: vendor.address?.city || "N/A",
        country: vendor.address?.country || "N/A",
        isInternational: vendor.isInternational,
        rating: vendor.averageRating || 0,
        vendorStatus: vendor.vendorStatus,
        bundleName: vendor.selectedBundle?.name || "N/A",
        bundlePrice: vendor.selectedBundle?.price || 0,
        mainCategories:
          vendor.mainCategory?.map((cat) => cat.name).join(", ") || "N/A",
        subscriptionStartDate: vendor.subscriptionStartDate,
        subscriptionEndDate: vendor.subscriptionEndDate,
        registeredAt: vendor.createdAt,
      }));

      return res.status(200).json({
        success: true,
        data: formattedVendors,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      });
    }

    // Use aggregation for search with category/subcategory names
    const searchRegex = new RegExp(search, "i");

    const aggregationPipeline = [
      // Match basic filters first
      { $match: matchQuery },

      // Lookup main categories
      {
        $lookup: {
          from: "categories",
          localField: "mainCategory",
          foreignField: "_id",
          as: "mainCategoryDocs",
        },
      },

      // Lookup subcategories
      {
        $lookup: {
          from: "subcategories",
          localField: "subCategories",
          foreignField: "_id",
          as: "subCategoryDocs",
        },
      },

      // Lookup bundle
      {
        $lookup: {
          from: "bundles",
          localField: "selectedBundle",
          foreignField: "_id",
          as: "bundleDocs",
        },
      },

      // Match search criteria
      {
        $match: {
          $or: [
            { businessName: searchRegex },
            { ownerName: searchRegex },
            { email: searchRegex },
            { "address.city": searchRegex },
            { "address.country": searchRegex },
            { "mainCategoryDocs.name": searchRegex },
            { "subCategoryDocs.name": searchRegex },
          ],
        },
      },

      // Add fields for sorting
      {
        $addFields: {
          mainCategoryNames: {
            $map: {
              input: "$mainCategoryDocs",
              as: "cat",
              in: "$$cat.name",
            },
          },
          bundleInfo: { $arrayElemAt: ["$bundleDocs", 0] },
        },
      },

      // Sort
      {
        $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
      },

      // Facet for pagination and total count
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
        },
      },
    ];

    const result = await Vendor.aggregate(aggregationPipeline);

    const total = result[0].metadata[0]?.total || 0;
    const vendors = result[0].data || [];

    // Format response
    const formattedVendors = vendors.map((vendor) => ({
      _id: vendor._id,
      businessName: vendor.businessName,
      businessLogo: vendor.businessLogo,
      ownerName: vendor.ownerName,
      ownerProfileImage: vendor.ownerProfileImage,
      email: vendor.email,
      phoneNumber: vendor.phoneNumber,
      city: vendor.address?.city || "N/A",
      country: vendor.address?.country || "N/A",
      isInternational: vendor.isInternational,
      rating: vendor.averageRating || 0,
      vendorStatus: vendor.vendorStatus,
      bundleName: vendor.bundleInfo?.name || "N/A",
      bundlePrice: vendor.bundleInfo?.price || 0,
      mainCategories: vendor.mainCategoryNames?.join(", ") || "N/A",
      subscriptionStartDate: vendor.subscriptionStartDate,
      subscriptionEndDate: vendor.subscriptionEndDate,
      registeredAt: vendor.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedVendors,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while fetching vendors",
    });
  }
};

// Get vendor by ID (detailed view)
export const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id)
      .populate("selectedBundle")
      .populate("mainCategory")
      .populate("subCategories");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Get all features (bundle + custom)
    const allFeatures = await vendor.getAllFeatures();
    
    // Get total subscription duration
    const subscriptionDuration = await vendor.getTotalSubscriptionDuration();

    const responseVendor = {
      ...vendor.toObject(),
      allFeatures,
      subscriptionDuration,
    }

    res.status(200).json({
      success: true,
      data: {
        ...responseVendor,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to calculate subscription end date
function calculateSubscriptionEndDate(startDate, duration, bonusPeriod = null) {
  const start = new Date(startDate);
  let endDate = new Date(start);

  // Add base duration
  switch (duration.unit) {
    case "days":
      endDate.setDate(endDate.getDate() + duration.value);
      break;
    case "months":
      endDate.setMonth(endDate.getMonth() + duration.value);
      break;
    case "years":
      endDate.setFullYear(endDate.getFullYear() + duration.value);
      break;
  }

  // Add bonus period if exists
  if (bonusPeriod && bonusPeriod.value) {
    switch (bonusPeriod.unit) {
      case "days":
        endDate.setDate(endDate.getDate() + bonusPeriod.value);
        break;
      case "months":
        endDate.setMonth(endDate.getMonth() + bonusPeriod.value);
        break;
      case "years":
        endDate.setFullYear(endDate.getFullYear() + bonusPeriod.value);
        break;
    }
  }

  return endDate;
}

// Update vendor status (approve/reject/pending/expired)
export const updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorStatus } = req.body;

    if (!["approved", "pending", "rejected", "expired"].includes(vendorStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved', 'pending', 'rejected', or 'expired'",
      });
    }

    const currentVendor = await Vendor.findById(id).populate("selectedBundle");

    if (!currentVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const updateFields = { vendorStatus };

    // If approving vendor, set subscription dates
    if (vendorStatus === "approved" && currentVendor.vendorStatus !== "approved") {
      const startDate = new Date();
      updateFields.subscriptionStartDate = startDate;

      // Calculate end date based on custom duration or bundle duration
      const duration = await currentVendor.getTotalSubscriptionDuration();
      
      if (duration) {
        const endDate = calculateSubscriptionEndDate(
          startDate,
          duration.base,
          duration.bonus
        );
        updateFields.subscriptionEndDate = endDate;
      }
    }

    // If setting to expired or rejected from approved, keep the dates but status changes
    // The model hooks will handle count decrements automatically

    const vendor = await Vendor.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate("selectedBundle")
      .populate("mainCategory")
      .populate("subCategories");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const allFeatures = await vendor.getAllFeatures();
    const subscriptionDuration = await vendor.getTotalSubscriptionDuration();

    res.status(200).json({
      success: true,
      data: {
        ...vendor.toObject(),
        allFeatures,
        subscriptionDuration,
      },
      message: `Vendor status updated to ${vendorStatus}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update vendor custom duration (admin override)
export const updateVendorDuration = async (req, res) => {
  try {
    const { id } = req.params;
    const { customDuration } = req.body;

    // Validate customDuration structure
    if (customDuration) {
      if (!customDuration.value || !customDuration.unit) {
        return res.status(400).json({
          success: false,
          message: "customDuration must include 'value' and 'unit'",
        });
      }

      if (!["days", "months", "years"].includes(customDuration.unit)) {
        return res.status(400).json({
          success: false,
          message: "unit must be 'days', 'months', or 'years'",
        });
      }

      // Validate bonusPeriod if provided
      if (customDuration.bonusPeriod) {
        if (!["days", "months", "years"].includes(customDuration.bonusPeriod.unit)) {
          return res.status(400).json({
            success: false,
            message: "bonusPeriod unit must be 'days', 'months', or 'years'",
          });
        }
      }
    }

    const vendor = await Vendor.findByIdAndUpdate(
      id,
      { customDuration },
      { new: true, runValidators: true }
    )
      .populate("selectedBundle")
      .populate("mainCategory")
      .populate("subCategories");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Recalculate subscription end date if vendor is approved
    if (vendor.vendorStatus === "approved" && vendor.subscriptionStartDate) {
      const duration = await vendor.getTotalSubscriptionDuration();
      
      if (duration) {
        const endDate = calculateSubscriptionEndDate(
          vendor.subscriptionStartDate,
          duration.base,
          duration.bonus
        );
        vendor.subscriptionEndDate = endDate;
        await vendor.save();
      }
    }

    const allFeatures = await vendor.getAllFeatures();
    const subscriptionDuration = await vendor.getTotalSubscriptionDuration();

    res.status(200).json({
      success: true,
      data: {
        ...vendor.toObject(),
        allFeatures,
        subscriptionDuration,
      },
      message: "Custom duration updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update vendor custom features
export const updateVendorFeatures = async (req, res) => {
  try {
    const { id } = req.params;
    const { customFeatures } = req.body;

    if (!Array.isArray(customFeatures)) {
      return res.status(400).json({
        success: false,
        message: "customFeatures must be an array of strings",
      });
    }

    const vendor = await Vendor.findByIdAndUpdate(
      id,
      { customFeatures },
      { new: true, runValidators: true }
    )
      .populate("selectedBundle")
      .populate("mainCategory")
      .populate("subCategories");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const allFeatures = await vendor.getAllFeatures();

    res.status(200).json({
      success: true,
      data: {
        ...vendor.toObject(),
        allFeatures,
        },
      message: "Custom features updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle recommended status
export const toggleRecommended = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id).populate("selectedBundle")
    .populate("mainCategory")
    .populate("subCategories");


    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    vendor.isRecommended = !vendor.isRecommended;
    await vendor.save();

    res.status(200).json({
      success: true,
      data: vendor,
      message: `Vendor ${
        vendor.isRecommended ? "added to" : "removed from"
      } recommended list`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVendorDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      // Document files
      tradeLicenseCopy,
      emiratesIdCopy,
      businessLicenseCopy,
      passportOrIdCopy,
      // Document numbers
      tradeLicenseNumber,
      personalEmiratesIdNumber,
    } = req.body;

    // Find the vendor first
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Build update object
    const updateFields = {};
    
    // Handle UAE vendor documents and numbers
    if (!vendor.isInternational) {
      // UAE document files
      if (tradeLicenseCopy !== undefined) {
        if (tradeLicenseCopy === "") {
          return res.status(400).json({
            success: false,
            message: "Trade License Copy cannot be empty for UAE vendors",
          });
        }
        updateFields.tradeLicenseCopy = tradeLicenseCopy;
      }
      
      if (emiratesIdCopy !== undefined) {
        if (emiratesIdCopy === "") {
          return res.status(400).json({
            success: false,
            message: "Emirates ID Copy cannot be empty for UAE vendors",
          });
        }
        updateFields.emiratesIdCopy = emiratesIdCopy;
      }

      // UAE document numbers
      if (tradeLicenseNumber !== undefined) {
        if (tradeLicenseNumber.trim() === "") {
          return res.status(400).json({
            success: false,
            message: "Trade License Number cannot be empty for UAE vendors",
          });
        }
        updateFields.tradeLicenseNumber = tradeLicenseNumber.trim();
      }

      if (personalEmiratesIdNumber !== undefined) {
        if (personalEmiratesIdNumber.trim() === "") {
          return res.status(400).json({
            success: false,
            message: "Emirates ID Number cannot be empty for UAE vendors",
          });
        }
        updateFields.personalEmiratesIdNumber = personalEmiratesIdNumber.trim();
      }

      // Reject international fields if provided
      if (businessLicenseCopy !== undefined || passportOrIdCopy !== undefined) {
        return res.status(400).json({
          success: false,
          message: "International documents cannot be updated for UAE vendors",
        });
      }
    } 
    // Handle International vendor documents
    else {
      // International document files
      if (businessLicenseCopy !== undefined) {
        if (businessLicenseCopy === "") {
          return res.status(400).json({
            success: false,
            message: "Business License Copy cannot be empty for international vendors",
          });
        }
        updateFields.businessLicenseCopy = businessLicenseCopy;
      }
      
      if (passportOrIdCopy !== undefined) {
        if (passportOrIdCopy === "") {
          return res.status(400).json({
            success: false,
            message: "Passport/ID Copy cannot be empty for international vendors",
          });
        }
        updateFields.passportOrIdCopy = passportOrIdCopy;
      }

      // Reject UAE fields if provided
      if (tradeLicenseCopy !== undefined || emiratesIdCopy !== undefined || 
          tradeLicenseNumber !== undefined || personalEmiratesIdNumber !== undefined) {
        return res.status(400).json({
          success: false,
          message: "UAE documents cannot be updated for international vendors",
        });
      }
    }

    // Check if there are any fields to update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No document fields provided for update",
      });
    }

    // Update the vendor
    const updatedVendor = await Vendor.findByIdAndUpdate(
      id,
      updateFields,
      { 
        new: true, 
        runValidators: true,
        select: "businessName email isInternational tradeLicenseNumber personalEmiratesIdNumber tradeLicenseCopy emiratesIdCopy businessLicenseCopy passportOrIdCopy"
      }
    );

    // Build response based on vendor type
    const responseData = {
      _id: updatedVendor._id,
      businessName: updatedVendor.businessName,
      email: updatedVendor.email,
      isInternational: updatedVendor.isInternational,
    };

    if (!updatedVendor.isInternational) {
      responseData.documents = {
        tradeLicenseNumber: updatedVendor.tradeLicenseNumber || null,
        personalEmiratesIdNumber: updatedVendor.personalEmiratesIdNumber || null,
        tradeLicenseCopy: updatedVendor.tradeLicenseCopy || null,
        emiratesIdCopy: updatedVendor.emiratesIdCopy || null,
      };
    } else {
      responseData.documents = {
        businessLicenseCopy: updatedVendor.businessLicenseCopy || null,
        passportOrIdCopy: updatedVendor.passportOrIdCopy || null,
      };
    }

    res.status(200).json({
      success: true,
      data: responseData,
      message: "Vendor documents updated successfully",
    });
  } catch (error) {
    console.error("Error updating vendor documents:", error);
    
    // Handle duplicate key error for trade license number
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This Trade License Number is already registered",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while updating vendor documents",
    });
  }
};

// Update vendor details (Admin)
export const updateVendorDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Prevent updating sensitive or restricted fields directly via this endpoint if needed
    // For now, we allow updating most fields as this is an admin endpoint
    delete updateData.password;
    delete updateData.referenceId;
    delete updateData.slug; // Usually slug shouldn't be changed manually, or if it is, we need to handle uniqueness

    const vendor = await Vendor.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("selectedBundle")
      .populate("mainCategory")
      .populate("subCategories");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({
      success: true,
      data: vendor,
      message: "Vendor details updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update vendor bundle (Admin)
export const updateVendorBundle = async (req, res) => {
  try {
    const { id } = req.params;
    const { bundleId, subscriptionStartDate, subscriptionEndDate } = req.body;

    if (!bundleId) {
      return res.status(400).json({
        success: false,
        message: "Bundle ID is required",
      });
    }

    const bundle = await Bundle.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: "Bundle not found",
      });
    }

    const updateFields = {
      selectedBundle: bundleId,
      customDuration: null // Reset custom duration to default (null) so it uses bundle duration
    };

    // Determine Start Date
    const startDate = subscriptionStartDate ? new Date(subscriptionStartDate) : new Date();
    updateFields.subscriptionStartDate = startDate;

    // Determine End Date
    if (subscriptionEndDate) {
      updateFields.subscriptionEndDate = new Date(subscriptionEndDate);
    } else {
        // Calculate end date based on new bundle duration
        const endDate = calculateSubscriptionEndDate(
            startDate,
            bundle.duration,
            bundle.bonusPeriod
        );
        updateFields.subscriptionEndDate = endDate;
    }

    const vendor = await Vendor.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    })
      .populate("selectedBundle")
      .populate("mainCategory")
      .populate("subCategories");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const allFeatures = await vendor.getAllFeatures();
    const subscriptionDuration = await vendor.getTotalSubscriptionDuration();

    res.status(200).json({
      success: true,
      data: {
        ...vendor.toObject(),
        allFeatures,
        subscriptionDuration,
      },
      message: "Vendor bundle updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Vendor Gallery
export const getVendorGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const galleryItems = await GalleryItem.find({ vendor: id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: galleryItems,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Vendor Gallery Item
export const deleteVendorGalleryItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    
    const item = await GalleryItem.findOneAndDelete({ _id: itemId, vendor: id });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Gallery item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Vendor Packages
export const getVendorPackages = async (req, res) => {
  try {
    const { id } = req.params;
    const packages = await Package.find({ vendor: id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: packages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Vendor Package
export const deleteVendorPackage = async (req, res) => {
  try {
    const { id, packageId } = req.params;

    const pkg = await Package.findOneAndDelete({ _id: packageId, vendor: id });

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Package deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add Vendor Gallery Item (Admin)
export const addVendorGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { url, isFeatured, orderIndex } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    // Validate vendor exists
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Get current max orderIndex if orderIndex not provided
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const lastItem = await GalleryItem.findOne({ vendor: id })
        .sort({ orderIndex: -1 })
        .limit(1);
      finalOrderIndex = lastItem ? lastItem.orderIndex + 1 : 0;
    }

    const newGalleryItem = await GalleryItem.create({
      vendor: id,
      url,
      isFeatured: isFeatured || false,
      orderIndex: finalOrderIndex,
    });

    res.status(201).json({
      success: true,
      data: newGalleryItem,
      message: "Gallery item added successfully",
    });
  } catch (error) {
    console.error("Error adding gallery item:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Vendor Gallery Item (Admin)
export const updateVendorGalleryItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { url, isFeatured, orderIndex } = req.body;

    const updateFields = {};
    if (url !== undefined) updateFields.url = url;
    if (isFeatured !== undefined) updateFields.isFeatured = isFeatured;
    if (orderIndex !== undefined) updateFields.orderIndex = orderIndex;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const galleryItem = await GalleryItem.findOneAndUpdate(
      { _id: itemId, vendor: id },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    res.status(200).json({
      success: true,
      data: galleryItem,
      message: "Gallery item updated successfully",
    });
  } catch (error) {
    console.error("Error updating gallery item:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add Vendor Package (Admin) - bypasses 9-package limit
export const addVendorPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      coverImage,
      name,
      subheading,
      description,
      priceStartingFrom,
      services,
      includes,
    } = req.body;

    // Validate required fields
    if (
      !coverImage ||
      !name ||
      !description ||
      !services?.length ||
      priceStartingFrom === undefined ||
      priceStartingFrom === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: coverImage, name, description, services[], priceStartingFrom",
      });
    }

    // Validate vendor exists
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Check for duplicate package name for this vendor
    const duplicate = await Package.findOne({
      vendor: id,
      name: name.trim(),
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "A package with this name already exists for this vendor",
      });
    }

    // Create package (admin can bypass the 9-package limit)
    const newPackage = await Package.create({
      vendor: id,
      coverImage,
      name: name.trim(),
      subheading,
      description,
      priceStartingFrom,
      services,
      includes: includes || [],
    });

    res.status(201).json({
      success: true,
      data: newPackage,
      message: "Package created successfully",
    });
  } catch (error) {
    console.error("Error adding package:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Vendor Package (Admin)
export const updateVendorPackage = async (req, res) => {
  try {
    const { id, packageId } = req.params;
    const {
      coverImage,
      name,
      subheading,
      description,
      priceStartingFrom,
      services,
      includes,
    } = req.body;

    // Find existing package
    const existingPackage = await Package.findOne({ _id: packageId, vendor: id });

    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    // Check for duplicate name if name is being changed
    if (name && name.trim() !== existingPackage.name) {
      const duplicate = await Package.findOne({
        vendor: id,
        name: name.trim(),
        _id: { $ne: packageId },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "A package with this name already exists for this vendor",
        });
      }
    }

    // Build update object
    const updateFields = {};
    if (coverImage !== undefined) updateFields.coverImage = coverImage;
    if (name !== undefined) updateFields.name = name.trim();
    if (subheading !== undefined) updateFields.subheading = subheading;
    if (description !== undefined) updateFields.description = description;
    if (priceStartingFrom !== undefined) updateFields.priceStartingFrom = priceStartingFrom;
    if (services !== undefined) updateFields.services = services;
    if (includes !== undefined) updateFields.includes = includes;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      packageId,
      updateFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedPackage,
      message: "Package updated successfully",
    });
  } catch (error) {
    console.error("Error updating package:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add vendor gallery items (Bulk - Admin)
export const addVendorGalleryItems = async (req, res) => {
  try {
    const { id } = req.params; // vendorId
    const { items } = req.body; // array of { url, type }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required",
      });
    }

    // Verify vendor exists
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Create gallery items
    const galleryItems = items.map(item => ({
      vendor: id,
      url: item.url,
      type: item.type || "image",
      isFeatured: item.isFeatured || false,
      orderIndex: item.orderIndex || 0,
    }));

    const createdItems = await GalleryItem.insertMany(galleryItems);

    res.status(201).json({
      success: true,
      data: createdItems,
      message: `${createdItems.length} gallery item(s) added successfully`,
    });
  } catch (error) {
    console.error("Error adding gallery items:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete vendor gallery items (Bulk - Admin)
export const deleteVendorGalleryItems = async (req, res) => {
  try {
    const { id } = req.params; // vendorId
    const { itemIds } = req.body; // array of gallery item IDs

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID",
      });
    }

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Item IDs array is required",
      });
    }

    // Verify vendor exists
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Delete gallery items that belong to this vendor
    const result = await GalleryItem.deleteMany({
      _id: { $in: itemIds },
      vendor: id,
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} gallery item(s) deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting gallery items:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ... (existing controller functions) ...

// ==================== ADMIN COMMENTS ====================

// Add admin comment
export const addAdminComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "Comment message is required" 
            });
        }

        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return res.status(404).json({ 
                success: false, 
                message: "Vendor not found" 
            });
        }

        vendor.adminComments.push({
            message: message.trim(),
            createdAt: new Date()
        });

        await vendor.save();

        res.status(200).json({
            success: true,
            message: "Comment added successfully",
            data: vendor.adminComments
        });
    } catch (error) {
        console.error("Error adding admin comment:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Delete admin comment
export const deleteAdminComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;

        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return res.status(404).json({ 
                success: false, 
                message: "Vendor not found" 
            });
        }

        const commentIndex = vendor.adminComments.findIndex(
            comment => comment._id.toString() === commentId
        );

        if (commentIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: "Comment not found" 
            });
        }

        vendor.adminComments.splice(commentIndex, 1);
        await vendor.save();

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully",
            data: vendor.adminComments
        });
    } catch (error) {
        console.error("Error deleting admin comment:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ==================== ADDITIONAL DOCUMENTS ====================

// Add additional document
export const addAdditionalDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { documentName, documentUrl } = req.body;

        if (!documentName || !documentName.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "Document name is required" 
            });
        }

        if (!documentUrl || !documentUrl.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "Document URL is required" 
            });
        }

        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return res.status(404).json({ 
                success: false, 
                message: "Vendor not found" 
            });
        }

        vendor.additionalDocuments.push({
            documentName: documentName.trim(),
            documentUrl: documentUrl.trim(),
            uploadedAt: new Date()
        });

        await vendor.save();

        res.status(200).json({
            success: true,
            message: "Document added successfully",
            data: vendor.additionalDocuments
        });
    } catch (error) {
        console.error("Error adding additional document:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Delete additional document
export const deleteAdditionalDocument = async (req, res) => {
    try {
        const { id, documentId } = req.params;

        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return res.status(404).json({ 
                success: false, 
                message: "Vendor not found" 
            });
        }

        const documentIndex = vendor.additionalDocuments.findIndex(
            doc => doc._id.toString() === documentId
        );

        if (documentIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: "Document not found" 
            });
        }

        vendor.additionalDocuments.splice(documentIndex, 1);
        await vendor.save();

        res.status(200).json({
            success: true,
            message: "Document deleted successfully",
            data: vendor.additionalDocuments
        });
    } catch (error) {
        console.error("Error deleting additional document:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};
