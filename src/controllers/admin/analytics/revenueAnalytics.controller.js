import Vendor from "../../../models/Vendor.model.js";
import Bundle from "../../../models/Bundle.model.js";

// Helper function to get date range based on timeframe
const getDateRange = (timeframe) => {
  const now = new Date();
  const ranges = {
    "24H": new Date(now.getTime() - 24 * 60 * 60 * 1000),
    "1W": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    "1M": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    "3M": new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    "6M": new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
    "1Y": new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
  };
  return ranges[timeframe] || ranges["6M"];
};

// Get total revenue and overview stats
export const getTotalRevenue = async (req, res) => {
  try {
    const { timeframe = "6M" } = req.query;
    const startDate = getDateRange(timeframe);
    const now = new Date();

    // Calculate previous period for comparison
    const periodLength = now - startDate;
    const previousStartDate = new Date(startDate.getTime() - periodLength);

    // Get all active bundles
    const bundles = await Bundle.find({ status: "active" });

    // Calculate total revenue (price × subscribersCount for each bundle)
    const totalRevenue = bundles.reduce((sum, bundle) => {
      return sum + (bundle.price * bundle.subscribersCount);
    }, 0);

    // Get active subscriptions (approved vendors with active subscriptions)
    const activeSubscriptions = await Vendor.countDocuments({
      vendorStatus: "approved",
      subscriptionEndDate: { $gte: now },
    });

    // Get new subscriptions in current period
    const newSubscriptions = await Vendor.countDocuments({
      vendorStatus: "approved",
      subscriptionStartDate: { $gte: startDate, $lte: now },
    });

    // Get new subscriptions in previous period
    const previousNewSubscriptions = await Vendor.countDocuments({
      vendorStatus: "approved",
      subscriptionStartDate: { $gte: previousStartDate, $lt: startDate },
    });

    // Calculate ARPU (Average Revenue Per User)
    const arpu = activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;

    // Calculate growth percentage
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue: {
          value: totalRevenue,
          change: calculateChange(newSubscriptions, previousNewSubscriptions),
        },
        activeSubscriptions: {
          value: activeSubscriptions,
          change: calculateChange(newSubscriptions, previousNewSubscriptions),
        },
        newSubscriptions: {
          value: newSubscriptions,
          change: calculateChange(newSubscriptions, previousNewSubscriptions),
        },
        arpu: {
          value: arpu,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching total revenue:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching total revenue",
    });
  }
};

// Get revenue breakdown by bundle
export const getRevenueByBundle = async (req, res) => {
  try {
    const { timeframe = "6M" } = req.query;

    // Get all active bundles with their subscriber counts
    const bundles = await Bundle.find({ status: "active" }).select(
      "name price subscribersCount"
    );

    // Calculate revenue for each bundle
    const revenueByBundle = bundles.map((bundle) => ({
      bundleName: bundle.name,
      revenue: bundle.price * bundle.subscribersCount,
      subscribers: bundle.subscribersCount,
      price: bundle.price,
    }));

    // Sort by revenue descending
    revenueByBundle.sort((a, b) => b.revenue - a.revenue);

    return res.status(200).json({
      success: true,
      data: revenueByBundle,
    });
  } catch (error) {
    console.error("Error fetching revenue by bundle:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching revenue by bundle",
    });
  }
};

// Get revenue over time (monthly trends)
export const getRevenueOverTime = async (req, res) => {
  try {
    const { timeframe = "6M" } = req.query;
    const startDate = getDateRange(timeframe);

    // Get vendors with their subscription dates and bundles
    const vendors = await Vendor.aggregate([
      {
        $match: {
          vendorStatus: "approved",
          subscriptionStartDate: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "bundles",
          localField: "selectedBundle",
          foreignField: "_id",
          as: "bundleInfo",
        },
      },
      {
        $unwind: "$bundleInfo",
      },
      {
        $group: {
          _id: {
            year: { $year: "$subscriptionStartDate" },
            month: { $month: "$subscriptionStartDate" },
            ...(timeframe === "24H" || timeframe === "1W"
              ? { day: { $dayOfMonth: "$subscriptionStartDate" } }
              : {}),
          },
          revenue: { $sum: "$bundleInfo.price" },
          subscriptions: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    console.error("Error fetching revenue over time:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching revenue over time",
    });
  }
};

// Get bundle performance metrics
export const getBundlePerformance = async (req, res) => {
  try {
    const bundles = await Bundle.find({ status: "active" }).select(
      "name subscribersCount price maxVendors"
    );

    const performance = bundles.map((bundle) => ({
      name: bundle.name,
      subscribers: bundle.subscribersCount,
      revenue: bundle.price * bundle.subscribersCount,
      price: bundle.price,
      capacity: bundle.maxVendors,
      utilizationRate: bundle.maxVendors
        ? (bundle.subscribersCount / bundle.maxVendors) * 100
        : null,
    }));

    // Sort by subscribers descending
    performance.sort((a, b) => b.subscribers - a.subscribers);

    return res.status(200).json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error("Error fetching bundle performance:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching bundle performance",
    });
  }
};

// Get subscription metrics (active, expired, expiring soon)
export const getSubscriptionMetrics = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [activeCount, expiredCount, expiringSoonCount, totalCount] =
      await Promise.all([
        Vendor.countDocuments({
          vendorStatus: "approved",
          subscriptionEndDate: { $gte: now },
        }),
        Vendor.countDocuments({
          vendorStatus: "expired",
        }),
        Vendor.countDocuments({
          vendorStatus: "approved",
          subscriptionEndDate: { $gte: now, $lte: thirtyDaysFromNow },
        }),
        Vendor.countDocuments({
          vendorStatus: { $in: ["approved", "expired"] },
        }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        active: activeCount,
        expired: expiredCount,
        expiringSoon: expiringSoonCount,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription metrics:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching subscription metrics",
    });
  }
};
