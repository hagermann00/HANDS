---
description: Set up email sending with Nodemailer
---

# Email Setup

## Prerequisites
- Node.js project initialized
- SMTP credentials available

## Steps

// turbo
1. Install Nodemailer:
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

2. Create src/services/email.js:
```javascript
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify connection
transporter.verify((error) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('✓ Email server ready');
  }
});

// Email templates
const templates = {
  welcome: (user) => ({
    subject: 'Welcome to Our App!',
    html: `
      <h1>Welcome, ${user.name}!</h1>
      <p>Thanks for signing up. We're excited to have you.</p>
      <a href="${process.env.APP_URL}/dashboard">Get Started</a>
    `
  }),
  
  resetPassword: (user, resetToken) => ({
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset</h1>
      <p>Hi ${user.name},</p>
      <p>You requested a password reset. Click below to reset:</p>
      <a href="${process.env.APP_URL}/reset-password?token=${resetToken}">
        Reset Password
      </a>
      <p>This link expires in 1 hour.</p>
    `
  }),
  
  notification: (user, message) => ({
    subject: 'New Notification',
    html: `
      <h1>Hi ${user.name}</h1>
      <p>${message}</p>
      <a href="${process.env.APP_URL}">View Details</a>
    `
  })
};

// Send email function
async function sendEmail({ to, template, data }) {
  const { subject, html } = templates[template](data);
  
  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
}

// Send raw email
async function sendRawEmail({ to, subject, html, text }) {
  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html,
    text
  };
  
  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail, sendRawEmail };
```

3. Usage:
```javascript
const { sendEmail } = require('./services/email');

// Send welcome email
await sendEmail({
  to: user.email,
  template: 'welcome',
  data: user
});

// Send password reset
await sendEmail({
  to: user.email,
  template: 'resetPassword',
  data: { user, resetToken }
});
```

4. Add to .env:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourapp.com
APP_NAME=Your App Name
APP_URL=https://yourapp.com
```

## Success Criteria
- Transporter configured
- Templates working
- Emails delivered successfully
