import Idea from "../models/Idea.model.js";
import mongoose from "mongoose";

// -------------------------------------------
// @desc    Get ALL Ideas (admin use)
// @route   GET /api/Ideas/all
// @access  Admin Only
// -------------------------------------------
export const getAllIdeas = async (req, res) => {
    try {
        // ... (Admin check logic remains) ...
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only admins can view all Ideas.",
            });
        }

        // Parameters are correctly accessed via req.query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const search = req.query.search || "";

        const query = {};
        if (search) query.title = { $regex: search, $options: "i" };

        const total = await Idea.countDocuments(query);

        const Ideas = await Idea.find(query)
            .populate("author", "username emailAddress")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: Ideas.length,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            Ideas,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// -------------------------------------------
// @desc    Get only published Ideas (public use)
// @route   GET /api/Ideas/published
// @access  Public
// -------------------------------------------
export const getPublishedIdeas = async (req, res) => {
    try {
        // Parameters are correctly accessed via req.query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const search = req.query.search || "";
        const category = req.query.category;

        const query = { status: "published" };
        if (search) query.title = { $regex: search, $options: "i" };
        if (category) query.category = category;

        const total = await Idea.countDocuments(query);

        const Ideas = await Idea.find(query)
            .populate("author", "username profileImage")
            .sort({ publishedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: Ideas.length,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            Ideas,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// -------------------------------------------
// @desc    Get single Idea post (by slug or ID)
// @route   GET /api/Idea/:slugOrId
// @access  Public
// -------------------------------------------
export const getIdeaPost = async (req, res) => {
  try {
    const { slugOrId } = req.params;

    let ideaPost;

    // 🧩 Check if slugOrId is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      ideaPost = await Idea.findById(slugOrId).populate("author", "username profileImage");
    } else {
      ideaPost = await Idea.findOne({ slug: slugOrId }).populate("author", "username profileImage");
    }

    if (!ideaPost) {
      return res.status(404).json({
        success: false,
        message: "Idea post not found",
      });
    }

    // Optionally prevent showing drafts to public
    if (ideaPost.status !== "published") {
      return res.status(403).json({
        success: false,
        message: "This Idea post is not published",
      });
    }

    res.status(200).json({
      success: true,
      ideaPost,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------
// @desc    Create a new Idea post
// @route   POST /api/Ideas
// @access  Admin Only
// -------------------------------------------
export const postIdea = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can create Ideas.",
      });
    }

    const {
      title,
      content,
      category,
      tags,
      status,
      coverImage,
      metaTitle,
      metaDescription,
    } = req.body;

    // --- Check for duplicate title ---
    const existingIdea = await Idea.findOne({ title });
    if (existingIdea) {
      return res.status(400).json({
        success: false,
        message: "An Idea with this title already exists",
      });
    }

    const ideaDoc = await Idea.create({
      title,
      content,
      category,
      tags,
      status,
      coverImage,
      metaTitle,
      metaDescription,
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Idea created successfully",
      idea: ideaDoc,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------
// @desc    Edit (update) an Idea post
// @route   PUT /api/Ideas/:id
// @access  Admin Only
// -------------------------------------------
export const editIdea = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can edit Ideas.",
      });
    }

    const { id } = req.params;

    const ideaDoc = await Idea.findById(id);
    if (!ideaDoc) {
      return res.status(404).json({ success: false, message: "Idea not found" });
    }

    const { title, slug } = req.body;

    // --- Check for duplicate title ---
    if (title && title !== ideaDoc.title) {
      const existingTitle = await Idea.findOne({ title, _id: { $ne: id } });
      if (existingTitle) {
        return res.status(400).json({
          success: false,
          message: "Another Idea with this title already exists",
        });
      }
    }

    // --- Optional: Check for duplicate slug if you allow custom slugs ---
    if (slug && slug !== ideaDoc.slug) {
      const existingSlug = await Idea.findOne({ slug, _id: { $ne: id } });
      if (existingSlug) {
        return res.status(400).json({
          success: false,
          message: "Another Idea with this slug already exists",
        });
      }
    }

    // Update fields manually
    const updatableFields = [
      "title",
      "content",
      "category",
      "tags",
      "status",
      "coverImage",
      "metaTitle",
      "metaDescription",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        ideaDoc[field] = req.body[field];
      }
    });

    // Save triggers pre-save hooks (slug regeneration, publishedAt update)
    await ideaDoc.save();

    res.status(200).json({
      success: true,
      message: "Idea updated successfully",
      idea: ideaDoc,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -------------------------------------------
// @desc    Delete a Idea post
// @route   DELETE /api/Ideas/:id
// @access  Admin Only
// -------------------------------------------
export const deleteIdea = async (req, res) => {
  try {
    // 🧩 Ensure user is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can delete Ideas.",
      });
    }

    const { id } = req.params;

    const Idea = await Idea.findByIdAndDelete(id);

    if (!Idea) {
      return res.status(404).json({
        success: false,
        message: "Idea not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Idea deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

