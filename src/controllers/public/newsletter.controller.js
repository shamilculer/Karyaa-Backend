import { sendEmail } from "../../services/email.service.js";
import NewsletterSubscriber from "../../models/NewsletterSubscriber.model.js";

/**
 * @description Handles newsletter subscription by sending confirmation emails
 * @route POST /api/newsletter/subscribe
 * @access Public
 */
export const subscribeToNewsletter = async (req, res) => {
    try {
        const { email, name } = req.body;

        // Validation
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email address is required.",
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

        // Save subscriber to database
        try {
            await NewsletterSubscriber.create({ email, name: name || '' });
        } catch (dbError) {
            // Duplicate key error — email already subscribed
            if (dbError.code === 11000) {
                return res.status(200).json({
                    success: true,
                    message: "You're already subscribed to our newsletter!",
                });
            }
            throw dbError;
        }

        // Send emails
        try {
            const emailData = {
                email,
                name: name || '',
                subscribedAt: new Date(),
            };

            // Send confirmation email to subscriber (from newsletter@karyaa.ae)
            await sendEmail({
                to: email,
                template: 'newsletter-confirmation',
                data: emailData,
                senderType: 'newsletter', // Use newsletter sender
            });

            // Send alert to admin
            await sendEmail({
                template: 'admin-newsletter-alert',
                data: emailData,
            });

            console.log(`✅ Newsletter subscription emails sent for ${email}`);
        } catch (emailError) {
            console.error("Error sending newsletter emails:", emailError);
            // Subscriber is saved — don't fail the whole request over email errors
        }

        res.status(200).json({
            success: true,
            message: "Thank you for subscribing! Please check your email for confirmation.",
        });

    } catch (error) {
        console.error("Error processing newsletter subscription:", error);

        res.status(500).json({
            success: false,
            message: "An error occurred while processing your subscription.",
        });
    }
};
