import Bundle from "../models/Bundle.model.js";
import Vendor from "../models/Vendor.model.js";

export const getBundlesForRegistration = async (req, res) => {
  try {
    const bundles = await Bundle.find({ status: 'active' })
      .select('_id name price duration')
      .sort('displayOrder');

    const formattedBundles = bundles.map(bundle => ({
      _id: bundle._id,
      label: `${bundle.name} - ${bundle.price} AED`,
      name: bundle.name,
      price: bundle.price,
      duration: bundle.duration
    }));

    res.status(200).json({
      success: true,
      data: formattedBundles
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllActiveBundles = async (req, res) => {
  try {
    const bundles = await Bundle.find({ status: 'active' })
      .sort('displayOrder')
      .select('-__v -subscribersCount -status -description'); 

    res.status(200).json({
      success: true,
      data: bundles
    });
  } catch (error) {
    console.error("Error fetching all active bundles:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to fetch active bundles." 
    });
  }
};

export const sendBundleEnquiry = async (req, res) => {
  const vendorId = req.user.id;
  const { bundle: bundleId } = req.body;

  if (!bundleId) {
    return res.status(400).json({
      success: false,
      message: "Bundle ID is required to submit an enquiry.",
    });
  }

  try {
    const vendor = await Vendor.findById(vendorId).select("email businessName phoneNumber");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found.",
      });
    }

    //add mailing service here.


    res.status(200).json({
      success: true,
      message: "Bundle enquiry recorded successfully. We will reach out to you shortly.",
    });

  } catch (error) {
    console.error(`Error submitting bundle enquiry for vendor ${vendorId}:`, error);

    res.status(500).json({
      success: false,
      message: "System Error: Failed to submit the bundle enquiry.",
    });
  }
};

export const getVendorSubscriptionStatus = async (req, res) => {
  const vendorId = req.user.id;

  try {
    const vendor = await Vendor.findById(vendorId)
      .select(
        "businessName selectedBundle subscriptionStartDate subscriptionEndDate vendorStatus customDuration customFeatures"
      )
      .populate({
        path: "selectedBundle",
        select: "name price duration bonusPeriod features",
      })
      .lean();

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found.",
      });
    }
    
    const isActive =
      vendor.vendorStatus === "approved" &&
      vendor.subscriptionEndDate &&
      new Date() <= vendor.subscriptionEndDate;
      
    const bundleFeatures = vendor.selectedBundle?.features || [];
    const customFeatures = vendor.customFeatures || [];
    const allFeatures = [...bundleFeatures, ...customFeatures];


    const responseData = {
      vendorName: vendor.businessName,
      status: vendor.vendorStatus,
      isSubscriptionActive: isActive,
      bundle: {
        id: vendor.selectedBundle?._id,
        name: vendor.selectedBundle?.name,
        price: vendor.selectedBundle?.price,
        duration: vendor.customDuration?.value 
            ? vendor.customDuration // Use custom duration if available
            : vendor.selectedBundle?.duration, // Otherwise, use bundle duration
        bonusPeriod: vendor.customDuration?.bonusPeriod 
            ? vendor.customDuration.bonusPeriod // Use custom bonus if available
            : vendor.selectedBundle?.bonusPeriod, // Otherwise, use bundle bonus
        features: allFeatures,
      },
      subscription: {
        startDate: vendor.subscriptionStartDate,
        endDate: vendor.subscriptionEndDate,
      },
      // Include raw custom fields for debugging/admin
      customDuration: vendor.customDuration, 
      customFeatures: vendor.customFeatures,
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching vendor subscription status:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch vendor subscription status.",
    });
  }
};