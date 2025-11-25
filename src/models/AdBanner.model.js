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
            required: [true, 'Banner image URL is required.'],
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


bannerSchema.pre('save', function(next) {
    if (this.placement.length === 0) {
        return next(new Error('At least one placement location is required.'));
    }

    if (this.isVendorSpecific) {
        if (!this.vendor) {
            return next(new Error('Vendor ID is required for vendor-specific banners.'));
        }
        this.customUrl = undefined;
    } else {
        if (!this.customUrl || this.customUrl.trim() === '') {
            return next(new Error('Custom URL is required for non-vendor-specific banners.'));
        }
        this.vendor = undefined;
    }
    next();
});


const AdBanner = mongoose.models.AdBanner || mongoose.model("AdBanner", bannerSchema);

export default AdBanner;