import Ticket from "../../models/Ticket.model.js";
import Vendor from "../../models/Vendor.model.js";

/**
 * @route   POST /support-tickets
 * @desc    Create a new support ticket (Vendor or Guest)
 * @access  Protected (Vendor)
 */
export const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, description, contactEmail } = req.body;

    // Validate required fields (backend-level)
    if (!subject || !category || !priority || !description) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields (subject, category, priority, description).",
      });
    }

    // If vendor is authenticated (via middleware)
    let submittedBy = null;
    if (req.user && req.user.role === "vendor") {
      const vendor = await Vendor.findById(req.user.id).select("_id email");
      if (vendor) {
        submittedBy = vendor._id;
      }
    }

    const ticket = await Ticket.create({
      subject,
      category,
      priority,
      description,
      contactEmail: contactEmail || "",
      submittedBy,
    });

    return res.status(201).json({
      success: true,
      message: "Your support ticket has been successfully created.",
      data: ticket,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating support ticket.",
    });
  }
};
