import User from "../../../models/User.model.js";
import Vendor from "../../../models/Vendor.model.js";
import Lead from "../../../models/Lead.model.js";
import Review from "../../../models/Review.model.js";
import Blog from "../../../models/Blog.model.js";
import Ticket from "../../../models/Ticket.model.js";
import Category from "../../../models/Category.model.js";

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

// Get overview statistics
export const getOverviewStats = async (req, res) => {
  // verifyAdmin middleware already checks authentication
  try {
    const { timeframe = "6M" } = req.query;
    const startDate = getDateRange(timeframe);
    const now = new Date();

    // Calculate previous period for comparison
    const periodLength = now - startDate;
    const previousStartDate = new Date(startDate.getTime() - periodLength);

    // Current period counts
    const [
      totalUsers,
      totalVendors,
      totalLeads,
      totalReviews,
      previousUsers,
      previousVendors,
      previousLeads,
      previousReviews,
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startDate, $lte: now } }),
      Vendor.countDocuments({
        vendorStatus: "approved",
        createdAt: { $gte: startDate, $lte: now },
      }),
      Lead.countDocuments({ createdAt: { $gte: startDate, $lte: now } }),
      Review.countDocuments({
        status: "Approved",
        createdAt: { $gte: startDate, $lte: now },
      }),
      // Previous period counts
      User.countDocuments({
        createdAt: { $gte: previousStartDate, $lt: startDate },
      }),
      Vendor.countDocuments({
        vendorStatus: "approved",
        createdAt: { $gte: previousStartDate, $lt: startDate },
      }),
      Lead.countDocuments({
        createdAt: { $gte: previousStartDate, $lt: startDate },
      }),
      Review.countDocuments({
        status: "Approved",
        createdAt: { $gte: previousStartDate, $lt: startDate },
      }),
    ]);

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return res.status(200).json({
      success: true,
      data: {
        totalUsers: {
          count: totalUsers,
          change: calculateChange(totalUsers, previousUsers),
        },
        totalVendors: {
          count: totalVendors,
          change: calculateChange(totalVendors, previousVendors),
        },
        totalLeads: {
          count: totalLeads,
          change: calculateChange(totalLeads, previousLeads),
        },
        totalReviews: {
          count: totalReviews,
          change: calculateChange(totalReviews, previousReviews),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching overview stats:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching overview statistics",
    });
  }
};

// Get user growth trends
export const getUserGrowth = async (req, res) => {
  try {
    const { timeframe = "6M" } = req.query;
    const startDate = getDateRange(timeframe);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            ...(timeframe === "24H"
              ? { day: { $dayOfMonth: "$createdAt" }, hour: { $hour: "$createdAt" } }
              : timeframe === "1W"
                ? { day: { $dayOfMonth: "$createdAt" } }
                : {}),
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 },
      },
    ]);

    // Fill in missing time periods with zero values
    let completeData = [];
    const now = new Date();

    if (timeframe === "24H") {
      // Generate all 24 hours
      for (let i = 0; i < 24; i++) {
        const hourData = userGrowth.find(item => item._id.hour === i);
        completeData.push({
          _id: {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            hour: i
          },
          count: hourData ? hourData.count : 0
        });
      }
    } else if (timeframe === "1W") {
      // Generate all 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayData = userGrowth.find(item =>
          item._id.year === date.getFullYear() &&
          item._id.month === date.getMonth() + 1 &&
          item._id.day === date.getDate()
        );
        completeData.push({
          _id: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
          },
          count: dayData ? dayData.count : 0
        });
      }
    } else {
      // For monthly data (1M, 3M, 6M, 1Y)
      const months = timeframe === "1M" ? 4 : timeframe === "3M" ? 12 : timeframe === "6M" ? 6 : 12;
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthData = userGrowth.find(item =>
          item._id.year === date.getFullYear() &&
          item._id.month === date.getMonth() + 1
        );
        completeData.push({
          _id: {
            year: date.getFullYear(),
            month: date.getMonth() + 1
          },
          count: monthData ? monthData.count : 0
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: completeData,
    });
  } catch (error) {
    console.error("Error fetching user growth:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching user growth data",
    });
  }
};

