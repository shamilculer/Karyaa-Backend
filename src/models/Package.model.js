import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
    {
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
            index: true,
        },

        coverImage: {
            type: String,
            required: [true, "Cover image is required"],
            trim: true,
        },

        name: {
            type: String,
            required: [true, "Package name is required"],
            trim: true,
            index: "text",
        },

        subheading: {
            type: String,
            trim: true,
            default: "",
        },

        description: {
            type: String,
            trim: true,
            maxlength: 2000,
            required: [true, "Package description is required"],
        },

        priceStartingFrom: {
            type: Number,
            required: [true, "Starting price is required"],
            min: [0, "Price cannot be negative"],
        },

        services: [
            {
                type: String,
                required: true,
                trim: true,
                index: true,
            },
        ],

        includes: [
            {
                type: String,
                trim: true,
            },
        ],

        analytics: {
            views: { type: Number, default: 0 },
            clicks: { type: Number, default: 0 },
            inquiries: { type: Number, default: 0 },
            favorites: { type: Number, default: 0 },
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    { timestamps: true }
);

// Compound index for vendor dashboard listings
packageSchema.index({ createdAt: -1 });

const Package =
    mongoose.models.Package || mongoose.model("Package", packageSchema);

export default Package;