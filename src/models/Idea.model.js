import mongoose from "mongoose";

const ideaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Idea title is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, "Idea description is required"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IdeaCategory',
      required: [true, "Category is required for filtering"],
    },
    gallery: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

ideaSchema.index({ category: 1 });
// Index already created by unique: true on slug field

ideaSchema.pre("save", function (next) {
  if (this.isModified("title") || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

const Idea = mongoose.model("Idea", ideaSchema);

export default Idea;