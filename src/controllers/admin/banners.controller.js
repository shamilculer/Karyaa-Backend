import AdBanner from "../../models/AdBanner.model.js";

export const getActiveBanners = async (req, res) => {
    try {
        const { placement } = req.query;
        const now = new Date();

        // Build query
        const query = {
            status: 'Active',
            $and: [
                { $or: [{ activeFrom: { $exists: false } }, { activeFrom: null }, { activeFrom: { $lte: now } }] },
                { $or: [{ activeUntil: { $exists: false } }, { activeUntil: null }, { activeUntil: { $gte: now } }] }
            ]
        };

        // Filter by placement if provided
        if (placement && placement !== 'all') {
            query.placement = { $in: [placement] };
        }

        // Fetch active banners and populate vendor details
        const banners = await AdBanner.find(query)
            .populate({
                path: 'vendor',
                select: 'slug businessName businessLogo',
            })
            .sort({ createdAt: -1 })
            .lean();

        // Transform the response to include vendor slug at top level for easier access
        const transformedBanners = banners.map(banner => {
            if (banner.isVendorSpecific && banner.vendor) {
                return {
                    ...banner,
                    vendorSlug: banner.vendor.slug,
                    businessName: banner.vendor.businessName,
                    businessLogo: banner.vendor.businessLogo,
                };
            }
            return banner;
        });

        return res.status(200).json({
            success: true,
            count: transformedBanners.length,
            data: transformedBanners,
        });

    } catch (error) {
        console.error('Error fetching active banners:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch active banners',
            error: error.message,
        });
    }
};