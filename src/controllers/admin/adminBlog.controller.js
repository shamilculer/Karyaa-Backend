import Blog from "../../models/Blog.model.js";
import mongoose from "mongoose";

export const addBlogPost = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can create blog posts.",
      });
    }

    const author = req.user._id || req.user.id;

    const {
      title,
      content,
      coverImage,
      status,
      ctaText,
      ctaLink,
      metaTitle,
      metaDescription,
    } = req.body;

    const newBlog = new Blog({
      title,
      content,
      coverImage,
      author,
      status,
      ctaText,
      ctaLink,
      metaTitle,
      metaDescription,
    });

    const savedBlog = await newBlog.save();

    res.status(201).json({
      success: true,
      message: "Blog post created successfully",
      blog: savedBlog,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join("; "),
      });
    }

    if (error.code === 11000) {
      const key = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `A blog post with this ${key} already exists.`,
      });
    }

    console.error("Add blog post error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating blog post.",
    });
  }
};

export const editBlogPost = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can edit blog posts.",
      });
    }

    const { id } = req.params;

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Blog post updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join("; "),
      });
    }

    if (error.code === 11000) {
      const key = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `A blog post with this ${key} already exists.`,
      });
    }

    console.error("Edit blog post error:", error);
    // General Server Error
    res.status(500).json({
      success: false,
      message: "Server error while updating blog post.",
    });
  }
};

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
    // ⭐️ New filter parameter for status
    const statusFilter = req.query.status;

    const query = {};

    // 1. Search Filter (by title)
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // 2. Status Filter
    // Valid statuses are "draft" and "published" based on the schema
    const validStatuses = ["draft", "published"];

    if (statusFilter && validStatuses.includes(statusFilter.toLowerCase())) {
      query.status = statusFilter.toLowerCase();
    }

    // Count total documents matching the filters
    const total = await Blog.countDocuments(query);

    // Fetch blogs with filtering, sorting, and pagination
    const blogs = await Blog.find(query)
      .populate("author", "fullName")
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

export const getBlogPost = async (req, res) => {
  // 🧩 Ensure user is admin
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only admins can view all blogs.",
    });
  }
  try {
    const { slugOrId } = req.params;

    let blog;

    // 🧩 Check if slugOrId is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      blog = await Blog.findById(slugOrId).populate(
        "author",
        "username profileImage"
      );
    } else {
      blog = await Blog.findOne({ slug: slugOrId }).populate(
        "author",
        "username profileImage"
      );
    }

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
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

// --------------------------------------------------------
// @desc   Delete single or multiple blog posts
// @route  DELETE /api/blogs (bulk)
// @route  DELETE /api/blogs/:id (single)
// @access Admin Only
// --------------------------------------------------------
export const deleteBlogs = async (req, res) => {
  try {
    // 🧩 Ensure user is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can delete blogs.",
      });
    }

    // Case 1: Single delete (/api/blogs/:id)
    if (req.params.id) {
      const deletedBlog = await Blog.findByIdAndDelete(req.params.id);

      if (!deletedBlog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Blog deleted successfully",
      });
    }

    // Case 2: Bulk delete (/api/blogs with body.ids)
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide an array of blog IDs",
      });
    }

    const result = await Blog.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} blog(s) successfully`,
    });
  } catch (error) {
    console.error("Delete blogs error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting blogs",
    });
  }
};

export const toggleBlogStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const { ids, id, status } = req.body;

    const validStatuses = ["draft", "published"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing status. Use 'draft' or 'published'.",
      });
    }

    // ✅ SINGLE ITEM MODE
    if (id && !ids) {
      const blog = await Blog.findById(id);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog post not found.",
        });
      }

      if (blog.status === status) {
        return res.status(200).json({
          success: true,
          message: `Post is already ${status}.`,
        });
      }

      blog.status = status;

      if (status === "published") {
        blog.publishedAt = new Date();
      }

      await blog.save();

      return res.status(200).json({
        success: true,
        message: `Post status changed to ${status}.`,
      });
    }

    // ✅ BULK MODE
    if (Array.isArray(ids) && ids.length > 0) {
      const blogs = await Blog.find({ _id: { $in: ids } });

      if (!blogs.length) {
        return res.status(404).json({
          success: false,
          message: "No matching blog posts found.",
        });
      }

      // Filter only posts needing update
      const blogsToUpdate = blogs.filter((b) => b.status !== status);

      const operations = blogsToUpdate.map(async (blog) => {
        blog.status = status;
        if (status === "published") {
          blog.publishedAt = new Date();
        }
        return blog.save();
      });

      await Promise.all(operations);

      return res.status(200).json({
        success: true,
        message: `Updated ${blogsToUpdate.length} post(s) to ${status}.`,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Provide either 'id' or 'ids[]'.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error toggling status.",
      error: error.message,
    });
  }
};
