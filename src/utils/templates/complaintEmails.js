import { getEmailHeader, getEmailFooter, wrapEmailContent } from '../emailHelpers.js';

export const complaintReceivedTemplate = (data) => {
    const { fullName, complaintId } = data;
    const content = `
    ${getEmailHeader('Complaint Received')}
    <div class="email-body">
      <h2>Hello ${fullName},</h2>
      <p>We have received your complaint (ID: <strong>${complaintId}</strong>). Our team will review it and get back to you shortly.</p>
      <p>Thank you for your patience.</p>
    </div>
    ${getEmailFooter()}
  `;
    return wrapEmailContent(content);
};

export const adminComplaintAlertTemplate = (data) => {
    const { fullName, email, phoneNumber, description, complaintId } = data;
    const content = `
    ${getEmailHeader('New Complaint Alert')}
    <div class="email-body">
      <h2>New Complaint Submitted</h2>
      <div class="info-box">
         <p><strong>ID:</strong> ${complaintId}</p>
         <p><strong>Name:</strong> ${fullName}</p>
         <p><strong>Email:</strong> ${email}</p>
         <p><strong>Phone:</strong> ${phoneNumber}</p>
      </div>
      <h3>Description:</h3>
      <p>${description}</p>
      <div class="warning-box">
        <p>Please check the admin panel to manage this complaint.</p>
      </div>
    </div>
    ${getEmailFooter()}
  `;
    return wrapEmailContent(content);
};

export const complaintStatusUpdateTemplate = (data) => {
    const { fullName, status, complaintId } = data;
    const content = `
    ${getEmailHeader('Complaint Status Update')}
    <div class="email-body">
      <h2>Hello ${fullName},</h2>
      <p>The status of your complaint (ID: <strong>${complaintId}</strong>) has been updated to:</p>
      <div class="info-box" style="text-align:center; font-weight:bold; font-size: 1.2em;">
        ${status}
      </div>
      <p>If you have any further questions, please contact our support.</p>
    </div>
    ${getEmailFooter()}
  `;
    return wrapEmailContent(content);
};
