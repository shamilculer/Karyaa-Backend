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
// @desc    Create a new category
// @route   POST /api/categories
// @access  Admin Only
// -------------------------------------------
export const createCategory = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can create categories.",
      });
    }

    const { name, vendors = [], subCategories = [], coverImage } = req.body;

    // Check if name already exists
    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    const category = await Category.create({
      name,
      vendors,
      subCategories,
      coverImage,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------
// @desc    Edit/update a category
// @route   PUT /api/categories/:id
// @access  Admin Only
// -------------------------------------------
export const editCategory = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can edit categories.",
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    const { name, vendors, subCategories, coverImage } = req.body;

    // Check for duplicate name
    if (name && name !== category.name) {
      const exists = await Category.findOne({ name });
      if (exists) {
        return res
          .status(409)
          .json({ success: false, message: "Category name already exists" });
      }
      category.name = name;
    }

    if (vendors) category.vendors = vendors;
    if (subCategories) category.subCategories = subCategories;
    if (coverImage) category.coverImage = coverImage;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------
// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Admin Only
// -------------------------------------------
export const deleteCategory = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can delete categories.",
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
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
