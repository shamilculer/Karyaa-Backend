import SubCategory from "../models/SubCategory.model.js";
import Category from "../models/Category.model.js";
import mongoose from "mongoose";

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
// @desc    Get single subcategory by ID or slug
// @route   GET /api/subcategories/:identifier
// @access  Public
// -------------------------------------------
export const getSubCategory = async (req, res) => {
  try {
    const { identifier } = req.params; // can be ID or slug
    let subcategory = null;

    // Check if identifier is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      subcategory = await SubCategory.findById(identifier)
        .populate("mainCategory", "name slug")
    }

    // If not found by ID or identifier is not an ObjectId, try slug
    if (!subcategory) {
      subcategory = await SubCategory.findOne({ slug: identifier })
        .populate("mainCategory", "name slug")
    }

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    res.status(200).json({
      success: true,
      subcategory,
    });
  } catch (error) {
    console.error("Error fetching subcategory:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};