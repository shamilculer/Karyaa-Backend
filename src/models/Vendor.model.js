import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    ownerName: {
      type: String,
      required: [true, "Owner's Name is required for registration"],
      trim: true,
    },
    businessName: {
      type: String,
      required: [true, "Business Name is required for vendor listing"],
      unique: true,
      trim: true,
    },
    ownerProfileImage: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
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
    }, // --- NEW: Tagline ---

    tagline: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    businessLogo: {
      type: String,
      required: [true, "Business Logo is required for verification"],
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
    vendorStatus: {
      type: String,
      enum: ["Pending", "Active", "Inactive"],
      default: "Pending",
    },

    mainCategory: {
      // Change type from single ObjectId to an ARRAY of ObjectIds
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Category", // References the Category model
      required: [true, "At least one Main Category is required"],
      validate: {
        validator: function (v) {
          // Ensures the array is not empty
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
    ], // --- RENAMED: description -> aboutDescription ---

    aboutDescription: {
      type: String,
      required: [true, "About description is required"],
      trim: true,
      maxlength: 2000,
    }, // --- UPDATED: Full Address Structure ---

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
        required: [true, "Country is required"],
      },
      zipCode: {
        type: String,
        trim: true,
        default: "",
      }, // For map integration if needed
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      }, // NEW FIELD: Google Map Link
      googleMapLink: {
        type: String,
        trim: true,
        default: "",
      },
    },

    serviceAreaCoverage: {
      type: String,
      required: [true, "Service Area Coverage is required (e.g., Dubai, UAE)"],
    },

    gallery: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], default: "image" },
      },
    ], // --- NEW: Packages Array ---

    packages: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        priceStartsFrom: {
          type: Number,
          required: true,
          min: 0,
        },
        features: [
          {
            type: String,
            trim: true,
          },
        ],
        isPopular: {
          type: Boolean,
          default: false,
        },
        image: {
          type: String,
          trim: true,
        },
      },
    ],

    pricingStartingFrom: {
      type: Number,
      default: 0,
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      default: 0,
    }, 
    socialMediaLinks: {
      instagram: String,
      facebook: String,
      linkedin: String, // NEW FIELD
      tiktok: String, // NEW FIELD
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
      1: { type: Number, default: 0 }, // count, not percentage
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
    isSponsored: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "vendor",
    },
  },
  { timestamps: true }
);

// --- Pre-Save Hook for SLUG and OWNER PROFILE IMAGE Generation ---
vendorSchema.pre("save", async function (next) {
  // 1. Slug Generation
  if (this.isModified("businessName") || this.isNew) {
    // Replace & with "and", remove extra spaces and non-url-safe chars
    let baseSlug = this.businessName
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, ""); // optional cleanup (remove special chars)

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

  next();
});

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
