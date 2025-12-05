import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subcategory name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    vendorCount: {
      type: Number,
      default: 0

    },
    mainCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Main category is required"],
    },
    // 💡 NEW FIELD ADDED
    coverImage: {
      type: String,
      required: [true, "Subcategory cover image is required"],
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isNewSub: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Case-insensitive unique index for name
subCategorySchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

// Pre-validate hook to generate a unique slug
subCategorySchema.pre("validate", async function (next) {
  // Check if name has been modified or if this is a new document and slug is not set
  if (!this.isModified("name") && this.slug) return next();

  // If the name is being modified (or it's new), regenerate the slug
  if (this.name) {
    let baseSlug = this.name.toLowerCase().replace(/\s+/g, "-");
    let slug = baseSlug;
    let count = 1;

    // Check for existing slug conflicts
    while (await mongoose.models.SubCategory.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    this.slug = slug;
  }
  next();
});

const SubCategory = mongoose.model("SubCategory", subCategorySchema);

export default SubCategory;