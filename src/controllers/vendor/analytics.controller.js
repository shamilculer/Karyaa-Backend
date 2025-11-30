import Lead from "../../models/Lead.model.js";
import ProfileView from "../../models/ProfileView.model.js";
import Review from "../../models/Review.model.js";
import Vendor from "../../models/Vendor.model.js";
import mongoose from "mongoose";

/**
 * Helper function to get date range based on timeframe
 */
const getDateRange = (timeframe) => {
    const now = new Date();
    let startDate;

    switch (timeframe) {
        case "24H":
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case "1W":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case "1M":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case "3M":
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case "6M":
            startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            break;
        case "1Y":
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // Default 6 months
    }

    return { startDate, endDate: now };
};

/**
 * Helper function to get date format based on timeframe
 */
const getDateFormat = (timeframe) => {
    switch (timeframe) {
        case "24H":
            return "%Y-%m-%d %H:00"; // Group by hour
        case "1W":
        case "1M":
            return "%Y-%m-%d"; // Group by day
        case "3M":
        case "6M":
        case "1Y":
            return "%Y-%U"; // Group by week
        default:
            return "%Y-%m-%d";
    }
};

/**
 * @desc Get enquiries over time
 * @route GET /api/v1/leads/vendor/analytics/enquiries-over-time
 * @access Private (Vendor)
 */
export const getEnquiriesOverTime = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { timeframe = "6M" } = req.query;

        const { startDate } = getDateRange(timeframe);
        const dateFormat = getDateFormat(timeframe);

        const data = await Lead.aggregate([
            {
                $match: {
                    vendor: new mongoose.Types.ObjectId(vendorId),
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Format the response
        const formattedData = data.map((item) => ({
            period: item._id,
            enquiries: item.count,
        }));

        res.status(200).json({
            success: true,
            data: formattedData,
            timeframe,
        });
    } catch (error) {
        console.error("Error fetching enquiries over time:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch enquiries data.",
        });
    }
};

/**
 * @desc Get lead source breakdown
 * @route GET /api/v1/leads/vendor/analytics/lead-source
 * @access Private (Vendor)
 */
export const getLeadSourceBreakdown = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { timeframe = "6M" } = req.query;

        const { startDate } = getDateRange(timeframe);

        const data = await Lead.aggregate([
            {
                $match: {
                    vendor: new mongoose.Types.ObjectId(vendorId),
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: "$source",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);

        // Format the response with friendly names
        const sourceLabels = {
            homepage: "Homepage",
            category: "Category Page",
            subcategory: "Subcategory Page",
            search: "Search Results",
            recommended: "Recommended Sections",
            vendor_page: "Similar Vendors",
            saved: "Saved Vendors",
            shared: "Shared Link",
            direct: "Direct Link",
            other: "Other",
        };

        const formattedData = data.map((item) => ({
            source: item._id,
            label: sourceLabels[item._id] || item._id,
            count: item.count,
        }));

        res.status(200).json({
            success: true,
            data: formattedData,
            timeframe,
        });
    } catch (error) {
        console.error("Error fetching lead source breakdown:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch lead source data.",
        });
    }
};

/**
 * @desc Get profile view source breakdown
 * @route GET /api/v1/analytics/profile-view-source
 * @access Private (Vendor)
 */
export const getProfileViewSourceBreakdown = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { timeframe = "6M" } = req.query;

        const { startDate } = getDateRange(timeframe);

        const data = await ProfileView.aggregate([
            {
                $match: {
                    vendor: new mongoose.Types.ObjectId(vendorId),
                    viewedAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: "$source",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);

        // Format the response with friendly names
        const sourceLabels = {
            homepage: "Homepage",
            category: "Category Page",
            subcategory: "Subcategory Page",
            search: "Search Results",
            recommended: "Recommended Sections",
            vendor_page: "Similar Vendors",
            saved: "Saved Vendors",
            shared: "Shared Link",
            direct: "Direct Link",
            other: "Other",
        };

        const formattedData = data.map((item) => ({
            source: item._id,
            label: sourceLabels[item._id] || item._id,
            count: item.count,
        }));

        res.status(200).json({
            success: true,
            data: formattedData,
            timeframe,
        });
    } catch (error) {
        console.error("Error fetching profile view source breakdown:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile view source data.",
        });
    }
};

/**
 * @desc Get enquiries by event type
 * @route GET /api/v1/leads/vendor/analytics/by-event-type
 * @access Private (Vendor)
 */
export const getEnquiriesByEventType = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { timeframe = "6M" } = req.query;

        const { startDate } = getDateRange(timeframe);

        const data = await Lead.aggregate([
            {
                $match: {
                    vendor: new mongoose.Types.ObjectId(vendorId),
                    createdAt: { $gte: startDate },
                    eventType: { $exists: true, $ne: null, $ne: "" },
                },
            },
            {
                $group: {
                    _id: "$eventType",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);

        const formattedData = data.map((item) => ({
            eventType: item._id,
            count: item.count,
        }));

        res.status(200).json({
            success: true,
            data: formattedData,
            timeframe,
        });
    } catch (error) {
        console.error("Error fetching enquiries by event type:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch event type data.",
        });
    }
};

/**
 * @desc Get enquiries by location
 * @route GET /api/v1/leads/vendor/analytics/by-location
 * @access Private (Vendor)
 */
export const getEnquiriesByLocation = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { timeframe = "6M" } = req.query;

        const { startDate } = getDateRange(timeframe);

        const data = await Lead.aggregate([
            {
                $match: {
                    vendor: new mongoose.Types.ObjectId(vendorId),
                    createdAt: { $gte: startDate },
                    location: { $exists: true, $ne: null, $ne: "" },
                },
            },
            {
                $group: {
                    _id: "$location",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 }, // Top 10 locations
        ]);

        const formattedData = data.map((item) => ({
            location: item._id,
            count: item.count,
        }));

        res.status(200).json({
            success: true,
            data: formattedData,
            timeframe,
        });
    } catch (error) {
        console.error("Error fetching enquiries by location:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch location data.",
        });
    }
};

