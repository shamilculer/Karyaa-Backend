import { getEmailHeader, getEmailFooter, wrapEmailContent } from '../emailHelpers.js';

/**
 * Bundle Enquiry Email Template
 * Sent to vendor when they inquire about a bundle
 */
export const bundleEnquiryTemplate = (data) => {
  const { vendorName, vendorEmail, vendorPhone, bundleName, bundlePrice, bundleFeatures } = data;
  const frontendUrl = process.env.CLIENT_URL || 'https://karyaa.ae';

  const content = `
    ${getEmailHeader('Thank You for Your Interest! 📦')}
    <div class="email-body">
      <h2>Hello ${vendorName}!</h2>
      
      <p>Thank you for your interest in our <strong>${bundleName}</strong> bundle. We're excited to help you grow your business with Karyaa!</p>
      
      <div class="success-box">
        <p><strong>✅ Enquiry Received!</strong></p>
        <p>Our team will review your request and get back to you shortly.</p>
      </div>

      <h3>Bundle Details</h3>
      <div class="info-box">
        <p><strong>Bundle Name:</strong> ${bundleName}</p>
        <p><strong>Price:</strong> AED ${bundlePrice}/Month</p>
      </div>

      ${bundleFeatures && bundleFeatures.length > 0 ? `
      <h3>Features Included</h3>
      <ul style="list-style: none; padding: 0;">
        ${bundleFeatures.map(feature => `
          <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #D4AF37; margin-right: 8px;">✓</span>${feature}
          </li>
        `).join('')}
      </ul>
      ` : ''}

      <h3>Your Contact Information</h3>
      <div class="info-box">
        <p><strong>Email:</strong> ${vendorEmail}</p>
        ${vendorPhone ? `<p><strong>Phone:</strong> ${vendorPhone}</p>` : ''}
      </div>

      <a href="${frontendUrl}/vendor/bundles" class="button">View All Bundles</a>

      <div class="info-box">
        <p><strong>💡 What's Next?</strong></p>
        <p>Our team will contact you within 24-48 hours to discuss your requirements and help you get started with the perfect bundle for your business.</p>
      </div>

      <p style="margin-top: 30px;">
        If you have any immediate questions, feel free to reply to this email or contact our support team.
      </p>
    </div>
    ${getEmailFooter()}
  `;

  return wrapEmailContent(content);
};

/**
 * Admin Bundle Enquiry Alert Template
 * Sent to admin when a vendor inquires about a bundle
 */
export const adminBundleEnquiryAlertTemplate = (data) => {
  const { vendorName, vendorEmail, vendorPhone, bundleName, bundlePrice, vendorId } = data;
  const adminPanelUrl = process.env.CLIENT_URL || 'https://karyaa.ae';

  const content = `
    ${getEmailHeader('📦 New Bundle Enquiry')}
    <div class="email-body">
      <h2>New Bundle Enquiry Received</h2>
      
      <p>A vendor has expressed interest in a bundle package.</p>
      
      <div class="info-box">
        <h3>Vendor Information</h3>
        <p><strong>Business Name:</strong> ${vendorName}</p>
        <p><strong>Email:</strong> <a href="mailto:${vendorEmail}">${vendorEmail}</a></p>
        ${vendorPhone ? `<p><strong>Phone:</strong> <a href="tel:${vendorPhone}">${vendorPhone}</a></p>` : ''}
      </div>

      <h3>Bundle Details</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <tbody>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-weight: 600; background: #f9fafb;">Bundle Name</td>
            <td style="padding: 12px;">${bundleName}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: 600; background: #f9fafb;">Price</td>
            <td style="padding: 12px;">AED ${bundlePrice}/Month</td>
          </tr>
        </tbody>
      </table>

      <a href="${adminPanelUrl}/admin/vendor-management/${vendorId}" class="button">View Vendor Profile</a>

      <div class="warning-box">
        <p><strong>⚠️ Action Required:</strong></p>
        <p>Please contact this vendor within 24-48 hours to discuss their bundle requirements.</p>
      </div>

      <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
        This is an automated notification for bundle enquiry tracking.
      </p>
    </div>
    ${getEmailFooter()}
  `;

  return wrapEmailContent(content);
};
