import mongoose from "mongoose";
import bcrypt from "bcrypt";

const vendorSchema = mongoose.Schema(
  {
    ownerName: {
      type: String,
      required: [true, "Owner's Name is required for registration"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone Number is required for OTP verification"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    ownerProfileImage: {
      type: String,
      trim: true,
    },
    tradeLicenseNumber: {
      type: String,
      required: [true, "Trade License Number is required for verification"],
      unique: true,
      trim: true,
    },
    tradeLicenseCopy: {
      type: String,
      required: [true, "Trade License copy is required"],
    },
    personalEmiratesIdNumber: {
      type: String,
      required: [true, "Personal Emirates ID Number is required."],
      trim: true,
    },
    emiratesIdCopy: {
      type: String,
      required: [true, "Emirates ID Copy is required."],
    },
    businessName: {
      type: String,
      required: [true, "Business Name is required for vendor listing"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    businessLogo: {
      type: String,
      required: [true, "Business Logo is required for verification"],
      trim: true,
    },
    businessDescription: {
      type: String,
      required: [true, "Business description is required"],
      trim: true,
      minlength: 50,
      maxlength: 1000,
    },
    whatsAppNumber: {
      type: String,
      required: [true, "WhatsApp Number is required"],
      trim: true,
    },
    pricingStartingFrom: {
      type: Number,
      default: 0,
      min: 0,
    },

    mainCategory: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Category",
      required: [true, "At least one Main Category is required"],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "At least one Main Category is required.",
      },
    },

    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
      },
    ],

    occasionsServed: {
      type: [String],
      enum: [
        "baby-showers-gender-reveals",
        "birthdays-anniversaries",
        "corporate-events",
        "cultural-festival-events",
        "engagement-proposal-events",
        "graduation-celebrations",
        "private-parties",
        "product-launches-brand-events",
      ],
      default: [],
      index: true,
    },

    // Bundle & Subscription Fields
    selectedBundle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bundle",
      required: [true, "A bundle must be selected."],
    },

    subscriptionStatus: {
      type: String,
      enum: ["pending", "active", "expired"],
      default: "pending",
    },

    subscriptionStartDate: {
      type: Date,
      default: null,
    },

    subscriptionEndDate: {
      type: Date,
      default: null,
    },

    // Custom features added by admin (beyond bundle features)
    customFeatures: [
      {
        type: String,
        trim: true,
      },
    ],

    address: {
      street: {
        type: String,
        trim: true,
        default: "",
      },
      area: {
        type: String,
        trim: true,
        default: "",
      },
      city: {
        type: String,
        trim: true,
        required: [true, "City is required"],
      },
      state: {
        type: String,
        trim: true,
        default: "",
      },
      country: {
        type: String,
        trim: true,
        default: "UAE",
      },
      zipCode: {
        type: String,
        trim: true,
        default: "",
      },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
      googleMapLink: {
        type: String,
        trim: true,
        default: "",
      },
    },

    websiteLink: {
      type: String,
      trim: true,
      default: "",
    },
    facebookLink: {
      type: String,
      trim: true,
      default: "",
    },
    instagramLink: {
      type: String,
      trim: true,
      default: "",
    },
    twitterLink: {
      type: String,
      trim: true,
      default: "",
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    ratingBreakdown: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
    isSponsored: {
      type: Boolean,
      default: false,
    },
    isRecommended: {
      type: Boolean,
      default: false,
      index: true,
    },
    vendorStatus: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "pending",
    },
    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "vendor",
    },
  },
  { timestamps: true }
);

vendorSchema.pre("save", async function (next) {
  // 1. Slug Generation
  if (this.isModified("businessName") || this.isNew) {
    let baseSlug = this.businessName
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    let slug = baseSlug;
    let count = 1;

    if (mongoose.models.Vendor) {
      while (
        await mongoose.models.Vendor.findOne({ slug, _id: { $ne: this._id } })
      ) {
        slug = `${baseSlug}-${count++}`;
      }
    }
    this.slug = slug;
  }

  // 2. Dynamic Owner Profile Image Generation
  if (!this.ownerProfileImage && this.ownerName) {
    const formattedName = encodeURIComponent(this.ownerName.trim());
    this.ownerProfileImage = `https://ui-avatars.com/api/?background=random&color=fff&name=${formattedName}`;
  }

  // 3. Password hashing
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// Check if subscription is currently active
vendorSchema.methods.hasActiveSubscription = function () {
  return (
    this.subscriptionStatus === "active" &&
    this.subscriptionEndDate &&
    new Date() <= this.subscriptionEndDate
  );
};

// Get all features (bundle + custom)
vendorSchema.methods.getAllFeatures = async function () {
  if (!this.selectedBundle) return [];

  const Bundle = mongoose.model("Bundle");
  const bundle = await Bundle.findById(this.selectedBundle).select("features");

  if (!bundle) return this.customFeatures || [];

  return [...(bundle.features || []), ...(this.customFeatures || [])];
};

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