// Get vendor growth trends
export const getVendorGrowth = async (req, res) => {
  try {
    const { timeframe = "6M" } = req.query;
    const startDate = getDateRange(timeframe);
    const now = new Date();

    const vendorGrowth = await Vendor.aggregate([
      {
        $match: {
          vendorStatus: "approved",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            ...(timeframe === "24H"
              ? { day: { $dayOfMonth: "$createdAt" }, hour: { $hour: "$createdAt" } }
              : timeframe === "1W"
                ? { day: { $dayOfMonth: "$createdAt" } }
                : {}),
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 },
      },
    ]);

    // Fill in missing time periods with zero values
    let completeData = [];

    if (timeframe === "24H") {
      // Generate all 24 hours
      for (let i = 0; i < 24; i++) {
        const hourData = vendorGrowth.find(item => item._id.hour === i);
        completeData.push({
          _id: {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            hour: i
          },
          count: hourData ? hourData.count : 0
        });
      }
    } else if (timeframe === "1W") {
      // Generate all 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayData = vendorGrowth.find(item =>
          item._id.year === date.getFullYear() &&
          item._id.month === date.getMonth() + 1 &&
          item._id.day === date.getDate()
        );
        completeData.push({
          _id: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
          },
          count: dayData ? dayData.count : 0
        });
      }
    } else {
      // For monthly data (1M, 3M, 6M, 1Y)
      const months = timeframe === "1M" ? 4 : timeframe === "3M" ? 12 : timeframe === "6M" ? 6 : 12;
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthData = vendorGrowth.find(item =>
          item._id.year === date.getFullYear() &&
          item._id.month === date.getMonth() + 1
        );
        completeData.push({
          _id: {
            year: date.getFullYear(),
            month: date.getMonth() + 1
          },
          count: monthData ? monthData.count : 0
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: completeData,
    });
  } catch (error) {
    console.error("Error fetching vendor growth:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching vendor growth data",
    });
  }
};

// Get vendor distribution by category
export const getVendorDistribution = async (req, res) => {
  try {
    const { timeframe = "6M" } = req.query;
    const startDate = getDateRange(timeframe);

    const distribution = await Vendor.aggregate([
      {
        $match: {
          vendorStatus: "approved",
          createdAt: { $gte: startDate },
        },
      },
      {
        $unwind: "$mainCategory",
      },
      {
        $lookup: {
          from: "categories",
          localField: "mainCategory",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: "$categoryInfo",
      },
      {
        $group: {
          _id: "$categoryInfo.name",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error("Error fetching vendor distribution:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching vendor distribution",
    });
  }
};

// Get vendor status distribution
export const getVendorStatusDistribution = async (req, res) => {
  try {
    const { timeframe = "6M" } = req.query;
    const startDate = getDateRange(timeframe);

    const statusDistribution = await Vendor.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$vendorStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: statusDistribution,
    });
  } catch (error) {
    console.error("Error fetching vendor status distribution:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching vendor status distribution",
    });
  }
};

// Get lead metrics
export const getLeadMetrics = async (req, res) => {
  try {
    const { timeframe = "6M" } = req.query;
    const startDate = getDateRange(timeframe);

    // Lead trends over time
    const leadTrends = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            ...(timeframe === "24H"
              ? { day: { $dayOfMonth: "$createdAt" }, hour: { $hour: "$createdAt" } }
              : timeframe === "1W"
                ? { day: { $dayOfMonth: "$createdAt" } }
                : {}),
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 },
      },
    ]);

    // Fill in missing time periods with zero values for lead trends
    let completeLeadTrends = [];
    const now = new Date();

    if (timeframe === "24H") {
      // Generate all 24 hours
      for (let i = 0; i < 24; i++) {
        const hourData = leadTrends.find(item => item._id.hour === i);
        completeLeadTrends.push({
          _id: {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            hour: i
          },
          count: hourData ? hourData.count : 0
        });
      }
    } else if (timeframe === "1W") {
      // Generate all 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayData = leadTrends.find(item =>
          item._id.year === date.getFullYear() &&
          item._id.month === date.getMonth() + 1 &&
          item._id.day === date.getDate()
        );
        completeLeadTrends.push({
          _id: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
          },
          count: dayData ? dayData.count : 0
        });
      }
    } else {
      // For monthly data (1M, 3M, 6M, 1Y)
      const months = timeframe === "1M" ? 4 : timeframe === "3M" ? 12 : timeframe === "6M" ? 6 : 12;
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthData = leadTrends.find(item =>
          item._id.year === date.getFullYear() &&
          item._id.month === date.getMonth() + 1
        );
        completeLeadTrends.push({
          _id: {
            year: date.getFullYear(),
            month: date.getMonth() + 1
          },
          count: monthData ? monthData.count : 0
        });
      }
    }

    // Lead status breakdown
    const statusBreakdown = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Lead by event type
    const eventTypeBreakdown = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          eventType: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        trends: completeLeadTrends,
        statusBreakdown,
        eventTypeBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching lead metrics:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching lead metrics",
    });
  }
};

