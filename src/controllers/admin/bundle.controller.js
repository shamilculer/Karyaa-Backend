import Bundle from "../../models/Bundle.model.js";

// Get all bundles with pagination and filters
export const getAllBundles = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      isAvailableForInternational,
      sortBy = 'displayOrder',
      sortOrder = 'asc'
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (isAvailableForInternational !== undefined) {
      query.isAvailableForInternational = isAvailableForInternational === 'true';
    }
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

    // Add capacity info to each bundle
    const bundlesWithCapacity = bundles.map(bundle => ({
      ...bundle.toObject(),
      hasReachedCapacity: bundle.hasReachedCapacity(),
      availableSlots: bundle.getAvailableSlots()
    }));

    res.status(200).json({
      success: true,
      data: bundlesWithCapacity,
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

// Get bundle by ID
export const getBundleById = async (req, res) => {
  try {
    const { id } = req.params;

    const bundle = await Bundle.findById(id);

    if (!bundle) {
      return res.status(404).json({ 
        success: false, 
        message: "Bundle not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...bundle.toObject(),
        hasReachedCapacity: bundle.hasReachedCapacity(),
        availableSlots: bundle.getAvailableSlots()
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
      bonusPeriod, 
      price, 
      features, 
      isPopular,
      includesRecommended,
      isAvailableForInternational,
      maxVendors,
      status,
      displayOrder 
    } = req.body;

    // Validation
    if (!name || !duration || !duration.value || !duration.unit || price === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, duration (with value and unit), and price are required" 
      });
    }

    if (!['days', 'months', 'years'].includes(duration.unit)) {
      return res.status(400).json({ 
        success: false, 
        message: "Duration unit must be 'days', 'months', or 'years'" 
      });
    }

    // Validate bonusPeriod if provided
    if (bonusPeriod && bonusPeriod.value) {
      if (!['days', 'months', 'years'].includes(bonusPeriod.unit)) {
        return res.status(400).json({ 
          success: false, 
          message: "Bonus period unit must be 'days', 'months', or 'years'" 
        });
      }
    }

    // Validate maxVendors if provided
    if (maxVendors !== undefined && maxVendors !== null && maxVendors < 1) {
      return res.status(400).json({ 
        success: false, 
        message: "maxVendors must be at least 1 or null for unlimited" 
      });
    }

    const bundle = await Bundle.create({
      name,
      description,
      duration,
      bonusPeriod: bonusPeriod || { value: 0, unit: 'months', description: '' },
      price,
      features: features || [],
      isPopular: isPopular || false,
      includesRecommended: includesRecommended || false,
      isAvailableForInternational: isAvailableForInternational !== undefined ? isAvailableForInternational : true,
      maxVendors: maxVendors || null,
      status: status || 'active',
      displayOrder: displayOrder || 0
    });

    res.status(201).json({
      success: true,
      data: {
        ...bundle.toObject(),
        hasReachedCapacity: bundle.hasReachedCapacity(),
        availableSlots: bundle.getAvailableSlots()
      },
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

    // Validate duration if being updated
    if (updates.duration) {
      if (!updates.duration.value || !updates.duration.unit) {
        return res.status(400).json({ 
          success: false, 
          message: "Duration must include both value and unit" 
        });
      }
      if (!['days', 'months', 'years'].includes(updates.duration.unit)) {
        return res.status(400).json({ 
          success: false, 
          message: "Duration unit must be 'days', 'months', or 'years'" 
        });
      }
    }

    // Validate bonusPeriod if being updated
    if (updates.bonusPeriod && updates.bonusPeriod.value) {
      if (!['days', 'months', 'years'].includes(updates.bonusPeriod.unit)) {
        return res.status(400).json({ 
          success: false, 
          message: "Bonus period unit must be 'days', 'months', or 'years'" 
        });
      }
    }

    // Validate maxVendors if being updated
    if (updates.maxVendors !== undefined && updates.maxVendors !== null && updates.maxVendors < 1) {
      return res.status(400).json({ 
        success: false, 
        message: "maxVendors must be at least 1 or null for unlimited" 
      });
    }

    // Check if trying to reduce maxVendors below current subscribersCount
    if (updates.maxVendors !== undefined) {
      const currentBundle = await Bundle.findById(id);
      if (currentBundle && updates.maxVendors !== null && updates.maxVendors < currentBundle.subscribersCount) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot set maxVendors to ${updates.maxVendors}. Current subscribers: ${currentBundle.subscribersCount}` 
        });
      }
    }

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
      data: {
        ...bundle.toObject(),
        hasReachedCapacity: bundle.hasReachedCapacity(),
        availableSlots: bundle.getAvailableSlots()
      },
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
      data: {
        ...bundle.toObject(),
        hasReachedCapacity: bundle.hasReachedCapacity(),
        availableSlots: bundle.getAvailableSlots()
      },
      message: `Bundle ${bundle.status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle bundle international availability
export const toggleBundleInternationalAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const bundle = await Bundle.findById(id);

    if (!bundle) {
      return res.status(404).json({ 
        success: false, 
        message: "Bundle not found" 
      });
    }

    bundle.isAvailableForInternational = !bundle.isAvailableForInternational;
    await bundle.save();

    res.status(200).json({
      success: true,
      data: {
        ...bundle.toObject(),
        hasReachedCapacity: bundle.hasReachedCapacity(),
        availableSlots: bundle.getAvailableSlots()
      },
      message: `Bundle ${bundle.isAvailableForInternational ? 'now available' : 'no longer available'} for international vendors`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};