import mongoose from "mongoose";

const bannerSchema = mongoose.Schema(
    {
        // --- Core Banner Identity ---
        name: {
            type: String,
            required: [true, 'Banner name is required.'],
            trim: true,
            maxlength: 100
        },
        imageUrl: {
            type: String,
            // Not required - optional for video banners (used as poster)
        },
        mobileImageUrl: {
            type: String, // Optional mobile version
            default: null
        },

        // --- Page Title & Tagline ---
        title: {
            type: String,
            trim: true,
            maxlength: 100,
            default: null
        },
        tagline: {
            type: String,
            trim: true,
            maxlength: 200,
            default: null
        },
        showOverlay: {
            type: Boolean,
            default: true
        },
        displayMode: {
            type: String,
            enum: ['standard', 'auto'],
            default: 'standard'
        },

        // --- Media Configuration ---
        mediaType: {
            type: String,
            enum: ['image', 'video'],
            default: 'image'
        },
        videoUrl: {
            type: String, // Required if mediaType is 'video'
            default: null
        },

        // --- Content Visibility ---
        showTitle: { // To toggle Page Title visibility (different from showOverlay)
            type: Boolean,
            default: true
        },

        // --- Schedule ---
        activeFrom: {
            type: Date,
            default: Date.now
        },
        activeUntil: {
            type: Date,
            default: null
        },

        // --- Status and Placement ---
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active',
            required: true,
        },

        // 💡 UPDATED: Placement is now an array of strings for multi-selection
        // No enum restriction - allows dynamic placement values (categories, subcategories, static pages)
        placement: {
            type: [String], // Array of strings
            required: true,
            default: ['Homepage Carousel'],
        },

        // --- Target Configuration ---
        isVendorSpecific: {
            type: Boolean,
            default: true,
            index: true,
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            default: null,
        },
        customUrl: {
            type: String,
            trim: true,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

bannerSchema.index({ status: 1, placement: 1 });
bannerSchema.index({ activeFrom: 1, activeUntil: 1 }); // Index for time-based queries

bannerSchema.pre('save', function (next) {
    if (this.placement.length === 0) {
        return next(new Error('At least one placement location is required.'));
    }

    // Media Validation
    if (this.mediaType === 'video') {
        if (!this.videoUrl) {
            return next(new Error('Video URL is required for video banners.'));
        }
    } else {
        // Default to image
        if (!this.imageUrl) {
            return next(new Error('Image URL is required for image banners.'));
        }
    }

    if (this.isVendorSpecific) {
        if (!this.vendor) {
            return next(new Error('Vendor is required for vendor-specific banners.'));
        }
        this.customUrl = undefined;
    } else {
        // Custom URL is now optional
        // if (!this.customUrl || this.customUrl.trim() === '') {
        //    return next(new Error('Custom URL is required for non-vendor-specific banners.'));
        // }
        this.vendor = undefined;
    }

    // Validate date range
    if (this.activeFrom && this.activeUntil && this.activeFrom > this.activeUntil) {
        return next(new Error('Active From date must be before Active Until date.'));
    }

    next();
});

const AdBanner = mongoose.models.AdBanner || mongoose.model("AdBanner", bannerSchema);

export default AdBanner;