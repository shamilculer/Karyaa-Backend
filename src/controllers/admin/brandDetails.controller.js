import BrandDetails from "../../models/BrandDetails.model.js";

/**
 * @desc Get branding settings
 * @route GET /api/brand-settings
 * @access Public (or Admin based on your auth)
 */
export const getBrandDetails = async (req, res) => {
  try {
    const settings = await BrandDetails.findOne();

    return res.status(200).json({
      success: true,
      data: settings || {},
    });
  } catch (error) {
    console.error("GET BRAND SETTINGS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Unable to fetch branding settings",
    });
  }
};

/**
 * @desc Update branding settings
 * @route PUT /api/brand-settings
 * @access Private (Admin)
 */
export const updateBrandDetails = async (req, res) => {
  try {
    const {
      primaryPhone,
      mainEmail,
      supportEmail,
      location,
      socialLinks,
    } = req.body;

    // react-admin style: upsert ensures creation if missing
    const updated = await BrandDetails.findOneAndUpdate(
      {},
      {
        primaryPhone,
        mainEmail,
        supportEmail,
        location,
        socialLinks,
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Branding settings updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("UPDATE BRAND SETTINGS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Unable to update branding settings",
    });
  }
};
