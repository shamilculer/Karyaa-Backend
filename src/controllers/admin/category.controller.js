import Category from "../../models/Category.model.js";
import SubCategory from "../../models/SubCategory.model.js";
import Vendor from "../../models/Vendor.model.js";
import mongoose from "mongoose";


export const getCategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      // Lookup subcategories
      {
        $lookup: {
          from: "subcategories",
          localField: "subCategories",
          foreignField: "_id",
          as: "subCategories",
        },
      },

      // Project only required fields from subcategories
      {
        $project: {
          name: 1,
          slug: 1,
          icon: 1,
          coverImage: 1,
          subCategories: {
            $map: {
              input: "$subCategories",
              as: "sub",
              in: {
                _id: "$$sub._id",
                name: "$$sub.name",
                coverImage: "$$sub.coverImage",
                vendorCount: { $size: "$$sub.vendors" },
              },
            },
          },
        },
      },

      // Add total vendor count for the category
      {
        $addFields: {
          vendorCount: {
            $sum: "$subCategories.vendorCount",
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addCategory = async (req, res) => {
  try {
    const { name, coverImage } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "A category with this name already exists.",
      });
    }

    const newCategory = new Category({ name, coverImage });
    await newCategory.save();

    res.status(201).json({
      success: true,
      message: "Category added successfully",
      category: newCategory,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A category with this name or slug already exists.",
      });
    }
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if id is a valid ObjectId or use it as slug
    const matchCondition = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { slug: id }] }
      : { slug: id };

    const category = await Category.aggregate([
      {
        $match: matchCondition,
      },
      // Lookup subcategories
      {
        $lookup: {
          from: "subcategories",
          localField: "subCategories",
          foreignField: "_id",
          as: "subCategories",
        },
      },
      // Project only required fields from subcategories
      {
        $project: {
          name: 1,
          slug: 1,
          coverImage: 1,
          createdAt: 1,
          updatedAt: 1,
          subCategories: {
            $map: {
              input: "$subCategories",
              as: "sub",
              in: {
                _id: "$$sub._id",
                name: "$$sub.name",
                slug: "$$sub.slug",
                coverImage: "$$sub.coverImage",
                isPopular: "$$sub.isPopular",
                isNewSub: "$$sub.isNewSub",
                mainCategory: "$$sub.mainCategory",
                vendorCount: { $size: "$$sub.vendors" },
                createdAt: "$$sub.createdAt",
                updatedAt: "$$sub.updatedAt",
              },
            },
          },
        },
      },
      // Add total vendor count for the category
      {
        $addFields: {
          vendorCount: {
            $sum: "$subCategories.vendorCount",
          },
        },
      },
    ]);

    if (!category || category.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      category: category[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if id is a valid ObjectId or use it as slug
    const matchCondition = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { slug: id }] }
      : { slug: id };

    // Find the category first to check if it exists
    const existingCategory = await Category.findOne(matchCondition);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // If slug is being updated, check if new slug already exists
    if (updateData.slug && updateData.slug !== existingCategory.slug) {
      const slugExists = await Category.findOne({ slug: updateData.slug });
      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: "A category with this slug already exists",
        });
      }
    }

    // If name is being updated, check if new name already exists
    if (updateData.name && updateData.name !== existingCategory.name) {
      const nameExists = await Category.findOne({ name: updateData.name });
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: "A category with this name already exists",
        });
      }
    }

    // Update the category
    await Category.findByIdAndUpdate(
      existingCategory._id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if id is a valid ObjectId or use it as slug
    const matchCondition = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { slug: id }] }
      : { slug: id };

    // Find the category first to check if it exists
    const existingCategory = await Category.findOne(matchCondition);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if category has subcategories
    if (existingCategory.subCategories && existingCategory.subCategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category with existing subcategories. Please delete all subcategories first.",
      });
    }

    // Delete the category
    await Category.findByIdAndDelete(existingCategory._id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addSubCategory = async (req, res) => {
  try {
    const { name, mainCategory, coverImage } = req.body;

    if (!name || !mainCategory || !coverImage) {
      return res.status(400).json({ success: false, message: "Missing required fields: name, mainCategory, or coverImage" });
    }

    const existingMainCategory = await Category.findById(mainCategory);

    if (!existingMainCategory) {
      return res.status(404).json({ success: false, message: "Main Category not found" });
    }

    const newSubCategory = new SubCategory({
      name,
      mainCategory,
      coverImage,
    });
    // The pre-save hook in SubCategory model generates the unique slug.
    await newSubCategory.save();

    // 3. Add the new subcategory's ID to the main category's subCategories array
    existingMainCategory.subCategories.push(newSubCategory._id);
    await existingMainCategory.save();

    res.status(201).json({
      success: true,
      message: "Subcategory added successfully",
      subCategory: newSubCategory,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A subcategory with this name or slug already exists.",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { mainCategory, ...updateFields } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Sub-category ID format" });
    }

    // 1. Find the subcategory first
    const existingSubCategory = await SubCategory.findById(id);

    if (!existingSubCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub-category not found",
      });
    }

    // 2. Check for unique name conflict if 'name' is being updated
    if (updateFields.name && updateFields.name !== existingSubCategory.name) {
      const nameExists = await SubCategory.findOne({ name: updateFields.name });
      if (nameExists && !nameExists._id.equals(existingSubCategory._id)) {
        return res.status(400).json({
          success: false,
          message: "A subcategory with this name already exists",
        });
      }
    }

    // 3. Update the subcategory document
    // We only pass 'updateFields' (which excludes mainCategory) to the update operation.
    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      id,
      { ...updateFields, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    // NOTE: The pre-save hook in the SubCategory model will automatically regenerate 
    // the 'slug' if 'name' was updated, which is handled implicitly by the update.

    res.status(200).json({
      success: true,
      message: "Sub-category updated successfully",
      subCategory: updatedSubCategory,
    });
  } catch (error) {
    // Handle potential duplicate key error (for slug/name)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A subcategory with this name or slug already exists.",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubCategories = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can delete sub-categories.",
      });
    }

    // ✅ Single delete (URL param)
    if (req.params.id) {
      const deletedItem = await SubCategory.findByIdAndDelete(req.params.id);

      if (!deletedItem) {
        return res.status(404).json({
          success: false,
          message: "Sub-category not found",
        });
      }

      // ✅ Remove from vendor documents
      await Vendor.updateMany(
        { subCategories: deletedItem._id },
        { $pull: { subCategories: deletedItem._id } }
      );

      return res.status(200).json({
        success: true,
        message: "Sub-category deleted and removed from vendors successfully",
      });
    }

    // ✅ Bulk delete (body.ids)
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide an array of Sub-category IDs",
      });
    }

    const result = await SubCategory.deleteMany({ _id: { $in: ids } });

    // ✅ Remove from vendor documents
    await Vendor.updateMany(
      { subCategories: { $in: ids } },
      { $pull: { subCategories: { $in: ids } } }
    );

    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} sub-category(s) and removed references from vendors successfully`,
    });

  } catch (error) {
    console.error("Delete sub-category error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting sub-categories",
    });
  }
};

export const toggleSubcategoryFlags = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can update subcategories.",
      });
    }

    const { ids, flag, value } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide an array of Sub-category IDs",
      });
    }

    if (!["isPopular", "isNewSub"].includes(flag)) {
      return res.status(400).json({
        success: false,
        message: "Invalid flag provided",
      });
    }

    // Only update if value actually differs (optimization)
    const result = await SubCategory.updateMany(
      { _id: { $in: ids }, [flag]: { $ne: value } },
      { $set: { [flag]: value } }
    );

    return res.status(200).json({
      success: true,
      updatedCount: result.modifiedCount,
      message: `Updated ${result.modifiedCount} sub-category(s) successfully`,
    });

  } catch (error) {
    console.error("Toggle flag error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating sub-category flags",
    });
  }
};