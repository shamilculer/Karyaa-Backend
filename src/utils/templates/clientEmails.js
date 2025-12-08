import { getEmailHeader, getEmailFooter, wrapEmailContent } from '../emailHelpers.js';

/**
 * Client (Customer) Welcome Email Template
 * Sent to client when they sign up
 */
export const clientWelcomeTemplate = (data) => {
  const { name, email } = data;
  const frontendUrl = process.env.CLIENT_URL || 'https://karyaa.ae';

  const content = `
    ${getEmailHeader('Welcome to Karyaa!')}
    <div class="email-body">
      <h2>Hello ${name}! 👋</h2>
      
      <p>Welcome to <strong>Karyaa</strong>, UAE's premier event planning marketplace!</p>
      
      <div class="success-box">
        <p><strong>✅ Your account has been created successfully!</strong></p>
        <p>Email: <strong>${email}</strong></p>
      </div>

      <h3>What You Can Do Now</h3>
      <ul>
        <li><strong>Browse Vendors:</strong> Explore hundreds of verified event service providers</li>
        <li><strong>Compare Services:</strong> Find the perfect match for your event needs</li>
        <li><strong>Send Enquiries:</strong> Connect directly with vendors</li>
        <li><strong>Save Favorites:</strong> Keep track of vendors you love</li>
      </ul>

      <a href="${frontendUrl}" class="button">Start Exploring</a>

      <div class="info-box">
        <p><strong>💡 Pro Tip:</strong></p>
        <p>Use our advanced filters to find vendors by category, location, and budget to make your event planning easier!</p>
      </div>

      <h3>Need Help?</h3>
      <p>If you have any questions or need assistance, our support team is here to help.</p>
      
      <p style="margin-top: 30px;">
        Happy event planning! 🎉
      </p>
    </div>
    ${getEmailFooter()}
  `;

  return wrapEmailContent(content);
};
