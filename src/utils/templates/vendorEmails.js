import { getEmailHeader, getEmailFooter, wrapEmailContent, renderTemplate } from '../emailHelpers.js';

/**
 * Vendor Registration Email Template
 * Sent to vendor when they submit their registration
 */
export const vendorRegistrationTemplate = (data) => {
    const { businessName, ownerName, email, referenceId } = data;

    const content = `
    ${getEmailHeader('Karyaa')}
    <div class="email-body">
      <h2>Welcome to Karyaa, ${ownerName}! 👋</h2>
      
      <p>Thank you for registering <strong>${businessName}</strong> with Karyaa, UAE's premier event planning marketplace.</p>
      
      <div class="success-box">
        <p><strong>✅ Your application has been received!</strong></p>
        <p>Reference ID: <strong>${referenceId}</strong></p>
      </p>
      </div>

      <h3>What Happens Next?</h3>
      <ul>
        <li><strong>Review Process:</strong> Our team will review your application and documents within 24-48 hours</li>
        <li><strong>Verification:</strong> We'll verify your business credentials and contact information</li>
        <li><strong>Approval:</strong> Once approved, you'll receive login credentials and can start showcasing your services</li>
      </ul>

      <div class="info-box">
        <p><strong>📧 Your registered email:</strong> ${email}</p>
        <p>You'll receive all updates at this email address.</p>
      </div>

      <h3>Need Help?</h3>
      <p>If you have any questions or need assistance, our support team is here to help!</p>
      
      <a href="mailto:vendors@karyaa.ae" class="button">Contact Vendor Support</a>

      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        <em>Please keep your reference ID (${referenceId}) for future correspondence.</em>
      </p>
    </div>
    ${getEmailFooter()}
  `;

    return wrapEmailContent(content);
};

/**
 * Vendor Approval Email Template
 * Sent to vendor when their application is approved
 */
export const vendorApprovalTemplate = (data) => {
    const { businessName, ownerName, email, dashboardUrl } = data;

    const content = `
    ${getEmailHeader('Congratulations!')}
    <div class="email-body">
      <h2>🎊 Your Vendor Account is Approved!</h2>
      
      <p>Great news, ${ownerName}! We're excited to inform you that <strong>${businessName}</strong> has been approved to join the Karyaa marketplace.</p>
      
      <div class="success-box">
        <p><strong>✅ Your account is now active!</strong></p>
        <p>You can start showcasing your services and connecting with customers right away.</p>
      </div>

      <h3>Getting Started</h3>
      <ul>
        <li><strong>Login:</strong> Use your email (${email}) to access your vendor dashboard</li>
        <li><strong>Complete Profile:</strong> Add your services, packages, and gallery images</li>
        <li><strong>Go Live:</strong> Start receiving enquiries from customers</li>
      </ul>

      <a href="${dashboardUrl}" class="button">Access Your Dashboard</a>

      <h3>Next Steps</h3>
      <div class="info-box">
        <p><strong>1. Upload Gallery Images</strong> - Showcase your best work</p>
        <p><strong>2. Create Packages</strong> - Offer attractive service bundles</p>
        <p><strong>3. Update Profile</strong> - Keep your information current</p>
      </div>

      <p style="margin-top: 30px;">
        Welcome to the Karyaa family! We're here to support your success. 🚀
      </p>
    </div>
    ${getEmailFooter()}
  `;

    return wrapEmailContent(content);
};

/**
 * Vendor Rejection Email Template
 * Sent to vendor when their application is rejected
 */
