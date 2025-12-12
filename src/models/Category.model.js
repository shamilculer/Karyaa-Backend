import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    vendorCount: {
      type: Number,
      default: 0

    },

    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
      },
    ],

    coverImage: {
      type: String,
      trim: true,
      default: "https://placehold.co/1200x600?text=Category+Cover",
    },
    // SEO Fields
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    metaKeywords: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Case-insensitive unique index for name
categorySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

// Pre-save hook to generate a unique slug from name
// Pre-validate hook to generate a unique slug
categorySchema.pre("validate", async function (next) {
  if (!this.isModified("name") && this.slug) return next();

  if (this.name) {
    let baseSlug = this.name.toLowerCase().replace(/\s+/g, "-");
    let slug = baseSlug;
    let count = 1;

    // Ensure slug is unique
    while (await mongoose.models.Category.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    this.slug = slug;
  }
  next();
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