/**
 * @desc Get lead status distribution
 * @route GET /api/v1/leads/vendor/analytics/status-distribution
 * @access Private (Vendor)
 */
export const getLeadStatusDistribution = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { timeframe = "6M" } = req.query;

        const { startDate } = getDateRange(timeframe);

        const data = await Lead.aggregate([
            {
                $match: {
                    vendor: new mongoose.Types.ObjectId(vendorId),
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);

        const formattedData = data.map((item) => ({
            status: item._id,
            count: item.count,
        }));

        res.status(200).json({
            success: true,
            data: formattedData,
            timeframe,
        });
    } catch (error) {
        console.error("Error fetching lead status distribution:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch status distribution data.",
        });
    }
};

/**
 * @desc Get review insights
 * @route GET /api/v1/reviews/vendor/insights
 * @access Private (Vendor)
 */
export const getReviewInsights = async (req, res) => {
    try {
        const vendorId = req.user.id;

        // Get vendor stats
        const vendor = await Vendor.findById(vendorId).select(
            "averageRating reviewCount ratingBreakdown"
        );

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found.",
            });
        }

        // Get recent reviews
        const recentReviews = await Review.find({ vendor: vendorId })
            .populate("user", "username profileImage")
            .sort({ createdAt: -1 })
            .limit(2)
            .select("rating comment createdAt user status flaggedForRemoval");

        // Get review counts by status
        const statusCounts = await Review.aggregate([
            { $match: { vendor: new mongoose.Types.ObjectId(vendorId) } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get flagged reviews count
        const flaggedCount = await Review.countDocuments({
            vendor: vendorId,
            flaggedForRemoval: true
        });

        // Format status counts
        const reviewStatusCounts = {
            Approved: 0,
            Pending: 0,
            Rejected: 0
        };

        statusCounts.forEach(item => {
            if (reviewStatusCounts.hasOwnProperty(item._id)) {
                reviewStatusCounts[item._id] = item.count;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                averageRating: vendor.averageRating || 0,
                reviewCount: vendor.reviewCount || 0,
                ratingBreakdown: vendor.ratingBreakdown || {},
                recentReviews: recentReviews || [],
                reviewStatusCounts,
                flaggedCount
            },
        });
    } catch (error) {
        console.error("Error fetching review insights:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch review insights.",
        });
    }
};

/**
 * @desc Track profile view (Public endpoint)
 * @route POST /api/v1/analytics/track-view
 * @access Public
 */
export const trackProfileView = async (req, res) => {
    try {
        const { vendorId, sessionId, referrer, source } = req.body;

        if (!vendorId || !sessionId) {
            return res.status(400).json({
                success: false,
                message: "Vendor ID and session ID are required.",
            });
        }

        // Get IP address from request
        const ip =
            req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            "unknown";

        // Get user agent
        const userAgent = req.headers["user-agent"] || "";

        // Get user ID if authenticated (optional)
        const userId = req.user?.id || null;

        // Record the view with deduplication
        const result = await ProfileView.recordView({
            vendorId,
            sessionId,
            userId,
            ip,
            userAgent,
            referrer: referrer || "",
            source: source || "direct",
        });

        res.status(200).json({
            success: true,
            recorded: result.recorded,
        });
    } catch (error) {
        console.error("Error tracking profile view:", error);
        res.status(500).json({
            success: false,
            message: "Failed to track profile view.",
        });
    }
};

/**
 * @desc Get profile views over time
 * @route GET /api/v1/analytics/vendor/profile-views
 * @access Private (Vendor)
 */
