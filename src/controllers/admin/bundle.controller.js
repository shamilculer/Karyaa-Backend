import Bundle from "../../models/Bundle.model.js";

// Get all bundles with pagination and filters
export const getAllBundles = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      sortBy = 'displayOrder',
      sortOrder = 'asc'
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const bundles = await Bundle.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bundle.countDocuments(query);

    res.status(200).json({
      success: true,
      data: bundles,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new bundle
export const createBundle = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      duration, 
      price, 
      features, 
      isPopular,
      includesRecommended,
      status,
      displayOrder 
    } = req.body;

    if (!name || !duration || price === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, duration, and price are required" 
      });
    }

    const bundle = await Bundle.create({
      name,
      description,
      duration,
      price,
      features: features || [],
      isPopular: isPopular || false,
      includesRecommended: includesRecommended || false,
      status: status || 'active',
      displayOrder: displayOrder || 0
    });

    res.status(201).json({
      success: true,
      data: bundle,
      message: "Bundle created successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update bundle
export const updateBundle = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const bundle = await Bundle.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!bundle) {
      return res.status(404).json({ 
        success: false, 
        message: "Bundle not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: bundle,
      message: "Bundle updated successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete bundle
export const deleteBundle = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any vendors are using this bundle
    const Vendor = (await import("../../models/Vendor.model.js")).default;
    const vendorCount = await Vendor.countDocuments({ selectedBundle: id });

    if (vendorCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete bundle. ${vendorCount} vendor(s) are using it.`
      });
    }

    const bundle = await Bundle.findByIdAndDelete(id);

    if (!bundle) {
      return res.status(404).json({ 
        success: false, 
        message: "Bundle not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Bundle deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle bundle status (active/inactive)
export const toggleBundleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const bundle = await Bundle.findById(id);

    if (!bundle) {
      return res.status(404).json({ 
        success: false, 
        message: "Bundle not found" 
      });
    }

    bundle.status = bundle.status === 'active' ? 'inactive' : 'active';
    await bundle.save();

    res.status(200).json({
      success: true,
      data: bundle,
      message: `Bundle ${bundle.status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
