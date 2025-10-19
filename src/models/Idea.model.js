import mongoose, { Schema } from "mongoose";

const IdeaSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Idea title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
      unique: true, // enforce unique title
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
      required: [true, "Idea content is required"],
      // stores HTML or JSON from rich text editor
    },

    coverImage: {
      type: String,
      trim: true,
      default: "https://placehold.co/1200x600?text=idea+Cover",
    },

    // --- REVERTED CATEGORY FIELD TO SIMPLE STRING ---
    category: {
      type: String,
      trim: true,
      default: "General",
      index: true, // Keep an index for fast lookups/filtering
    },
    // --------------------------------------------------

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },

    // --- Status & Publication ---
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true, // allows fast filtering
    },

    publishedAt: {
      type: Date,
    },

    // --- SEO Fields ---
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

    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// --- Auto-generate unique slug based on title ---
IdeaSchema.pre("validate", async function (next) {
  if (!this.slug && this.title) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    let slug = baseSlug;
    let count = 1;

    // check for existing slugs and append number if conflict
    while (await mongoose.models.Idea.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count++}`;
    }

    this.slug = slug;
  }
  next();
});

// --- Update publishedAt automatically when status changes to "published" ---
IdeaSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  next();
});

const Idea = mongoose.models.Idea || mongoose.model("Idea", IdeaSchema);

export default Idea;