import Content from "../../models/Page.model.js";

/**
 * @desc Get all content (Admin)
 * @route GET /api/admin/content
 * @access Private (Admin)
 */
export const getAllContent = async (req, res) => {
    try {
        const { type } = req.query;
        const filter = type ? { type } : {};
        
        const contents = await Content.find(filter)
            .populate('updatedBy', 'name email')
            .sort({ type: 1, key: 1 });
        
        return res.status(200).json({
            success: true,
            count: contents.length,
            data: contents,
        });
    } catch (error) {
        console.error("GET ALL CONTENT ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server Error: Unable to fetch content",
        });
    }
};

/**
 * @desc Get single content by key
 * @route GET /api/admin/content/:key
 * @access Private (Admin)
 */
export const getContentByKey = async (req, res) => {
    try {
        const { key } = req.params;
        
        const content = await Content.findOne({ key })
            .populate('updatedBy', 'name email');
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: `Content not found for key: ${key}`,
            });
        }
        
        return res.status(200).json({
            success: true,
            data: content,
        });
    } catch (error) {
        console.error("GET CONTENT BY KEY ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server Error: Unable to fetch content",
        });
    }
};

/**
 * @desc Get landing page content structure
 * @route GET /api/admin/content/landing-page/structure
 * @access Private (Admin)
 */
export const getLandingPageStructure = async (req, res) => {
    try {
        const sections = [
            'hero-section',
            'why-choose-us',
            'how-it-works',
            'testimonials',
            'cta-sections'
        ];
        
        const contents = await Content.find({ 
            key: { $in: sections },
            type: 'section'
        }).sort({ key: 1 });
        
        // Transform into a structured object
        const structure = {};
        contents.forEach(content => {
            structure[content.key] = content.content;
        });
        
        return res.status(200).json({
            success: true,
            data: structure,
        });
    } catch (error) {
        console.error("GET LANDING PAGE STRUCTURE ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server Error: Unable to fetch landing page structure",
        });
    }
};

/**
 * @desc Create or update content (Admin)
 * @route PUT /api/admin/content/:key
 * @access Private (Admin)
 */
export const upsertContent = async (req, res) => {
    try {
        const { key } = req.params;
        const { type, content } = req.body;
        
        if (!type || !content) {
            return res.status(400).json({
                success: false,
                message: "Type and content are required",
            });
        }
        
        const updated = await Content.findOneAndUpdate(
            { key },
            {
                key,
                type,
                content,
                updatedBy: req.user._id,
            },
            { new: true, upsert: true }
        ).populate('updatedBy', 'name email');
        
        return res.status(200).json({
            success: true,
            message: "Content updated successfully",
            data: updated,
        });
    } catch (error) {
        console.error("UPSERT CONTENT ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server Error: Unable to save content",
        });
    }
};

/**
 * @desc Bulk update multiple sections (for "Save All")
 * @route PUT /api/admin/content/bulk-update
 * @access Private (Admin)
 */
export const bulkUpdateContent = async (req, res) => {
    try {
        const { sections } = req.body; // Array of { key, type, content }
        
        if (!sections || !Array.isArray(sections) || sections.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Sections array is required",
            });
        }
        
        const bulkOps = sections.map(section => ({
            updateOne: {
                filter: { key: section.key },
                update: {
                    key: section.key,
                    type: section.type || 'section',
                    content: section.content,
                    updatedBy: req.user._id,
                },
                upsert: true,
            }
        }));
        
        const result = await Content.bulkWrite(bulkOps);
        
        return res.status(200).json({
            success: true,
            message: "All sections updated successfully",
            data: {
                modified: result.modifiedCount,
                upserted: result.upsertedCount,
            },
        });
    } catch (error) {
        console.error("BULK UPDATE CONTENT ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server Error: Unable to save content",
        });
    }
};

/**
 * @desc Delete content (Admin)
 * @route DELETE /api/admin/content/:key
 * @access Private (Admin)
 */
export const deleteContent = async (req, res) => {
    try {
        const { key } = req.params;
        
        const content = await Content.findOneAndDelete({ key });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: `Content not found for key: ${key}`,
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Content deleted successfully",
            data: content,
        });
    } catch (error) {
        console.error("DELETE CONTENT ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server Error: Unable to delete content",
        });
    }
};



/**
 * @desc Get published landing page (Public)
 * @route GET /api/content/landing-page
 * @access Public
 */
export const getPublishedLandingPage = async (req, res) => {
    try {
        const sections = [
            'hero-section',
            'why-choose-us',
            'how-it-works',
            'testimonials',
            'cta-sections'
        ];
        
        const contents = await Content.getByKeys(sections);
        
        const structure = {};
        contents.forEach(content => {
            structure[content.key] = content.content;
        });
        
        return res.status(200).json({
            success: true,
            data: structure,
        });
    } catch (error) {
        console.error("GET PUBLISHED LANDING PAGE ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server Error: Unable to fetch landing page",
        });
    }
};