export const getProfileViewsOverTime = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { timeframe = "6M" } = req.query;

        const { startDate } = getDateRange(timeframe);
        const dateFormat = getDateFormat(timeframe);

        const data = await ProfileView.aggregate([
            {
                $match: {
                    vendor: new mongoose.Types.ObjectId(vendorId),
                    viewedAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: "$viewedAt" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const formattedData = data.map((item) => ({
            period: item._id,
            views: item.count,
        }));

        res.status(200).json({
            success: true,
            data: formattedData,
            timeframe,
        });
    } catch (error) {
        console.error("Error fetching profile views:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile views data.",
        });
    }
};

/**
 * @desc Get profile views vs enquiries
 * @route GET /api/v1/analytics/vendor/views-vs-enquiries
 * @access Private (Vendor)
 */
export const getViewsVsEnquiries = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { timeframe = "6M" } = req.query;

        const { startDate } = getDateRange(timeframe);
        const dateFormat = getDateFormat(timeframe);

        // Get views data
        const viewsData = await ProfileView.aggregate([
            {
                $match: {
                    vendor: new mongoose.Types.ObjectId(vendorId),
                    viewedAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: "$viewedAt" } },
                    views: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Get enquiries data
        const enquiriesData = await Lead.aggregate([
            {
                $match: {
                    vendor: new mongoose.Types.ObjectId(vendorId),
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
                    enquiries: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Merge the data
        const viewsMap = new Map(viewsData.map((item) => [item._id, item.views]));
        const enquiriesMap = new Map(
            enquiriesData.map((item) => [item._id, item.enquiries])
        );

        // Get all unique periods
        const allPeriods = new Set([...viewsMap.keys(), ...enquiriesMap.keys()]);

        const formattedData = Array.from(allPeriods)
            .sort()
            .map((period) => ({
                period,
                views: viewsMap.get(period) || 0,
                enquiries: enquiriesMap.get(period) || 0,
            }));

        res.status(200).json({
            success: true,
            data: formattedData,
            timeframe,
        });
    } catch (error) {
        console.error("Error fetching views vs enquiries:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch comparison data.",
        });
    }
};
/**
 * @desc Get overview stats (Enquiries, Views, Reviews, WhatsApp)
 * @route GET /api/v1/analytics/vendor/overview-stats
 * @access Private (Vendor)
 */
import WhatsAppClick from "../../models/WhatsAppClick.model.js";

// ... existing imports ...

/**
 * @desc Track WhatsApp click (Public endpoint)
 * @route POST /api/v1/analytics/track-whatsapp
 * @access Public
 */
export const trackWhatsAppClick = async (req, res) => {
    try {
        const { vendorId } = req.body;

        if (!vendorId) {
            return res.status(400).json({
                success: false,
                message: "Vendor ID is required.",
            });
        }

        // Get IP address from request
        const ip =
            req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            "unknown";

        // Get user agent
        const userAgent = req.headers["user-agent"] || "";

        // Get user ID if authenticated (optional)
        const userId = req.user?.id || null;

        await WhatsAppClick.create({
            vendor: vendorId,
            user: userId,
            ip,
            userAgent,
        });

        res.status(200).json({
            success: true,
            message: "WhatsApp click recorded.",
        });
    } catch (error) {
        console.error("Error tracking WhatsApp click:", error);
        res.status(500).json({
            success: false,
            message: "Failed to track WhatsApp click.",
        });
    }
};

/**
 * @desc Get overview stats (Enquiries, Views, Reviews, WhatsApp)
 * @route GET /api/v1/analytics/vendor/overview-stats
 * @access Private (Vendor)
 */
export const getOverviewStats = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { clientDate } = req.query; // Expect client date ISO string

        // Use client date if provided, otherwise server time
        const now = clientDate ? new Date(clientDate) : new Date();

        // Calculate start and end of the CURRENT month based on client time
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Calculate start and end of the PREVIOUS month
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // Helper to get counts
        const getCounts = async (Model, dateField) => {
            const current = await Model.countDocuments({
                vendor: new mongoose.Types.ObjectId(vendorId),
                [dateField]: { $gte: currentMonthStart, $lte: currentMonthEnd }
            });

            const previous = await Model.countDocuments({
                vendor: new mongoose.Types.ObjectId(vendorId),
                [dateField]: { $gte: previousMonthStart, $lte: previousMonthEnd }
            });

            return { current, previous };
        };

        const enquiries = await getCounts(Lead, 'createdAt');
        const views = await getCounts(ProfileView, 'viewedAt');
        const reviews = await getCounts(Review, 'createdAt');
        const whatsapp = await getCounts(WhatsAppClick, 'clickedAt');

        res.status(200).json({
            success: true,
            data: {
                enquiries,
                views,
                reviews,
                whatsapp
            }
        });
    } catch (error) {
        console.error("Error fetching overview stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch overview stats.",
        });
    }
};
