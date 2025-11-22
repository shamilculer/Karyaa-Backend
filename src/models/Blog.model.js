import mongoose, { Schema } from "mongoose";

const BlogSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
      unique: true, // enforce unique titles
    },

    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    content: {
      type: String,
      required: [true, "Blog content is required"],
    },

    coverImage: {
      type: String,
      trim: true,
      required: [true, "Blog content is required"],
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Author is required"],
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
      index: true,
    },

    publishedAt: {
      type: Date,
    },

    ctaText: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "Contact Us",
    },

    ctaLink: {
      type: String,
      trim: true,
      default: "/contact",
    },

    metaTitle: {
      type: String,
      trim: true,
      maxlength: 60,
    },

    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160,
    },

    seoKeywords: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 10;
        },
        message: 'Cannot have more than 10 SEO keywords'
      }
    },

    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// --- Auto-generate unique slug based on title ---
BlogSchema.pre("validate", async function (next) {
  if (!this.slug && this.title) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    let slug = baseSlug;
    let count = 1; // Check for existing slugs and append number if conflict

    while (
      await mongoose.models.Blog.findOne({ slug, _id: { $ne: this._id } })
    ) {
      slug = `${baseSlug}-${count++}`;
    }

    this.slug = slug;
  }
  next();
});

// --- Update publishedAt automatically when status changes to "published" ---
BlogSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = Date.now();
  }
  next();
});

const Blog = mongoose.model("Blog", BlogSchema);

export default Blog;
