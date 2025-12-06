import mongoose from "mongoose";

const pageSEOSchema = new mongoose.Schema(
    {
        pageIdentifier: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true, // e.g., 'home', 'about', 'contact'
        },
        route: {
            type: String,
            trim: true, // e.g., '/', '/about-us' - useful for generating sitemaps later
        },
        metaTitle: {
            type: String,
            trim: true,
        },
        metaDescription: {
            type: String,
            trim: true,
        },
        metaKeywords: {
            type: [String],
            default: [],
        },
        ogImage: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

const PageSEO = mongoose.models.PageSEO || mongoose.model("PageSEO", pageSEOSchema);

export default PageSEO;
