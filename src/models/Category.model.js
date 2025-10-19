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

    // Array of vendors included in this category
    vendors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
      },
    ],

    // Array of subcategories
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
  },
  { timestamps: true }
);

// Case-insensitive unique index for name
categorySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

// Pre-save hook to generate a unique slug from name
categorySchema.pre("save", async function (next) {
  if (!this.isModified("name")) return next();

  let baseSlug = this.name.toLowerCase().replace(/\s+/g, "-");
  let slug = baseSlug;
  let count = 1;

  // Ensure slug is unique
  while (await mongoose.models.Category.findOne({ slug })) {
    slug = `${baseSlug}-${count++}`;
  }

  this.slug = slug;
  next();
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
