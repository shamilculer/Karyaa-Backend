# Email Notification System - Environment Variables

## Required Environment Variables for cPanel SMTP

Add these variables to your `.env` file in the `server` directory:

```env
# ============================================
# EMAIL CONFIGURATION (cPanel SMTP)
# ============================================

# Leave EMAIL_SERVICE empty for custom SMTP (cPanel)
EMAIL_SERVICE=

# cPanel SMTP Configuration
EMAIL_HOST=mail.karyaa.ae                   # Your cPanel mail server (usually mail.yourdomain.com)
EMAIL_PORT=465                              # 465 for SSL, 587 for TLS
EMAIL_SECURE=true                           # true for port 465 (SSL), false for port 587 (TLS)
EMAIL_USER=vendor@karyaa.ae                # Your full email address
EMAIL_PASSWORD=your_email_password          # Your email account password

# ============================================
# SENDER EMAIL ADDRESSES
# ============================================
# Note: With cPanel, you can use different email addresses as senders
# Make sure these email accounts exist in your cPanel

# Vendor-related emails (registration, approval, rejection, expiration)
EMAIL_VENDOR=vendor@karyaa.ae
EMAIL_VENDOR_NAME=Karyaa Vendor Team

# Support emails (help, assistance)
EMAIL_SUPPORT=support@karyaa.ae
EMAIL_SUPPORT_NAME=Karyaa Support

# Admin emails (internal notifications)
EMAIL_ADMIN=admin@karyaa.ae
EMAIL_ADMIN_NAME=Karyaa Admin

# No-reply emails (automated notifications)
EMAIL_NOREPLY=noreply@karyaa.ae
EMAIL_NOREPLY_NAME=Karyaa

# Marketing emails (newsletters, promotions)
EMAIL_MARKETING=marketing@karyaa.ae
EMAIL_MARKETING_NAME=Karyaa Marketing

# ============================================
# ADMIN NOTIFICATIONS
# ============================================

# Email address to receive admin alerts (new vendor registrations, etc.)
ADMIN_EMAIL=admin@karyaa.ae

# ============================================
# APPLICATION URLS
# ============================================

# Frontend URL (for email links)
FRONTEND_URL=https://karyaa.ae

# Admin panel URL (for admin notification links)
ADMIN_PANEL_URL=https://karyaa.ae/admin
```

## cPanel SMTP Setup Instructions

### 1. Create Email Accounts in cPanel

1. **Login to cPanel**
2. **Go to Email Accounts**
3. **Create the following email accounts:**
   - `vendor@karyaa.ae`
   - `support@karyaa.ae`
   - `admin@karyaa.ae`
   - `noreply@karyaa.ae`
   - `marketing@karyaa.ae` (optional)

### 2. Find Your Mail Server Settings

1. **In cPanel**, go to **Email Accounts**
2. **Click "Connect Devices"** next to any email account
3. **Note the settings:**
   - **Incoming Server**: Usually `mail.yourdomain.com`
   - **Outgoing Server**: Usually `mail.yourdomain.com`
   - **Ports**: 465 (SSL) or 587 (TLS)

### 3. Configure .env File

```env
# For SSL (Port 465) - Recommended
EMAIL_SERVICE=
EMAIL_HOST=mail.karyaa.ae
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=vendor@karyaa.ae
EMAIL_PASSWORD=your_password_here

# OR for TLS (Port 587)
EMAIL_SERVICE=
EMAIL_HOST=mail.karyaa.ae
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=vendor@karyaa.ae
EMAIL_PASSWORD=your_password_here
```

## How the Sender System Works

### Dynamic Sender Selection

The system automatically selects the appropriate sender email based on the email type:

```javascript
// Example: Sending vendor registration email
await sendEmail({
  to: 'newvendor@example.com',
  template: 'vendor-registration',
  data: vendorData,
  // senderType is automatically set to 'vendor' from template config
});
// This will send from: vendor@karyaa.ae
```

### Template-Based Email Sending

Instead of separate functions for each email type, we use a single `sendEmail()` function with templates:

```javascript
// Old approach (removed):
await sendVendorRegistrationEmail(data);
await sendVendorApprovalEmail(data);
await sendVendorRejectionEmail(data);

// New approach (current):
await sendEmail({ to, template: 'vendor-registration', data });
await sendEmail({ to, template: 'vendor-approval', data });
await sendEmail({ to, template: 'vendor-rejection', data });
```

### Available Templates

| Template Name | Sender Type | Subject |
|--------------|-------------|---------|
| `vendor-registration` | vendor@ | Welcome to Karyaa - Application Received |
| `vendor-approval` | vendor@ | Congratulations! Your Account is Approved |
| `vendor-rejection` | vendor@ | Update on Your Application |
| `vendor-expired` | vendor@ | Your Subscription Has Expired |
| `admin-vendor-alert` | admin@ | New Vendor Registration - {BusinessName} |

### Override Sender (Optional)

You can override the default sender for any email:

```javascript
await sendEmail({
  to: 'customer@example.com',
  template: 'vendor-registration',
  data: vendorData,
  senderType: 'support', // Override to send from support@karyaa.ae
});
```

## Testing

1. **Start the server**: `npm run dev`
2. **Check email configuration**:
   - Server should log: `✅ Email server connection verified`
   - If not, check your SMTP settings

3. **Test with vendor registration**:
   - Register a new vendor
   - Check console for: `✅ Email sent to...`
   - Check inbox (and spam folder)

4. **Test status updates**:
   - Approve/reject a vendor in admin panel
   - Verify appropriate email is sent

## Troubleshooting

### Emails not sending?

1. **Check console logs** for specific error messages
2. **Verify cPanel email accounts exist**
3. **Test SMTP credentials** using an email client (Outlook, Thunderbird)
4. **Check firewall settings** - ensure ports 465/587 are open
5. **Verify EMAIL_HOST** matches your cPanel mail server

### Connection refused errors?

- **Port 465**: Set `EMAIL_SECURE=true`
- **Port 587**: Set `EMAIL_SECURE=false`
- **Check if your hosting provider blocks outgoing SMTP**

### Authentication errors?

- **Verify EMAIL_USER** is the full email address
- **Verify EMAIL_PASSWORD** is correct
- **Check if 2FA is enabled** on the email account

## Production Recommendations

1. **Use SSL (Port 465)** for better security
2. **Set up SPF records** in cPanel DNS zone
3. **Set up DKIM** in cPanel for better deliverability
4. **Monitor email logs** in cPanel
5. **Set up email forwarding** for admin@ to your personal email
6. **Consider email queue** (Bull/Redis) for high volume

## Adding New Email Templates

To add a new email template:

1. **Create template function** in `vendorEmails.js`
2. **Add to EMAIL_TEMPLATES** in `email.service.js`:

```javascript
const EMAIL_TEMPLATES = {
  // ... existing templates
  'new-enquiry': {
    template: newEnquiryTemplate,
    subject: 'New Enquiry Received',
    senderType: 'vendor',
  },
};
```

3. **Use in controllers**:

```javascript
await sendEmail({
  to: vendor.email,
  template: 'new-enquiry',
  data: { customerName, message, ... },
});
```

## Email Events Implemented

- ✅ **Vendor Registration** - Sent to vendor + admin alert
- ✅ **Vendor Approval** - Sent to vendor
- ✅ **Vendor Rejection** - Sent to vendor
- ✅ **Vendor Subscription Expired** - Sent to vendor
