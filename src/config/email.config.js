import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Configuration
 * Supports multiple email providers and sender addresses
 */

// Create reusable transporter
const createTransporter = () => {
    const config = {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    };

    // Add service-specific configuration
    if (process.env.EMAIL_SERVICE) {
        config.service = process.env.EMAIL_SERVICE;
    }

    return nodemailer.createTransport(config);
};

// Initialize transporter
let transporter;

try {
    transporter = createTransporter();

    // Verify connection on startup
    transporter.verify((error, success) => {
        if (error) {
            console.error('❌ Email server connection failed:');
            console.error('   Error:', error.message);
            console.error('   Please check your SMTP settings in .env file');
        } else {
            console.log('✅ Email server is ready to send messages');
        }
    });
} catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
}

/**
 * Get sender email configuration based on type
 * @param {string} senderType - Type of sender (noreply, vendor)
 * @returns {object} Sender configuration
 */
export const getSenderConfig = (senderType = 'noreply') => {
    const senderMap = {
        noreply: {
            email: process.env.EMAIL_NOREPLY || 'no-reply@karyaa.ae',
            name: process.env.EMAIL_NOREPLY_NAME || 'Karyaa',
        },
        vendor: {
            email: process.env.EMAIL_VENDOR || 'vendor@karyaa.ae',
            name: process.env.EMAIL_VENDOR_NAME || 'Karyaa Vendor Team',
        },
    };

    return senderMap[senderType] || senderMap.noreply;
};

/**
 * Verify email transporter connection
 */
export const verifyEmailConnection = async () => {
    if (!transporter) {
        throw new Error('Email transporter not initialized');
    }

    try {
        await transporter.verify();
        console.log('✅ Email server connection verified');
        return true;
    } catch (error) {
        console.error('❌ Email server connection failed:', error);
        return false;
    }
};

export default transporter;
