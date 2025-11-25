import Vendor from "../../../models/Vendor.model.js";
import Bundle from "../../../models/Bundle.model.js";

export const getBundleStats = async (req, res) => {
  // verifyAdmin middleware already checks role, so we can remove this check
  try {
    const totalActiveBundles = await Bundle.countDocuments({
      status: "active",
    });

    const mostPopularBundle = await Bundle.findOne({ status: "active" })
      .sort({ subscribersCount: -1 })
      .select("name subscribersCount");

    const totalActiveVendors = await Vendor.countDocuments({
        vendorStatus: "approved",
    });

    return res.status(200).json({
      success: true,
      data: {
        totalActiveBundles,
        mostPopularBundle: mostPopularBundle
          ? {
              name: mostPopularBundle.name,
              subscribers: mostPopularBundle.subscribersCount,
            }
          : null,
        totalActiveVendors,
      },
      message: "Bundle statistics fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching bundle stats:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred while fetching bundle stats",
    });
  }
};
