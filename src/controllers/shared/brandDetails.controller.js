import BrandDetails from "../../models/BrandDetails.model.js";

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