import mongoose from "mongoose";

const socialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    }
  },
  { _id: false }
);

const brandingSettingsSchema = new mongoose.Schema(
  {
    primaryPhone: {
      type: String,
      required: true,
      trim: true,
    },
    mainEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    supportEmail: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
    },
    location: {
      type: String,
      required: false,
      trim: true,
    },

    socialLinks: {
      type: [socialLinkSchema],
      default: [],
    },

  },
  {
    timestamps: true,
  }
);

const BrandDetails = mongoose.model("BrandDetails", brandingSettingsSchema);

export default BrandDetails
