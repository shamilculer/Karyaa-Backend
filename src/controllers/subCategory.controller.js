import SubCategory from "../models/SubCategory.model.js";
import Category from "../models/Category.model.js";

// -------------------------------------------
// @desc    Get all subcategories
// @route   GET /api/subcategories
// @access  Public
// -------------------------------------------

export const getSubcategories = async (req, res) => {
  try {
    const search = req.query.search || "";
    const mainCategorySlug = req.query.mainCategory;
    const isPopular = req.query.isPopular;
    const isNewSub = req.query.isNew;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (mainCategorySlug) {
      const mainCategory = await Category.findOne({ slug: mainCategorySlug }).select('_id');

      if (mainCategory) {
        // 2. Use the found ID to filter subcategories
        query.mainCategory = mainCategory._id;
      } else {
        // If the slug is provided but no category is found, return an empty array
        return res.status(200).json({
          success: true,
          count: 0,
          subcategories: [],
          message: `Main category with slug '${mainCategorySlug}' not found.`,
        });
      }
    }

    // Original logic for isPopular and isNewSub remains the same
    if (isPopular !== undefined) {
      query.isPopular = isPopular === "true";
    }

    if (isNewSub !== undefined) {
      query.isNewSub = isNewSub === "true";
    }

    const subcategories = await SubCategory.find(query)
      .populate("mainCategory", "name slug")
      .populate("vendors", "name slug") // include more vendor info if needed
      // .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subcategories.length,
      subcategories,
    });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------
// @desc    Create a new subcategory
// @route   POST /api/subcategories
// @access  Admin Only
// -------------------------------------------
export const createSubCategory = async (req, res) => {
  try {
    // ✅ Admin check
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can create subcategories.",
      });
    }

    const { name, mainCategory, vendors, coverImage, isPopular, isNew } = req.body;

    // Check for duplicate name
    const existing = await SubCategory.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A subcategory with this name already exists",
      });
    }

    const subcategory = await SubCategory.create({
      name,
      mainCategory,
      vendors,
      coverImage,
      isPopular: !!isPopular,
      isNew: !!isNew,
    });

    res.status(201).json({
      success: true,
      message: "Subcategory created successfully",
      subcategory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------
// @desc    Edit / update a subcategory
// @route   PUT /api/subcategories/:id
// @access  Admin Only
// -------------------------------------------
export const editSubCategory = async (req, res) => {
  try {
    // ✅ Admin check
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can edit subcategories.",
      });
    }

    const { id } = req.params;

    const subcategory = await SubCategory.findById(id);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    const { name, mainCategory, vendors, coverImage, isPopular, isNew } = req.body;

    // Check for duplicate name if changed
    if (name && name !== subcategory.name) {
      const existing = await SubCategory.findOne({ name, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Another subcategory with this name already exists",
        });
      }
      subcategory.name = name;
    }

    if (mainCategory) subcategory.mainCategory = mainCategory;
    if (vendors) subcategory.vendors = vendors;
    if (coverImage) subcategory.coverImage = coverImage;
    if (isPopular !== undefined) subcategory.isPopular = isPopular;
    if (isNew !== undefined) subcategory.isNew = isNew;

    await subcategory.save();

    res.status(200).json({
      success: true,
      message: "Subcategory updated successfully",
      subcategory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------
// @desc    Delete a subcategory
// @route   DELETE /api/subcategories/:id
// @access  Admin Only
// -------------------------------------------
export const deleteSubCategory = async (req, res) => {
  try {
    // ✅ Admin check
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can delete subcategories.",
      });
    }

    const { id } = req.params;

    const subcategory = await SubCategory.findByIdAndDelete(id);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
