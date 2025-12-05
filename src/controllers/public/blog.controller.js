import Blog from "../../models/Blog.model.js";
import mongoose from "mongoose";


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
    const exclude = req.query.exclude;

    const query = { status: "published" };
    if (search) query.title = { $regex: search, $options: "i" };
    if (category) query.category = category;
    if (exclude) query._id = { $ne: exclude };

    const total = await Blog.countDocuments(query);

    const blogs = await Blog.find(query)
      .populate("author", "fullName")
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
      blog = await Blog.findById(slugOrId).populate("author", "fullName profileImage");
    } else {
      blog = await Blog.findOne({ slug: slugOrId }).populate("author", "fullName profileImage");
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

    // Track unique view
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0];
      const userAgent = req.headers['user-agent'];

      // Check if this IP has already viewed this blog in the last 24 hours
      const { default: BlogView } = await import("../../models/BlogView.model.js");
      const existingView = await BlogView.findOne({
        blog: blog._id,
        ipAddress: ipAddress,
      });

      // Only increment view count if this is a new unique view
      if (!existingView) {
        // Create new view record
        await BlogView.create({
          blog: blog._id,
          ipAddress: ipAddress,
          userAgent: userAgent,
        });

        // Increment blog view count
        blog.views += 1;
        await blog.save();
      }
    } catch (viewError) {
      // Log error but don't fail the request
      console.error("Error tracking blog view:", viewError);
    }

    res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



