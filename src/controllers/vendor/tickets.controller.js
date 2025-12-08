import Ticket from "../../models/Ticket.model.js";
import Vendor from "../../models/Vendor.model.js";
import { sendEmail } from "../../services/email.service.js";

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
    let vendorData = null;
    if (req.user && req.user.role === "vendor") {
      const vendor = await Vendor.findById(req.user.id).select("_id email businessName");
      if (vendor) {
        submittedBy = vendor._id;
        vendorData = {
          vendorName: vendor.businessName,
          vendorEmail: vendor.email,
        };
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

    // Send email notification to support
    try {
      await sendEmail({
        template: 'support-ticket',
        data: {
          ticketId: ticket._id,
          referenceId: ticket.referenceId,
          subject,
          category,
          priority,
          description,
          contactEmail,
          ...vendorData,
        },
      });

      console.log(`✅ Support ticket email sent for ${ticket.referenceId}`);
    } catch (emailError) {
      // Log error but don't fail ticket creation
      console.error("Error sending support ticket email:", emailError);
    }

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
