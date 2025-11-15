import Content from "../models/Page.model.js";

/**
 * @desc Get content by key (Public)
 * @route GET /api/content/:key
 * @access Public
 */
export const getContentByKey = async (req, res) => {

    try {
        const { key } = req.params;
        const content = await Content.findOne({ key });

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
 * @desc Get multiple contents by keys (Public)
 * @route POST /api/content/bulk
 * @access Public
 */
export const getBulkContent = async (req, res) => {

    try {
        const { keys } = req.body;

        if (!Array.isArray(keys) || keys.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Keys array is required",
            });
        }

        const contents = await Content.find({ key: { $in: keys } });

        return res.status(200).json({
            success: true,
            data: contents,
        });
    } catch (error) {
        console.error("GET BULK CONTENT ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server Error: Unable to fetch contents",
        });
    }
};