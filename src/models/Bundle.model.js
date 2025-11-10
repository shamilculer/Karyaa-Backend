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
        default: "years",
      },
    },
    bonusPeriod: {
      value: {
        type: Number,
        default: 0,
        min: 0,
      },
      unit: {
        type: String,
        enum: ["days", "months", "years"],
        default: "months",
      },
      description: {
        type: String,
        trim: true,
        default: "",
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
    isAvailableForInternational: {
      type: Boolean,
      default: true,
      index: true,
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
    maxVendors: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

bundleSchema.index({ status: 1, displayOrder: 1 });

bundleSchema.methods.hasReachedCapacity = function () {
  if (!this.maxVendors) return false; // Unlimited if null/undefined
  return this.subscribersCount >= this.maxVendors;
};

// Get available slots remaining
bundleSchema.methods.getAvailableSlots = function () {
  if (!this.maxVendors) return null; // Unlimited
  return Math.max(0, this.maxVendors - this.subscribersCount);
};

// Pre-save validation to prevent exceeding max vendors
bundleSchema.pre("save", function (next) {
  if (this.maxVendors && this.subscribersCount > this.maxVendors) {
    return next(
      new Error(
        `Subscribers count (${this.subscribersCount}) cannot exceed maximum vendors limit (${this.maxVendors})`
      )
    );
  }
  next();
});

const Bundle = mongoose.model("Bundle", bundleSchema);

export default Bundle;