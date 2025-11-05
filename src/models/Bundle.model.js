import mongoose from "mongoose";

const bundleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    duration: {
      value: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        enum: ["days", "months", "years"],
        default: "months",
      },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    includesRecommended: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    subscribersCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
bundleSchema.index({ status: 1, displayOrder: 1 });

const Bundle = mongoose.model("Bundle", bundleSchema);

export default Bundle;
