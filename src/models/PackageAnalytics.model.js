import mongoose from "mongoose";

const packageAnalyticsSchema = new mongoose.Schema(
    {
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
            index: true,
        },
        packageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Package",
            required: true,
            index: true,
        },
        packageName: {
            type: String,
            required: true,
        },
        sessionId: {
            type: String,
            required: true,
            index: true,
        },
        userAgent: {
            type: String,
            default: "",
        },
        referrer: {
            type: String,
            default: "",
        },
        ipAddress: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient querying
packageAnalyticsSchema.index({ vendorId: 1, createdAt: -1 });
packageAnalyticsSchema.index({ packageId: 1, createdAt: -1 });
packageAnalyticsSchema.index({ vendorId: 1, packageId: 1, createdAt: -1 });

// Index for time-based queries
packageAnalyticsSchema.index({ createdAt: -1 });

const PackageAnalytics = mongoose.model("PackageAnalytics", packageAnalyticsSchema);

export default PackageAnalytics;
