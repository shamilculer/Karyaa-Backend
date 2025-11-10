import Vendor from "../../models/Vendor.model.js";

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

    res.status(200).json({
      success: true,
      data: {
        ...vendor.toObject(),
        allFeatures,
        subscriptionDuration,
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