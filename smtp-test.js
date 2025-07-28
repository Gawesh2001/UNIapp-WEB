const nodemailer = require('nodemailer');
require('dotenv').config();

// 1. Configure transporter
const transporter = nodemailer.createTransport({
  host: process.env.REACT_APP_SMTP_HOST,
  port: parseInt(process.env.REACT_APP_SMTP_PORT),
  secure: process.env.REACT_APP_SMTP_SECURE === 'true',
  auth: {
    user: process.env.REACT_APP_SMTP_USERNAME,
    pass: process.env.REACT_APP_SMTP_PASSWORD,
  },
});

// 2. Test connection
async function testConnection() {
  try {
    await transporter.verify();
    console.log("✅ SMTP Connection Successful");
    console.log(`Host: ${process.env.REACT_APP_SMTP_HOST}:${process.env.REACT_APP_SMTP_PORT}`);
    
    // 3. Optional: Send test email
    await sendTestEmail();
  } catch (error) {
    console.error("❌ SMTP Connection Failed:", error.message);
    if (error.code === 'EAUTH') {
      console.log("🔒 Authentication Error - Check your username/password");
    }
  }
}

// 4. Test email function
async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: `"Test Sender" <${process.env.REACT_APP_SMTP_FROM}>`,
      to: process.env.REACT_APP_SMTP_FROM, // Send to yourself
      subject: 'SMTP Test Email',
      text: 'This is a test email from your SMTP configuration',
      html: '<b>If you see this, your SMTP is working!</b>'
    });
    
    console.log(`📧 Test email sent! Message ID: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Email Sending Failed:", error.message);
  }
}

// Run the test
testConnection();