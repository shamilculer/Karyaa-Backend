
import PageSEO from "../../models/PageSEO.model.js";
import Category from "../../models/Category.model.js";
import SubCategory from "../../models/SubCategory.model.js";

// --- Static Pages (PageSEO) ---

export const getAllPageSEO = async (req, res) => {
    try {
        const pages = await PageSEO.find().sort({ pageIdentifier: 1 });
        res.status(200).json({ success: true, data: pages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePageSEO = async (req, res) => {
    try {
        const { pageIdentifier } = req.params;
        const { metaTitle, metaDescription, metaKeywords, ogImage, route } = req.body;

        const pageSEO = await PageSEO.findOneAndUpdate(
            { pageIdentifier },
            {
                metaTitle,
                metaDescription,
                metaKeywords,
                ogImage,
                route
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: pageSEO, message: "SEO updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPageSEOByIdentifier = async (req, res) => {
    try {
        const { identifier } = req.params;
        const pageSEO = await PageSEO.findOne({ pageIdentifier: identifier });

        if (!pageSEO) {
            // Return defaults or 404? 
            // For public API, maybe just return empty or null data is better than error
            return res.status(200).json({ success: true, data: null });
        }

        res.status(200).json({ success: true, data: pageSEO });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Categories SEO ---

export const getAllCategorySEO = async (req, res) => {
    try {
        // Only fetch fields needed for the SEO dashboard
        const categories = await Category.find({})
            .select("name slug metaTitle metaDescription metaKeywords")
            .sort({ name: 1 });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCategorySEO = async (req, res) => {
    try {
        const { id } = req.params;
        const { metaTitle, metaDescription, metaKeywords } = req.body;

        const category = await Category.findByIdAndUpdate(
            id,
            { metaTitle, metaDescription, metaKeywords },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.status(200).json({ success: true, data: category, message: "Category SEO updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- SubCategories SEO ---

export const getAllSubCategorySEO = async (req, res) => {
    try {
        const subCategories = await SubCategory.find({})
            .select("name slug mainCategory metaTitle metaDescription metaKeywords")
            .populate("mainCategory", "name")
            .sort({ name: 1 });
        res.status(200).json({ success: true, data: subCategories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSubCategorySEO = async (req, res) => {
    try {
        const { id } = req.params;
        const { metaTitle, metaDescription, metaKeywords } = req.body;

        const subCategory = await SubCategory.findByIdAndUpdate(
            id,
            { metaTitle, metaDescription, metaKeywords },
            { new: true, runValidators: true }
        );

        if (!subCategory) {
            return res.status(404).json({ success: false, message: "SubCategory not found" });
        }

        res.status(200).json({ success: true, data: subCategory, message: "SubCategory SEO updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
