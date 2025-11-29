import IdeaCategory from "../../models/IdeaCategory.model.js";
import Idea from "../../models/Idea.model.js";

/**
 * @desc Get all ideas (optionally filter by category, or search) with pagination
 * @route GET /api/ideas
 * @query page, limit, category, search
 */
export const getIdeas = async (req, res) => {
    try {
        const { category, search } = req.query; 
        
        // Pagination Parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build query object
        const query = {};

        // Category Filter - look up by name
        if (category && category.trim() !== "") {
            const categoryDoc = await IdeaCategory.findOne({ 
                name: category.trim() 
            });
            
            if (categoryDoc) {
                query.category = categoryDoc._id;
            } else {
                // Category not found, return empty results
                return res.status(200).json({
                    success: true,
                    data: [],
                    pagination: {
                        totalCount: 0,
                        totalPages: 0,
                        currentPage: page,
                        limit: limit,
                    },
                });
            }
        }

        // Search Filter
        if (search && search.trim() !== "") {
            query.$or = [
                { title: { $regex: search.trim(), $options: "i" } },
                { description: { $regex: search.trim(), $options: "i" } },
            ];
        }

        // Get total count for pagination
        const totalCount = await Idea.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        // Fetch ideas with pagination
        const ideas = await Idea.find(query)
            .populate("category", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Return success response
        res.status(200).json({
            success: true,
            data: ideas,
            pagination: {
                totalCount,
                totalPages,
                currentPage: page,
                limit: limit,
            },
        });
    } catch (error) {
        console.error("Error fetching ideas:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch ideas.",
        });
    }
};

export const getIdeaCategories = async (req, res) => {
    try {
        const categories = await IdeaCategory.find({})
            .sort({ displayOrder: 1, name: 1 }) 

        res.status(200).json({
            success: true,
            data: categories,
            count: categories.length,
        });
    } catch (error) {
        console.error("Error fetching idea categories:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch idea categories.",
        });
    }
};