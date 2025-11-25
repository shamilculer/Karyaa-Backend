import User from "../../models/User.model.js";
import Vendor from "../../models/Vendor.model.js";
import Lead from "../../models/Lead.model.js";
import AdBanner from "../../models/AdBanner.model.js";
import Review from "../../models/Review.model.js";
import Ticket from "../../models/Ticket.model.js";
import Referral from "../../models/Referral.model.js";

// Get dashboard overview statistics
export const getDashboardOverview = async (req, res) => {
  try {
    const now = new Date();

    // Get counts in parallel
    const [
      totalActiveVendors,
      totalRegisteredUsers,
      activeAds,
      totalInquiries,
    ] = await Promise.all([
      // Total active vendors (approved with active subscriptions)
      Vendor.countDocuments({
        vendorStatus: "approved",
        subscriptionEndDate: { $gte: now },
      }),
      
      // Total registered users
      User.countDocuments(),
      
      // Active ads (banners with Active status)
      AdBanner.countDocuments({
        status: "Active",
      }),
      
      // Total inquiries/leads generated
      Lead.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalActiveVendors,
        totalRegisteredUsers,
        activeAds,
        totalInquiries,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching dashboard overview",
    });
  }
};

// Get actionable items list for admin
export const getActionItemsList = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get all actionable items in parallel
    const [
      pendingVendorsData,
      flaggedReviewsData,
      expiringSoonSubscriptionsData,
      openTicketsData,
      newReferralsData,
    ] = await Promise.all([
      // Pending vendors - get both list and count
      Promise.all([
        Vendor.find({
          vendorStatus: "pending",
        })
          .select("referenceId businessName businessLogo email phoneNumber createdAt address.city address.state address.country")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Vendor.countDocuments({ vendorStatus: "pending" })
      ]),
      
      // Flagged reviews - get both list and count
      Promise.all([
        Review.find({
          flaggedForRemoval: true,
        })
          .populate("vendor", "businessName")
          .populate("user", "username email")
          .select("vendor user rating comment createdAt")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Review.countDocuments({ flaggedForRemoval: true })
      ]),
      
      // Subscriptions expiring in next 30 days - get both list and count
      Promise.all([
        Vendor.find({
          vendorStatus: "approved",
          subscriptionEndDate: { 
            $gte: now, 
            $lte: thirtyDaysFromNow 
          },
        })
          .select("referenceId businessName businessLogo email phoneNumber subscriptionEndDate address.city address.state address.country")
          .sort({ subscriptionEndDate: 1 })
          .limit(5)
          .lean(),
        Vendor.countDocuments({
          vendorStatus: "approved",
          subscriptionEndDate: { 
            $gte: now, 
            $lte: thirtyDaysFromNow 
          },
        })
      ]),
      
      // Open support tickets - get both list and count
      Promise.all([
        Ticket.find({
          status: { $in: ["open", "in-progress"] },
        })
          .select("subject category priority status contactEmail createdAt")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Ticket.countDocuments({
          status: { $in: ["open", "in-progress"] },
        })
      ]),
      
      // Pending referrals - get both list and count
      Promise.all([
        Referral.find({
          status: "Pending",
        })
          .select("referrerFullname referrerEmail vendors referralCode createdAt")
          .sort({ createdAt: -1 })
          .limit(9)
          .lean(),
        Referral.countDocuments({ status: "Pending" })
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        pendingVendors: pendingVendorsData[0],
        pendingVendorsCount: pendingVendorsData[1],
        flaggedReviews: flaggedReviewsData[0],
        flaggedReviewsCount: flaggedReviewsData[1],
        expiringSoonSubscriptions: expiringSoonSubscriptionsData[0],
        expiringSoonSubscriptionsCount: expiringSoonSubscriptionsData[1],
        openTickets: openTicketsData[0],
        openTicketsCount: openTicketsData[1],
        newReferrals: newReferralsData[0],
        newReferralsCount: newReferralsData[1],
      },
    });
  } catch (error) {
    console.error("Error fetching action items list:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching action items list",
    });
  }
};

