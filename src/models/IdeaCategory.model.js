import mongoose from "mongoose";

const generateSlug = (name) => {
  if (!name) return null;
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const ideaCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    coverImage: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

ideaCategorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = generateSlug(this.name);
  }
  next();
});

ideaCategorySchema.pre(["findOneAndUpdate", "updateMany"], function (next) {
  const update = this.getUpdate();

  if (update.name) {
    update.slug = generateSlug(update.name);
  }

  if (update.$set && update.$set.name) {
    update.$set.slug = generateSlug(update.$set.name);
  }

  next();
});

// Index already created by unique: true on slug field

const IdeaCategory = mongoose.model("IdeaCategory", ideaCategorySchema);

export default IdeaCategory;