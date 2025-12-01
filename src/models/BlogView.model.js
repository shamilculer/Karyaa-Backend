import mongoose, { Schema } from "mongoose";

const BlogViewSchema = new Schema(
    {
        blog: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Blog",
            required: true,
            index: true,
        },
        ipAddress: {
            type: String,
            required: true,
        },
        userAgent: {
            type: String,
        },
        viewedAt: {
            type: Date,
            default: Date.now,
            expires: 86400, // Document will be automatically deleted after 24 hours
        },
    },
    { timestamps: true }
);

// Compound index to quickly check if an IP has viewed a specific blog
BlogViewSchema.index({ blog: 1, ipAddress: 1 });

const BlogView = mongoose.model("BlogView", BlogViewSchema);

export default BlogView;
