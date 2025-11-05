import Category from "../models/Category.model.js";
import mongoose from "mongoose";

// -------------------------------------------
// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
// -------------------------------------------
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate("vendors", "name")
      .populate("subCategories", "_id name slug");

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -------------------------------------------
// @desc    Get a single category by slug or ID
// @route   GET /api/categories/:identifier
// @access  Public
// -------------------------------------------
export const getCategory = async (req, res) => {
  try {
    const { identifier } = req.params;

    let category;

    // If identifier is a valid MongoDB ObjectId, search by _id
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      category = await Category.findById(identifier)
        .populate("vendors", "name")
        .populate({
          path: "subCategories",
          select: "_id name slug mainCategory",
          populate: { path: "mainCategory", select: "_id name slug" }, // nested populate
        });
    }

    // If not found yet, or identifier is not an ObjectId, search by slug
    if (!category) {
      category = await Category.findOne({ slug: identifier })
        .populate("vendors", "name")
        .populate({
          path: "subCategories",
          select: "_id name slug mainCategory coverImage",
          populate: { path: "mainCategory", select: "_id name slug" },
        });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
