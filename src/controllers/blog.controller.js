import Blog from "../models/Blog.model.js";
import mongoose from "mongoose";

// -------------------------------------------
// @desc    Get ALL blogs (admin use)
// @route   GET /api/blogs/all
// @access  Admin Only
// -------------------------------------------
export const getAllBlogs = async (req, res) => {
  try {
    // 🧩 Ensure user is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can view all blogs.",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || "";

    const query = {};
    if (search) query.title = { $regex: search, $options: "i" };

    const total = await Blog.countDocuments(query);

    const blogs = await Blog.find(query)
      .populate("author", "username emailAddress")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      blogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -------------------------------------------
// @desc    Get only published blogs (public use)
// @route   GET /api/blogs/published
// @access  Public
// -------------------------------------------
export const getPublishedBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || "";
    const category = req.query.category;

    const query = { status: "published" };
    if (search) query.title = { $regex: search, $options: "i" };
    if (category) query.category = category;

    const total = await Blog.countDocuments(query);

    const blogs = await Blog.find(query)
      .populate("author", "username profileImage")
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      blogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------
// @desc    Get single blog post (by slug or ID)
// @route   GET /api/blog/:slugOrId
// @access  Public
// -------------------------------------------
export const getBlogPost = async (req, res) => {
  try {
    const { slugOrId } = req.params;

    let blog;

    // 🧩 Check if slugOrId is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      blog = await Blog.findById(slugOrId).populate("author", "username profileImage");
    } else {
      blog = await Blog.findOne({ slug: slugOrId }).populate("author", "username profileImage");
    }

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Optionally prevent showing drafts to public
    if (blog.status !== "published") {
      return res.status(403).json({
        success: false,
        message: "This blog post is not published",
      });
    }

    res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------
// @desc    Create a new blog post
// @route   POST /api/blogs
// @access  Admin Only
// -------------------------------------------
export const postBlog = async (req, res) => {
  try {
    // 🧩 Ensure user is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can create blogs.",
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

    // --- Check if a blog with the same title already exists ---
    const existingBlog = await Blog.findOne({ title });
    if (existingBlog) {
      return res.status(400).json({
        success: false,
        message: "A blog with this title already exists",
      });
    }

    const blog = await Blog.create({
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
      message: "Blog created successfully",
      blog,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -------------------------------------------
// @desc    Edit (update) a blog post
// @route   PUT /api/blogs/:id
// @access  Admin Only
// -------------------------------------------
export const editBlog = async (req, res) => {
  try {
    // 🧩 Ensure user is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can edit blogs.",
      });
    }

    const { id } = req.params;

    // Fetch the blog first
    const blog = await Blog.findById(id);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const { title, slug } = req.body;

    // --- Check for duplicate title ---
    if (title && title !== blog.title) {
      const existingTitle = await Blog.findOne({ title, _id: { $ne: id } });
      if (existingTitle) {
        return res.status(400).json({
          success: false,
          message: "Another blog with this title already exists",
        });
      }
    }

    // --- Optional: Check for duplicate slug if you allow custom slugs ---
    if (slug && slug !== blog.slug) {
      const existingSlug = await Blog.findOne({ slug, _id: { $ne: id } });
      if (existingSlug) {
        return res.status(400).json({
          success: false,
          message: "Another blog with this slug already exists",
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
        blog[field] = req.body[field];
      }
    });

    // Save triggers pre-save hooks (slug regeneration, publishedAt update)
    await blog.save();

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      blog,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -------------------------------------------
// @desc    Delete a blog post
// @route   DELETE /api/blogs/:id
// @access  Admin Only
// -------------------------------------------
export const deleteBlog = async (req, res) => {
  try {
    // 🧩 Ensure user is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can delete blogs.",
      });
    }

    const { id } = req.params;

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

