import { getEmailHeader, getEmailFooter, wrapEmailContent } from '../emailHelpers.js';

/**
 * Newsletter Subscription Confirmation Email Template
 * Sent to subscriber when they subscribe to newsletter
 */
export const newsletterConfirmationTemplate = (data) => {
  const { email, name } = data;
  const frontendUrl = process.env.CLIENT_URL || 'https://karyaa.ae';

  const content = `
    ${getEmailHeader('Welcome to Karyaa Newsletter! 📧')}
    <div class="email-body">
      <h2>Thank You for Subscribing!</h2>
      
      <p>Hi${name ? ` ${name}` : ''}! 👋</p>
      
      <p>You've successfully subscribed to the Karyaa newsletter. Get ready to receive:</p>
      
      <div class="success-box">
        <p><strong>✅ Subscription Confirmed!</strong></p>
        <p>Email: <strong>${email}</strong></p>
      </div>

      <h3>What to Expect</h3>
      <ul>
        <li><strong>Event Planning Tips:</strong> Expert advice for your perfect event</li>
        <li><strong>Vendor Spotlights:</strong> Discover amazing service providers</li>
        <li><strong>Exclusive Offers:</strong> Special deals from our vendors</li>
        <li><strong>Industry Trends:</strong> Stay updated with the latest in event planning</li>
      </ul>

      <a href="${frontendUrl}" class="button">Explore Karyaa</a>

      <div class="info-box">
        <p><strong>💡 Manage Your Subscription</strong></p>
        <p>You can unsubscribe at any time by clicking the unsubscribe link in our emails.</p>
      </div>

      <p style="margin-top: 30px;">
        We're excited to have you in our community! 🎉
      </p>
    </div>
    ${getEmailFooter()}
  `;

  return wrapEmailContent(content);
};

/**
 * Admin Newsletter Subscription Alert Template
 * Sent to admin when someone subscribes to newsletter
 */
export const adminNewsletterAlertTemplate = (data) => {
  const { email, name, subscribedAt } = data;

  const content = `
    ${getEmailHeader('📬 New Newsletter Subscription')}
    <div class="email-body">
      <h2>New Newsletter Subscriber</h2>
      
      <p>A new user has subscribed to the Karyaa newsletter.</p>
      
      <div class="info-box">
        <h3>Subscriber Information</h3>
        ${name ? `<p><strong>Name:</strong> ${name}</p>` : ''}
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Subscribed At:</strong> ${new Date(subscribedAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}</p>
      </div>

      <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
        This is an automated notification for newsletter subscription tracking.
      </p>
    </div>
    ${getEmailFooter()}
  `;

  return wrapEmailContent(content);
};
