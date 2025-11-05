import Vendor from "../../models/Vendor.model.js";
import Bundle from "../../models/Bundle.model.js";

// Get all vendors with pagination and filters (for admin table)
export const getAllVendors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = "",
      vendorStatus = "",
      subscriptionStatus = "",
      city = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (page - 1) * limit;

    // Build match query for filters (non-search)
    const matchQuery = {};
    if (vendorStatus) matchQuery.vendorStatus = vendorStatus;
    if (subscriptionStatus) matchQuery.subscriptionStatus = subscriptionStatus;
    if (city) matchQuery["address.city"] = city;

    // If no search, use simple query
    if (!search || search.trim() === "") {
      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

      const vendors = await Vendor.find(matchQuery)
        .select(
          "businessName businessLogo ownerName ownerProfileImage email phoneNumber address.city averageRating vendorStatus subscriptionStatus selectedBundle subscriptionStartDate subscriptionEndDate mainCategory createdAt"
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
        rating: vendor.averageRating || 0,
        vendorStatus: vendor.vendorStatus,
        subscriptionStatus: vendor.subscriptionStatus,
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
      rating: vendor.averageRating || 0,
      vendorStatus: vendor.vendorStatus,
      subscriptionStatus: vendor.subscriptionStatus,
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

    res.status(200).json({
      success: true,
      data: {
        ...vendor.toObject(),
        allFeatures,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update vendor status (approve/reject/pending)
export const updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorStatus } = req.body;

    if (!["approved", "pending", "rejected"].includes(vendorStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved', 'pending', or 'rejected'",
      });
    } // 1. Determine the corresponding subscription status update

    const updateFields = { vendorStatus };
    let newSubscriptionStatus = null;

    if (vendorStatus === "approved") {
      // Setting vendor to approved, so set subscription to active
      newSubscriptionStatus = "active";
    } else if (vendorStatus === "pending") {
      // Setting vendor to pending, so set subscription to pending (if not expired)
      newSubscriptionStatus = "pending";
    } // 2. Fetch the current vendor to check existing subscriptionStatus

    const currentVendor = await Vendor.findById(id, "subscriptionStatus");

    if (!currentVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Only update the subscription status if a new status was determined
    // AND the current status is NOT 'expired' (since expired status should
    // typically require a separate action to change).
    if (
      newSubscriptionStatus &&
      currentVendor.subscriptionStatus !== "expired"
    ) {
      updateFields.subscriptionStatus = newSubscriptionStatus;
    } // 3. Perform the update

    const vendor = await Vendor.findByIdAndUpdate(
      id,
      updateFields, // Use the dynamically created object
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
        allFeatures
      },
      message: `Vendor status updated to ${vendorStatus}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Activate vendor subscription
export const activateVendorSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { customDuration } = req.body; // Optional: override bundle duration

    const vendor = await Vendor.findById(id).populate("selectedBundle");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (!vendor.selectedBundle) {
      return res.status(400).json({
        success: false,
        message: "Vendor has no bundle selected",
      });
    }

    const bundle = vendor.selectedBundle;
    const startDate = new Date();
    let endDate = new Date(startDate);

    // Calculate end date based on bundle duration or custom
    const duration = customDuration || bundle.duration;
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

    vendor.subscriptionStatus = "active";
    vendor.subscriptionStartDate = startDate;
    vendor.subscriptionEndDate = endDate;

    // Auto-set recommended if bundle includes it
    if (bundle.includesRecommended) {
      vendor.isRecommended = true;
    }

    // Update bundle subscribers count
    await Bundle.findByIdAndUpdate(bundle._id, {
      $inc: { subscribersCount: 1 },
    });

    await vendor.save();

    res.status(200).json({
      success: true,
      data: vendor,
      message: `Subscription activated until ${endDate.toLocaleDateString()}`,
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
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({
      success: true,
      data: vendor,
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

    const vendor = await Vendor.findById(id);

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
