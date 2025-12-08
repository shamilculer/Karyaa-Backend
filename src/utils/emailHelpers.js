/**
 * Email Template Renderer
 * Provides utilities for rendering email templates with dynamic data
 */

/**
 * Replace template variables with actual values
 * @param {string} template - HTML template string
 * @param {object} data - Data object with values
 * @returns {string} Rendered template
 */
export const renderTemplate = (template, data) => {
  let rendered = template;

  // Replace all {{variable}} placeholders
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, data[key] || '');
  });

  return rendered;
};

/**
 * Get base email styles
 * @returns {string} CSS styles for email
 */
export const getEmailStyles = () => `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .email-header {
      background: #1B2648;
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .email-body {
      padding: 30px 20px;
    }
    .email-body h2 {
      color: #1B2648;
      font-size: 22px;
      margin-top: 0;
    }
    .email-body p {
      margin: 15px 0;
      color: #555;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #1B2648;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 600;
    }
    .button:hover {
      background: #D4AF37;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #1B2648;
      padding: 15px;
      margin: 20px 0;
    }
    .warning-box {
      background: #fff3cd;
      border-left: 4px solid #D4AF37;
      padding: 15px;
      margin: 20px 0;
    }
    .success-box {
      background: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 20px 0;
    }
    .email-footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #e9ecef;
    }
    .email-footer a {
      color: #1B2648;
      text-decoration: none;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
  </style>
`;

/**
 * Get email header HTML
 * @param {string} title - Header title
 * @returns {string} Header HTML
 */
export const getEmailHeader = (title) => `
  <div class="email-header">
    <h1>🎉 ${title}</h1>
  </div>
`;

/**
 * Get email footer HTML
 * @returns {string} Footer HTML
 */
export const getEmailFooter = () => {
  const currentYear = new Date().getFullYear();
  const frontendUrl = process.env.FRONTEND_URL || 'https://karyaa.ae';

  return `
    <div class="email-footer">
      <p>
        <strong>Karyaa</strong> - Your Event Planning Marketplace
      </p>
      <p>
        <a href="${frontendUrl}">Visit Website</a> |
        <a href="${frontendUrl}/contact">Contact Support</a> |
        <a href="${frontendUrl}/faq">FAQs</a>
      </p>
      <p style="font-size: 12px; color: #999; margin-top: 15px;">
        © ${currentYear} Karyaa. All rights reserved.
      </p>
    </div>
  `;
};

/**
 * Wrap content in email container
 * @param {string} content - Email content HTML
 * @returns {string} Complete email HTML
 */
export const wrapEmailContent = (content) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Karyaa</title>
    ${getEmailStyles()}
  </head>
  <body>
    <div class="email-container">
      ${content}
    </div>
  </body>
  </html>
`;
