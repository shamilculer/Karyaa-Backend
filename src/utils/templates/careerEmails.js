import { getEmailHeader, getEmailFooter, wrapEmailContent } from '../emailHelpers.js';

/**
 * Email sent to the applicant confirming their application was received.
 */
export const careerApplicationConfirmationTemplate = (data) => {
    const { firstName, jobTitle, applicationId } = data;
    const content = `
    ${getEmailHeader('Application Received')}
    <div class="email-body">
      <h2>Hello ${firstName},</h2>
      <p>Thank you for applying to <strong>${jobTitle}</strong> at Karyaa. We have successfully received your application.</p>
      <div class="info-box">
        <p><strong>Application ID:</strong> ${applicationId}</p>
        <p><strong>Position:</strong> ${jobTitle}</p>
      </div>
      <p>Our team will carefully review your application and get back to you as soon as possible. We appreciate your interest in joining Karyaa!</p>
      <div class="success-box">
        <p>Please save your Application ID for future reference. You may be asked to provide it if you contact us about your application.</p>
      </div>
      <p>In the meantime, feel free to explore more about us on our website.</p>
    </div>
    ${getEmailFooter()}
  `;
    return wrapEmailContent(content);
};

/**
 * Email sent to the careers team with full applicant details.
 */
export const adminCareerApplicationAlertTemplate = (data) => {
    const {
        firstName, lastName, email, mobile,
        jobTitle, applicationId,
        gender, dateOfBirth, nationality,
        currentCity, country,
        currentJobTitle, currentEmployer, availableToStart,
        linkedin, adminPanelUrl,
    } = data;

    const content = `
    ${getEmailHeader('New Job Application')}
    <div class="email-body">
      <h2>New Application Received</h2>
      <div class="info-box">
        <p><strong>Application ID:</strong> ${applicationId}</p>
        <p><strong>Position Applied:</strong> ${jobTitle}</p>
      </div>

      <h3 style="color:#1B2648; border-bottom:1px solid #e9ecef; padding-bottom:8px;">Applicant Details</h3>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr><td style="padding:6px 0; color:#555; width:40%;">Full Name:</td><td style="padding:6px 0; font-weight:600;">${firstName} ${lastName}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Email:</td><td style="padding:6px 0;">${email}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Mobile:</td><td style="padding:6px 0;">${mobile || '-'}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Gender:</td><td style="padding:6px 0;">${gender || '-'}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Date of Birth:</td><td style="padding:6px 0;">${dateOfBirth || '-'}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Nationality:</td><td style="padding:6px 0;">${nationality || '-'}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Current City:</td><td style="padding:6px 0;">${currentCity || '-'}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Country:</td><td style="padding:6px 0;">${country || '-'}</td></tr>
      </table>

      <h3 style="color:#1B2648; border-bottom:1px solid #e9ecef; padding-bottom:8px; margin-top:20px;">Professional Details</h3>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr><td style="padding:6px 0; color:#555; width:40%;">Current Job Title:</td><td style="padding:6px 0;">${currentJobTitle || '-'}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Current Employer:</td><td style="padding:6px 0;">${currentEmployer || '-'}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Available to Start:</td><td style="padding:6px 0;">${availableToStart || '-'}</td></tr>
        ${linkedin ? `<tr><td style="padding:6px 0; color:#555;">LinkedIn:</td><td style="padding:6px 0;"><a href="${linkedin}" style="color:#1B2648;">${linkedin}</a></td></tr>` : ''}
      </table>

      <div class="warning-box" style="margin-top:24px;">
        <p>Please log in to the admin panel to review the full application, download attachments, and update the status.</p>
        ${adminPanelUrl ? `<a href="${adminPanelUrl}" style="display:inline-block;margin-top:8px;padding:10px 24px;background:#1B2648;color:#fff;text-decoration:none;border-radius:4px;font-weight:600;">View in Admin Panel</a>` : ''}
      </div>
    </div>
    ${getEmailFooter()}
  `;
    return wrapEmailContent(content);
};
