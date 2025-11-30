import mongoose from "mongoose";
import crypto from "crypto";

const profileViewSchema = new mongoose.Schema(
    {
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        sessionId: {
            type: String,
            required: true,
            index: true,
        },
        ipHash: {
            type: String,
            required: true,
        },
        userAgent: {
            type: String,
            default: "",
        },
        referrer: {
            type: String,
            default: "",
        },
        source: {
            type: String,
            enum: ["category", "search", "featured", "direct", "other"],
            default: "direct",
            index: true,
        },
        viewedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        duration: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: false,
    }
);

// Compound index for efficient analytics queries
profileViewSchema.index({ vendor: 1, viewedAt: -1 });

// Compound index for deduplication
profileViewSchema.index({ vendor: 1, sessionId: 1, viewedAt: -1 });

// Compound index for source analytics
profileViewSchema.index({ vendor: 1, source: 1, viewedAt: -1 });

// Static method to hash IP address
profileViewSchema.statics.hashIP = function (ip) {
    return crypto.createHash("sha256").update(ip).digest("hex");
};

// Static method to check for recent view (deduplication)
profileViewSchema.statics.hasRecentView = async function (
    vendorId,
    sessionId,
    minutesAgo = 30
) {
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);

    const recentView = await this.findOne({
        vendor: vendorId,
        sessionId: sessionId,
        viewedAt: { $gte: cutoffTime },
    });

    return !!recentView;
};

// Static method to record a view with deduplication
profileViewSchema.statics.recordView = async function (viewData) {
    const { vendorId, sessionId, userId, ip, userAgent, referrer, source } = viewData;

    // Check for recent view
    const hasRecent = await this.hasRecentView(vendorId, sessionId, 30);

    if (hasRecent) {
        return { recorded: false, reason: "duplicate" };
    }

    // Hash IP address
    const ipHash = this.hashIP(ip);

    // Create new view record
    const view = await this.create({
        vendor: vendorId,
        user: userId || null,
        sessionId,
        ipHash,
        userAgent: userAgent || "",
        referrer: referrer || "",
        source: source || "direct",
        viewedAt: new Date(),
    });

    return { recorded: true, view };
};

const ProfileView = mongoose.model("ProfileView", profileViewSchema);

export default ProfileView;
