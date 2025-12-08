import { getEmailHeader, getEmailFooter, wrapEmailContent } from '../emailHelpers.js';

/**
 * Referral Confirmation Email Template
 * Sent to referrer when they submit a referral
 */
export const referralConfirmationTemplate = (data) => {
  const { referrerName, referralCode, vendorCount, vendors } = data;
  const frontendUrl = process.env.CLIENT_URL || 'https://karyaa.ae';

  const vendorList = vendors.map(v => `
        <li>
            <strong>${v.fullname}</strong><br/>
            Email: ${v.email}${v.phone ? `<br/>Phone: ${v.phone}` : ''}${v.businessName ? `<br/>Business: ${v.businessName}` : ''}
        </li>
    `).join('');

  const content = `
    ${getEmailHeader('Thank You for Your Referral!')}
    <div class="email-body">
      <h2>Hello ${referrerName}! 👋</h2>
      
      <p>Thank you for referring vendors to <strong>Karyaa</strong>!</p>
      
      <div class="success-box">
        <p><strong>✅ Your referral has been submitted successfully!</strong></p>
        <p>Referral Code: <strong>${referralCode}</strong></p>
        <p>Vendors Referred: <strong>${vendorCount}</strong></p>
      </div>

      <h3>Referred Vendors</h3>
      <ul>
        ${vendorList}
      </ul>

      <div class="info-box">
        <p><strong>📋 What Happens Next?</strong></p>
        <p>Our team will review the referred vendors and reach out to them about joining Karyaa. We'll keep you updated on the progress!</p>
      </div>

      <h3>Why Refer to Karyaa?</h3>
      <ul>
        <li><strong>Help Grow the Community:</strong> Connect great vendors with potential clients</li>
        <li><strong>Support Local Businesses:</strong> Help event service providers expand their reach</li>
        <li><strong>Improve the Platform:</strong> More vendors means better choices for everyone</li>
      </ul>

      <a href="${frontendUrl}" class="button">Visit Karyaa</a>

      <p style="margin-top: 30px;">
        Thank you for helping us grow! 🎉
      </p>
    </div>
    ${getEmailFooter()}
  `;

  return wrapEmailContent(content);
};

/**
 * Admin Referral Alert Email Template
 * Sent to admin when a new referral is submitted
 */
export const adminReferralAlertTemplate = (data) => {
  const { referrerName, referrerEmail, referrerPhone, referralCode, vendorCount, vendors } = data;
  const adminPanelUrl = process.env.CLIENT_URL || 'https://karyaa.ae';

  const vendorList = vendors.map((v, index) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-weight: 500;">${index + 1}</td>
            <td style="padding: 12px;">${v.fullname}</td>
            <td style="padding: 12px;">${v.email}</td>
            <td style="padding: 12px;">${v.phone || 'N/A'}</td>
            <td style="padding: 12px;">${v.businessName || 'N/A'}</td>
        </tr>
    `).join('');

  const content = `
    ${getEmailHeader('🔔 New Vendor Referral Received')}
    <div class="email-body">
      <h2>New Referral Submission</h2>
      
      <p>A new vendor referral has been submitted to Karyaa.</p>
      
      <div class="info-box">
        <h3>Referrer Information</h3>
        <p><strong>Name:</strong> ${referrerName}</p>
        <p><strong>Email:</strong> ${referrerEmail}</p>
        <p><strong>Phone:</strong> ${referrerPhone}</p>
        <p><strong>Referral Code:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${referralCode}</code></p>
        <p><strong>Total Vendors:</strong> ${vendorCount}</p>
      </div>

      <h3>Referred Vendors</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
            <th style="padding: 12px; text-align: left; font-weight: 600;">#</th>
            <th style="padding: 12px; text-align: left; font-weight: 600;">Full Name</th>
            <th style="padding: 12px; text-align: left; font-weight: 600;">Email</th>
            <th style="padding: 12px; text-align: left; font-weight: 600;">Phone</th>
            <th style="padding: 12px; text-align: left; font-weight: 600;">Business Name</th>
          </tr>
        </thead>
        <tbody>
          ${vendorList}
        </tbody>
      </table>

      <a href="${adminPanelUrl}/admin/referral-management" class="button">View in Admin Panel</a>

      <div class="warning-box">
        <p><strong>⚠️ Action Required:</strong></p>
        <p>Please review these referrals and reach out to the vendors to invite them to join Karyaa.</p>
      </div>
    </div>
    ${getEmailFooter()}
  `;

  return wrapEmailContent(content);
};
