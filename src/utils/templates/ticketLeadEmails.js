import { getEmailHeader, getEmailFooter, wrapEmailContent } from '../emailHelpers.js';

/**
 * Support Ticket Notification Email Template
 * Sent to support when a new ticket is created
 */
export const supportTicketTemplate = (data) => {
  const { ticketId, referenceId, subject, category, priority, description, contactEmail, vendorName, vendorEmail } = data;
  const adminPanelUrl = process.env.ADMIN_PANEL_URL || 'https://karyaa.ae/admin';

  const priorityColors = {
    'Low': '#10b981',
    'Medium': '#f59e0b',
    'High': '#ef4444',
    'Urgent': '#dc2626'
  };

  const priorityColor = priorityColors[priority] || '#6b7280';

  const content = `
    ${getEmailHeader('🎫 New Support Ticket Created')}
    <div class="email-body">
      <h2>New Support Ticket</h2>
      
      <p>A new support ticket has been submitted on Karyaa.</p>
      
      <div class="info-box">
        <h3>Ticket Information</h3>
        <p><strong>Ticket ID:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${referenceId}</code></p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Priority:</strong> <span style="color: ${priorityColor}; font-weight: 600;">${priority}</span></p>
      </div>

      ${vendorName ? `
      <div class="info-box">
        <h3 style="margin-top: 0;">Submitted By (Vendor)</h3>
        <p><strong>Business Name:</strong> ${vendorName}</p>
        <p><strong>Email:</strong> <a href="mailto:${vendorEmail}">${vendorEmail}</a></p>
      </div>
      ` : contactEmail ? `
      <div class="info-box">
        <h3 style="margin-top: 0;">Contact Information</h3>
        <p><strong>Email:</strong> <a href="mailto:${contactEmail}">${contactEmail}</a></p>
      </div>
      ` : ''}

      <h3>Description</h3>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 4px; white-space: pre-wrap;">
        ${description}
      </div>

      <a href="${adminPanelUrl}/support-tickets" class="button">View in Admin Panel</a>

      <div class="warning-box">
        <p><strong>⚠️ Action Required:</strong></p>
        <p>Please review and respond to this ticket based on its priority level.</p>
      </div>
    </div>
    ${getEmailFooter()}
  `;

  return wrapEmailContent(content);
};

/**
 * Vendor Lead Notification Email Template
 * Sent to vendor when they receive a new lead
 */
export const vendorLeadNotificationTemplate = (data) => {
  const { referenceId, fullName, phoneNumber, email, location, eventType, eventDate, numberOfGuests, message, vendorName } = data;
  const frontendUrl = process.env.CLIENT_URL || 'https://karyaa.ae';

  const content = `
    ${getEmailHeader('🎉 New Lead Received!')}
    <div class="email-body">
      <h2>Congratulations, ${vendorName}!</h2>
      
      <p>You have received a new lead through Karyaa. A potential client is interested in your services!</p>
      
      <div class="success-box">
        <p><strong>✅ Lead Reference ID:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${referenceId}</code></p>
      </div>

      <h3>Client Information</h3>
      <div class="info-box">
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Phone:</strong> <a href="tel:${phoneNumber}">${phoneNumber}</a></p>
        ${email ? `<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>` : ''}
        ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
      </div>

      <h3>Event Details</h3>
      <div class="info-box">
        ${eventType ? `<p><strong>Event Type:</strong> ${eventType}</p>` : ''}
        ${eventDate ? `<p><strong>Event Date:</strong> ${new Date(eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
        ${numberOfGuests ? `<p><strong>Number of Guests:</strong> ${numberOfGuests}</p>` : ''}
      </div>

      ${message ? `
      <h3>Client Message</h3>
      <div class="info-box" style="white-space: pre-wrap;">
        ${message}
      </div>
      ` : ''}

      <a href="${frontendUrl}/vendor/dashboard/leads" class="button">View Lead in Dashboard</a>

      <div class="info-box">
        <p><strong>💡 Quick Tip:</strong></p>
        <p>Respond to leads within 24 hours to increase your conversion rate. The faster you respond, the better!</p>
      </div>

      <p style="margin-top: 30px;">
        Good luck with this opportunity! 🎊
      </p>
    </div>
    ${getEmailFooter()}
  `;

  return wrapEmailContent(content);
};

/**
 * Admin Lead Alert Email Template
 * Sent to admin when a new lead is created
 */
export const adminLeadAlertTemplate = (data) => {
  const { referenceId, fullName, phoneNumber, email, location, eventType, eventDate, numberOfGuests, message, vendorName, vendorEmail } = data;
  const adminPanelUrl = process.env.ADMIN_PANEL_URL || 'https://karyaa.ae/admin';

  const content = `
    ${getEmailHeader('📊 New Lead Submitted')}
    <div class="email-body">
      <h2>New Lead Activity</h2>
      
      <p>A new lead has been submitted on the Karyaa platform.</p>
      
      <div class="info-box">
        <h3>Lead Information</h3>
        <p><strong>Reference ID:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${referenceId}</code></p>
        <p><strong>Vendor:</strong> ${vendorName}</p>
        <p><strong>Vendor Email:</strong> <a href="mailto:${vendorEmail}">${vendorEmail}</a></p>
      </div>

      <h3>Client Details</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <tbody>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-weight: 600; background: #f9fafb;">Name</td>
            <td style="padding: 12px;">${fullName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-weight: 600; background: #f9fafb;">Phone</td>
            <td style="padding: 12px;"><a href="tel:${phoneNumber}">${phoneNumber}</a></td>
          </tr>
          ${email ? `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-weight: 600; background: #f9fafb;">Email</td>
            <td style="padding: 12px;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          ` : ''}
          ${location ? `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-weight: 600; background: #f9fafb;">Location</td>
            <td style="padding: 12px;">${location}</td>
          </tr>
          ` : ''}
          ${eventType ? `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-weight: 600; background: #f9fafb;">Event Type</td>
            <td style="padding: 12px;">${eventType}</td>
          </tr>
          ` : ''}
          ${eventDate ? `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-weight: 600; background: #f9fafb;">Event Date</td>
            <td style="padding: 12px;">${new Date(eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
          ` : ''}
          ${numberOfGuests ? `
          <tr>
            <td style="padding: 12px; font-weight: 600; background: #f9fafb;">Guests</td>
            <td style="padding: 12px;">${numberOfGuests}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>

      ${message ? `
      <h3>Message</h3>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 4px; white-space: pre-wrap;">
        ${message}
      </div>
      ` : ''}

      <a href="${adminPanelUrl}/leads-management" class="button">View in Admin Panel</a>

      <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
        This is an automated notification for lead tracking purposes.
      </p>
    </div>
    ${getEmailFooter()}
  `;

  return wrapEmailContent(content);
};
