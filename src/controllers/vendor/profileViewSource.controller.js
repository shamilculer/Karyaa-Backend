import ProfileView from "../../models/ProfileView.model.js";
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
            startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate: now };
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
            category: "Category Page",
            search: "Search Results",
            featured: "Featured Vendors",
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
