import BrandDetails from "../../models/BrandDetails.model.js";


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