export const vendorRejectionTemplate = (data) => {
    const { businessName, ownerName, reason } = data;

    const content = `
    ${getEmailHeader('Application Update')}
    <div class="email-body">
      <h2>Update on Your Karyaa Application</h2>
      
      <p>Dear ${ownerName},</p>
      
      <p>Thank you for your interest in joining Karyaa as a vendor with <strong>${businessName}</strong>.</p>
      
      <div class="warning-box">
        <p>After careful review, we are unable to approve your application at this time.</p>
      </div>

      ${reason ? `
        <h3>Reason for Rejection</h3>
        <div class="info-box">
          <p>${reason}</p>
        </div>
      ` : ''}

      <h3>What You Can Do</h3>
      <ul>
        <li><strong>Review Requirements:</strong> Ensure you meet all vendor criteria</li>
        <li><strong>Update Documents:</strong> Provide complete and valid documentation</li>
        <li><strong>Reapply:</strong> You're welcome to submit a new application</li>
      </ul>

      <p>If you believe this decision was made in error or need clarification, please don't hesitate to contact us.</p>
      
      <a href="mailto:vendor@karyaa.ae" class="button">Contact Support</a>

      <p style="margin-top: 30px; color: #666;">
        We appreciate your understanding and wish you the best in your business endeavors.
      </p>
    </div>
    ${getEmailFooter()}
  `;

    return wrapEmailContent(content);
};

/**
 * Vendor Subscription Expired Email Template
 * Sent to vendor when their subscription expires
 */
export const vendorExpiredTemplate = (data) => {
    const { businessName, ownerName, expiryDate, renewalUrl } = data;

    const content = `
    ${getEmailHeader('Subscription Expired')}
    <div class="email-body">
      <h2>⚠️ Your Karyaa Subscription Has Expired</h2>
      
      <p>Dear ${ownerName},</p>
      
      <p>We wanted to inform you that the subscription for <strong>${businessName}</strong> has expired as of ${expiryDate}.</p>
      
      <div class="warning-box">
        <p><strong>Your vendor profile is currently inactive</strong></p>
        <p>Customers cannot view your services or contact you until you renew your subscription.</p>
      </div>

      <h3>What This Means</h3>
      <ul>
        <li>❌ Your profile is hidden from customer searches</li>
        <li>❌ You won't receive new enquiries</li>
        <li>❌ Your packages and gallery are not visible</li>
      </ul>

      <h3>Renew Your Subscription</h3>
      <p>Don't miss out on potential customers! Renew your subscription today to continue showcasing your services.</p>
      
      <a href="${renewalUrl}" class="button">Renew Subscription Now</a>

      <div class="info-box">
        <p><strong>💡 Benefits of Staying Active:</strong></p>
        <ul>
          <li>Continuous visibility to thousands of customers</li>
          <li>Receive enquiries and grow your business</li>
          <li>Build your reputation with reviews and ratings</li>
        </ul>
      </div>

      <p style="margin-top: 30px;">
        Need help with renewal? Our support team is ready to assist you!
      </p>
      
      <a href="mailto:vendor@karyaa.ae">Contact Vendor Support</a>
    </div>
    ${getEmailFooter()}
  `;

    return wrapEmailContent(content);
};

/**
 * Admin Alert - New Vendor Registration
 * Sent to admin when a new vendor registers
 */
export const adminVendorAlertTemplate = (data) => {
    const { businessName, ownerName, email, phoneNumber, referenceId, city, category } = data;

    const content = `
    ${getEmailHeader('New Vendor Registration')}
    <div class="email-body">
      <h2>🔔 New Vendor Application Received</h2>
      
      <p>A new vendor has registered and requires your review.</p>
      
      <div class="info-box">
        <p><strong>Business Name:</strong> ${businessName}</p>
        <p><strong>Owner:</strong> ${ownerName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phoneNumber}</p>
        <p><strong>City:</strong> ${city || 'N/A'}</p>
        <p><strong>Category:</strong> ${category || 'N/A'}</p>
        <p><strong>Reference ID:</strong> ${referenceId}</p>
      </div>

      <h3>Action Required</h3>
      <p>Please review the vendor's application, verify their documents, and approve or reject their registration.</p>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        <em>This is an automated notification from the Karyaa vendor management system.</em>
      </p>
    </div>
    ${getEmailFooter()}
  `;

    return wrapEmailContent(content);
};