// Get engagement metrics
export const getEngagementMetrics = async (req, res) => {
  try {
    const { timeframe = "6M" } = req.query;
    const startDate = getDateRange(timeframe);

    const [leadsCount, reviewsCount, ticketsCount, blogViews] =
      await Promise.all([
        Lead.countDocuments({ createdAt: { $gte: startDate } }),
        Review.countDocuments({
          createdAt: { $gte: startDate },
        }),
        Ticket.countDocuments({ createdAt: { $gte: startDate } }),
        Blog.aggregate([
          {
            $match: {
              status: "published",
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: null,
              totalViews: { $sum: "$views" },
            },
          },
        ]),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        leads: leadsCount,
        reviews: reviewsCount,
        tickets: ticketsCount,
        blogViews: blogViews[0]?.totalViews || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching engagement metrics:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching engagement metrics",
    });
  }
};

// Get top performing vendors
export const getTopPerformingVendors = async (req, res) => {
  try {
    const { timeframe = "1M", limit = 5 } = req.query;
    const startDate = getDateRange(timeframe);

    // Aggregate vendor performance data
    const topVendors = await Vendor.aggregate([
      {
        $match: {
          vendorStatus: "approved",
          createdAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "leads",
          localField: "_id",
          foreignField: "vendor",
          as: "leads",
        },
      },
      {
        $addFields: {
          inquiries: { $size: "$leads" },
          // Assuming profileViews field exists in Vendor model
          views: { $ifNull: ["$profileViews", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          businessName: 1,
          mainCategory: 1,
          views: 1,
          inquiries: 1,
          businessLogo: 1,
        },
      },
      {
        $sort: { inquiries: -1 },
      },
      {
        $limit: parseInt(limit),
      },
      {
        $lookup: {
          from: "categories",
          localField: "mainCategory",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $project: {
          _id: 1,
          name: "$businessName",
          category: {
            $ifNull: [
              { $arrayElemAt: ["$categoryInfo.name", 0] },
              "Uncategorized"
            ]
          },
          businessLogo: 1,
          views: 1,
          inquiries: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: topVendors,
    });
  } catch (error) {
    console.error("Error fetching top performing vendors:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching top performing vendors",
    });
  }
};

// Get vendor status summary
export const getVendorStatusSummary = async (req, res) => {
  try {
    const [total, active, pending, rejected, expired] = await Promise.all([
      Vendor.countDocuments(),
      Vendor.countDocuments({ vendorStatus: "approved" }),
      Vendor.countDocuments({ vendorStatus: "pending" }),
      Vendor.countDocuments({ vendorStatus: "rejected" }),
      Vendor.countDocuments({ vendorStatus: "expired" }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        active,
        pending,
        rejected,
        expired,
      },
    });
  } catch (error) {
    console.error("Error fetching vendor status summary:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching vendor status summary",
    });
  }
};

// Get review statistics including top and least rated vendors
export const getReviewStats = async (req, res) => {
  try {
    // Get review counts
    const [totalReviews, pendingReviews, removalRequests] = await Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ status: "Pending" }),
      Review.countDocuments({ flaggedForRemoval: true }),
    ]);

    // Get top 3 rated vendors (highest average rating with at least 1 review)
    const topRatedVendors = await Vendor.aggregate([
      {
        $match: {
          vendorStatus: "approved",
          averageRating: { $exists: true, $ne: null, $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "vendor",
          as: "reviews",
        },
      },
      {
        $addFields: {
          reviewCount: { $size: "$reviews" },
        },
      },
      {
        $match: {
          reviewCount: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "mainCategory",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $project: {
          _id: 1,
          name: "$businessName",
          category: {
            $ifNull: [
              { $arrayElemAt: ["$categoryInfo.name", 0] },
              "Uncategorized",
            ],
          },
          rating: "$averageRating",
          count: "$reviewCount",
          contact: "$ownerName",
          phone: "$phoneNumber",
          email: "$email",
          businessLogo: 1,
        },
      },
      {
        $sort: { rating: -1, count: -1 },
      },
      {
        $limit: 3,
      },
    ]);

    // Get bottom 3 rated vendors (lowest average rating with at least 1 review)
    const leastRatedVendors = await Vendor.aggregate([
      {
        $match: {
          vendorStatus: "approved",
          averageRating: { $exists: true, $ne: null, $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "vendor",
          as: "reviews",
        },
      },
      {
        $addFields: {
          reviewCount: { $size: "$reviews" },
        },
      },
      {
        $match: {
          reviewCount: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "mainCategory",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $project: {
          _id: 1,
          name: "$businessName",
          category: {
            $ifNull: [
              { $arrayElemAt: ["$categoryInfo.name", 0] },
              "Uncategorized",
            ],
          },
          rating: "$averageRating",
          count: "$reviewCount",
          contact: "$ownerName",
          phone: "$phoneNumber",
          email: "$email",
          businessLogo: 1,
        },
      },
      {
        $sort: { rating: 1, count: -1 },
      },
      {
        $limit: 3,
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalReviews,
          pendingReviews,
          removalRequests,
        },
        topRatedVendors,
        leastRatedVendors,
      },
    });
  } catch (error) {
    console.error("Error fetching review stats:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching review statistics",
    });
  }
};


