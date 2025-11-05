import Bundle from "../models/Bundle.model.js";

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