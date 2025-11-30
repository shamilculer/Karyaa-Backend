import PackageAnalytics from "../../models/PackageAnalytics.model.js";
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
 * @desc Track package interest (Know More button click)
 * @route POST /api/v1/leads/vendor/analytics/package/interest
 * @access Public
 */
export const trackPackageInterest = async (req, res) => {
    try {
        const { vendorId, packageId, packageName, sessionId, userAgent, referrer, ipAddress } = req.body;

        // Validate required fields
        if (!vendorId || !packageId || !packageName || !sessionId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: vendorId, packageId, packageName, sessionId",
            });
        }

        // Create analytics record
        await PackageAnalytics.create({
            vendorId,
            packageId,
            packageName,
            sessionId,
            userAgent: userAgent || "",
            referrer: referrer || "",
            ipAddress: ipAddress || "",
        });

        res.status(201).json({
            success: true,
            message: "Package interest tracked successfully",
        });
    } catch (error) {
        console.error("Error tracking package interest:", error);
        res.status(500).json({
            success: false,
            message: "Failed to track package interest",
            error: error.message,
        });
    }
};

/**
 * @desc Get package interests over time
 * @route GET /api/v1/leads/vendor/analytics/package/interests-over-time
 * @access Private (Vendor)
 */
export const getPackageInterestsOverTime = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { timeframe = "1M" } = req.query;

        const { startDate } = getDateRange(timeframe);
        const dateFormat = getDateFormat(timeframe);

        const data = await PackageAnalytics.aggregate([
            {
                $match: {
                    vendorId: new mongoose.Types.ObjectId(vendorId),
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
            interests: item.count,
        }));

        res.status(200).json({
            success: true,
            data: formattedData,
            timeframe,
        });
    } catch (error) {
        console.error("Error fetching package interests over time:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch package interests",
            error: error.message,
        });
    }
};

/**
 * @desc Get package interests grouped by package
 * @route GET /api/v1/leads/vendor/analytics/package/interests-by-package
 * @access Private (Vendor)
 */
export const getInterestsByPackage = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { timeframe = "1M" } = req.query;

        const { startDate } = getDateRange(timeframe);

        const data = await PackageAnalytics.aggregate([
            {
                $match: {
                    vendorId: new mongoose.Types.ObjectId(vendorId),
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        packageId: "$packageId",
                        packageName: "$packageName",
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 }, // Top 10 packages
        ]);

        // Format the response
        const formattedData = data.map((item) => ({
            packageId: item._id.packageId,
            packageName: item._id.packageName,
            interests: item.count,
        }));

        res.status(200).json({
            success: true,
            data: formattedData,
            timeframe,
        });
    } catch (error) {
        console.error("Error fetching interests by package:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch interests by package",
            error: error.message,
        });
    }
};
