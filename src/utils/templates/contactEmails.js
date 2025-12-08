import { getEmailHeader, getEmailFooter, wrapEmailContent } from '../emailHelpers.js';

/**
 * Contact Form Submission Email Template
 * Sent to support when someone submits the contact form
 */
export const contactFormTemplate = (data) => {
  const { name, email, phone, subject, message } = data;

  const content = `
    ${getEmailHeader('📬 New Contact Form Submission')}
    <div class="email-body">
      <h2>New Contact Form Submission</h2>
      
      <p>You have received a new message through the Karyaa contact form.</p>
      
      <div class="info-box">
        <h3>Contact Information</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
      </div>

      <h3>Message</h3>
      <div class="info-box" style="white-space: pre-wrap;">
        ${message}
      </div>

      <div class="warning-box">
        <p><strong>⚠️ Action Required:</strong></p>
        <p>Please respond to this inquiry as soon as possible.</p>
      </div>

      <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
        This email was sent from the Karyaa contact form. To reply, please use the email address provided above.
      </p>
    </div>
    ${getEmailFooter()}
  `;

  return wrapEmailContent(content);
};
