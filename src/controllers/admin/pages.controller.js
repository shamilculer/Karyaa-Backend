import Content from "../../models/Page.model.js";

/**
 * @desc Get all content (Admin)
 * @route GET /api/admin/content
 * @access Private (Admin)
 */
export const getAllContent = async (req, res) => {
    try {
        const { type } = req.query; // Optional filter by type
        const filter = type ? { type } : {};

        const contents = await Content.find(filter).sort({ type: 1, key: 1 });

        return res.status(200).json({
            success: true,
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
        );

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
        });
    } catch (error) {
        console.error("DELETE CONTENT ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server Error: Unable to delete content",
        });
    }
};