import { sendEmail } from '../../services/email.service.js';

/**
 * Test Email Sending
 * @route POST /api/v1/test/send-email
 * @access Public (for testing only - remove in production)
 */
export const sendTestEmail = async (req, res) => {
    const { to, template, name, email } = req.body;

    if (!to) {
        return res.status(400).json({
            success: false,
            message: 'Recipient email address is required',
        });
    }

    try {
        // Default to client-welcome template if not specified
        const emailTemplate = template || 'client-welcome';

        const result = await sendEmail({
            to,
            template: emailTemplate,
            data: {
                name: name || 'Test User',
                email: email || to,
            },
        });

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: `Test email sent successfully to ${to}`,
                messageId: result.messageId,
                response: result.response,
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to send test email',
                error: result.error,
            });
        }
    } catch (error) {
        console.error('Test email error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending test email',
            error: error.message,
        });
    }
};

/**
 * Send Custom Test Email
 * @route POST /api/v1/test/send-custom-email
 * @access Public (for testing only - remove in production)
 */
export const sendCustomTestEmail = async (req, res) => {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || !html) {
        return res.status(400).json({
            success: false,
            message: 'Recipient, subject, and html content are required',
        });
    }

    try {
        const result = await sendEmail({
            to,
            subject,
            html,
            text: text || '',
        });

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: `Custom test email sent successfully to ${to}`,
                messageId: result.messageId,
                response: result.response,
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to send custom test email',
                error: result.error,
            });
        }
    } catch (error) {
        console.error('Custom test email error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending custom test email',
            error: error.message,
        });
    }
};

/**
 * Check Email Configuration
 * @route GET /api/v1/test/email-config
 * @access Public (for testing only - remove in production)
 */
export const checkEmailConfig = async (req, res) => {
    try {
        const config = {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true',
            user: process.env.EMAIL_USER,
            noreplyEmail: process.env.EMAIL_NOREPLY,
            vendorEmail: process.env.EMAIL_VENDOR,
            // Don't expose password
            passwordSet: !!process.env.EMAIL_PASSWORD,
        };

        return res.status(200).json({
            success: true,
            message: 'Email configuration',
            config,
        });
    } catch (error) {
        console.error('Email config check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking email configuration',
            error: error.message,
        });
    }
};
