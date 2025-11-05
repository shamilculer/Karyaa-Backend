import Idea from "../../models/Idea.model.js";

/**
 * @desc Create a new idea
 * @route POST /api/ideas
 */
export const createIdea = async (req, res) => {
  try {
    // Authentication Check: Ensures only logged-in admins can create ideas
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can create ideas.",
      });
    }

    const { title, description, category, gallery } = req.body;

    // Updated validation check: gallery is required and must be a non-empty array
    if (!title || !description || !category || !Array.isArray(gallery) || gallery.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, description, category, and gallery (must contain at least one image URL).",
      });
    }

    const idea = await Idea.create({
      title,
      description,
      category,
      gallery,
    });

    res.status(201).json({
      success: true,
      data: idea,
      message: "Idea created successfully",
    });
  } catch (error) {
    console.error("Error creating idea:", error);
    // Mongoose validation errors will often be caught here
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create idea",
    });
  }
};

// ----------------------------------------------------------------------

/**
 * @desc Update an existing idea
 * @route PUT /api/ideas/:id
 */
export const updateIdea = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if the user is authorized (e.g., the submittedBy user or an Admin)
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Only admins can update ideas.",
        });
    }
    
    // Use updates directly. Mongoose ignores extra fields and validates existing ones.
    const idea = await Idea.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!idea) {
      return res.status(404).json({
        success: false,
        message: "Idea not found",
      });
    }

    res.status(200).json({
      success: true,
      data: idea,
      message: "Idea updated successfully",
    });
  } catch (error) {
    console.error("Error updating idea:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update idea",
    });
  }
};

// ----------------------------------------------------------------------

/**
 * @desc Delete an idea
 * @route DELETE /api/ideas/:id
 */
export const deleteIdea = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the user is authorized
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Only admins can delete ideas.",
        });
    }

    const idea = await Idea.findByIdAndDelete(id);

    if (!idea) {
      return res.status(404).json({
        success: false,
        message: "Idea not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Idea deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting idea:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete idea",
    });
  }
};
