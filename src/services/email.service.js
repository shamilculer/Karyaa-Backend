import transporter, { getSenderConfig } from '../config/email.config.js';
import {
    vendorRegistrationTemplate,
    vendorApprovalTemplate,
    vendorRejectionTemplate,
    vendorExpiredTemplate,
    adminVendorAlertTemplate,
} from '../utils/templates/vendorEmails.js';
import { clientWelcomeTemplate } from '../utils/templates/clientEmails.js';

/**
 * Email Service
 * Global service for sending emails across the application
 */

// Template mapping
const EMAIL_TEMPLATES = {
    'vendor-registration': {
        template: vendorRegistrationTemplate,
        subject: 'Welcome to Karyaa - Application Received',
        senderType: 'noreply',
    },
    'vendor-approval': {
        template: vendorApprovalTemplate,
        subject: 'Congratulations! Your Karyaa Vendor Account is Approved',
        senderType: 'noreply',
    },
    'vendor-rejection': {
        template: vendorRejectionTemplate,
        subject: 'Update on Your Karyaa Vendor Application',
        senderType: 'noreply',
    },
    'vendor-expired': {
        template: vendorExpiredTemplate,
        subject: '⚠️ Your Karyaa Subscription Has Expired',
        senderType: 'noreply',
    },
    'admin-vendor-alert': {
        template: adminVendorAlertTemplate,
        subject: (data) => `New Vendor Registration - ${data.businessName}`,
        senderType: 'noreply',
        recipientOverride: () => process.env.EMAIL_VENDOR || 'vendor@karyaa.ae',
    },
    'client-welcome': {
        template: clientWelcomeTemplate,
        subject: 'Welcome to Karyaa! 🎉',
        senderType: 'noreply',
    },
};

/**
 * Unified email sending function
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.template - Template name (e.g., 'vendor-registration', 'vendor-approval')
 * @param {object} options.data - Data to populate template
 * @param {string} options.senderType - Override sender type (optional)
 * @param {string} options.subject - Override subject (optional)
 * @returns {Promise<object>} Send result
 */
export const sendEmail = async (options) => {
    const { to, template: templateName, data = {}, senderType: customSenderType, subject: customSubject } = options;

    if (!transporter) {
        console.error('Email transporter not initialized');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        let html, subject, senderType, recipient;

        // If template name is provided, use predefined template
        if (templateName && EMAIL_TEMPLATES[templateName]) {
            const templateConfig = EMAIL_TEMPLATES[templateName];
            html = templateConfig.template(data);
            subject = typeof templateConfig.subject === 'function'
                ? templateConfig.subject(data)
                : templateConfig.subject;
            senderType = customSenderType || templateConfig.senderType;

            // Check if template has recipient override (for admin notifications)
            recipient = templateConfig.recipientOverride
                ? (typeof templateConfig.recipientOverride === 'function'
                    ? templateConfig.recipientOverride(data)
                    : templateConfig.recipientOverride)
                : to;
        }
        // Otherwise, expect custom HTML and subject
        else if (options.html && customSubject) {
            html = options.html;
            subject = customSubject;
            senderType = customSenderType || 'noreply';
            recipient = to;
        }
        else {
            console.error('Either template name or custom html+subject must be provided');
            return { success: false, error: 'Invalid email configuration' };
        }

        if (!recipient) {
            console.error('Recipient email is required');
            return { success: false, error: 'Recipient email is required' };
        }

        const sender = getSenderConfig(senderType);

        const mailOptions = {
            from: `"${sender.name}" <${sender.email}>`,
            to: recipient,
            subject,
            html,
            text: options.text || '', // Plain text fallback
            attachments: options.attachments || [],
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Email sent to ${recipient}`);
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);

        return {
            success: true,
            messageId: info.messageId,
            response: info.response,
        };
    } catch (error) {
        console.error(`❌ Failed to send email to ${recipient || to}:`);
        console.error(`   Error: ${error.message}`);
        if (error.code) console.error(`   Code: ${error.code}`);
        if (error.command) console.error(`   Command: ${error.command}`);

        return {
            success: false,
            error: error.message,
            code: error.code,
        };
    }
};

/**
 * Send bulk emails
 * @param {array} recipients - Array of recipient objects with { email, template, data }
 * @param {number} delayMs - Delay between emails in milliseconds (default: 100)
 * @returns {Promise<array>} Array of send results
 */
export const sendBulkEmails = async (recipients, delayMs = 100) => {
    const results = [];

    for (const recipient of recipients) {
        const result = await sendEmail({
            to: recipient.email,
            template: recipient.template,
            data: recipient.data,
            senderType: recipient.senderType,
        });

        results.push({
            email: recipient.email,
            ...result,
        });

        // Add delay to avoid rate limiting
        if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    return results;
};

/**
 * Helper function to prepare vendor data for emails
 * @param {object} vendor - Vendor object
 * @returns {object} Formatted vendor data
 */
export const prepareVendorData = (vendor) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://karyaa.ae';
    const adminPanelUrl = process.env.ADMIN_PANEL_URL || 'https://karyaa.ae/admin';

    return {
        email: vendor.email,
        businessName: vendor.businessName,
        ownerName: vendor.ownerName,
        referenceId: vendor.referenceId,
        phoneNumber: vendor.phoneNumber,
        _id: vendor._id,
        address: vendor.address,
        mainCategory: vendor.mainCategory,
        subscriptionEndDate: vendor.subscriptionEndDate,
        dashboardUrl: `${frontendUrl}/vendor/dashboard`,
        renewalUrl: `${frontendUrl}/vendor/subscription`,
        reviewUrl: `${adminPanelUrl}/vendors/${vendor._id}`,
        city: vendor.address?.city,
        category: Array.isArray(vendor.mainCategory)
            ? vendor.mainCategory.map(cat => cat.name || cat).join(', ')
            : vendor.mainCategory,
        expiryDate: vendor.subscriptionEndDate
            ? new Date(vendor.subscriptionEndDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
            : 'recently',
    };
};
