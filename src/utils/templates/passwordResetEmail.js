export const passwordResetTemplate = (data) => {
    const { name, resetUrl, expiryMinutes } = data;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                background: #1B2648;
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .content {
                padding: 40px 30px;
            }
            .button {
                display: inline-block;
                padding: 14px 32px;
                background: #1B2648;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: 600;
                text-align: center;
            }
            .button:hover {
                background: #D4AF37;
                opacity: 1;
            }
            .warning {
                color: #856404;
                background-color: #fff3cd;
                padding: 16px;
                border-radius: 6px;
                border-left: 4px solid #D4AF37;
                margin: 20px 0;
            }
            .warning strong {
                display: block;
                margin-bottom: 8px;
            }
            .warning ul {
                margin: 8px 0;
                padding-left: 20px;
            }
            .warning li {
                margin: 4px 0;
            }
            .link-box {
                background-color: #f8f9fa;
                padding: 12px;
                border-radius: 4px;
                word-break: break-all;
                font-size: 12px;
                color: #666;
                margin: 10px 0;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hi <strong>${name}</strong>,</p>
                <p>We received a request to reset your password for your Karyaa account. Click the button below to create a new password:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <div class="link-box">${resetUrl}</div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Information:</strong>
                    <ul>
                        <li>This link will expire in <strong>${expiryMinutes} minutes</strong></li>
                        <li>If you didn't request this password reset, please ignore this email</li>
                        <li>Your password won't change until you create a new one using the link above</li>
                        <li>Never share this link with anyone</li>
                    </ul>
                </div>
                
                <p>If you're having trouble with the button above, copy and paste the URL into your web browser.</p>
                
                <p>Best regards,<br><strong>The Karyaa Team</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>&copy; ${new Date().getFullYear()} Karyaa. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
