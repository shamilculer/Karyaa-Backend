import { sendEmail } from "../../services/email.service.js";

/**
 * @description Handles contact form submission by sending email to support
 * @route POST /api/contact/new
 * @access Public
 */
export const submitContactForm = async (req, res) => {
    try {
        const { fullname, email, phone, subject, message } = req.body;

        // Validation
        if (!fullname || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and message are required fields.",
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

        // Send email to support
        try {
            await sendEmail({
                template: 'contact-form',
                data: {
                    name: fullname,
                    email,
                    phone,
                    subject,
                    message,
                },
            });

            console.log(`✅ Contact form email sent from ${email}`);
        } catch (emailError) {
            console.error("Error sending contact form email:", emailError);
            return res.status(500).json({
                success: false,
                message: "Failed to send your message. Please try again later.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Thank you for contacting us! We'll get back to you soon.",
        });

    } catch (error) {
        console.error("Error processing contact form:", error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: `Validation failed: ${messages.join(' ')}`,
            });
        }

        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request.",
        });
    }
};
