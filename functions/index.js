const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const cors = require("cors")({origin: true});

// Configure SMTP (credentials stored securely in Firebase Config)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: functions.config().smtp.username,
    pass: functions.config().smtp.password,
  },
});

exports.sendApprovalEmail = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    if (req.method !== "POST") {
      return res.status(400).send("Only POST requests allowed");
    }

    const {toEmail, lecturerName, date, time} = req.body;

    const sendEmail = async () => {
      try {
        await transporter.sendMail({
          from: `"University System" <${functions.config().smtp.username}>`,
          to: toEmail,
          subject: "Appointment Approved",
          html: `
            <div style="font-family: Arial, sans-serif; 
                 max-width: 600px; margin: 0 auto; 
                 padding: 20px; border: 1px solid #e0e0e0; 
                 border-radius: 5px;">
              <h2 style="color: #2c3e50; text-align: center;">
                Appointment Confirmation
              </h2>
              <p>Dear Student,</p>
              <p>Your appointment with <strong>${lecturerName}</strong> 
                 has been approved.</p>
              
              <div style="background: #f8f9fa; padding: 15px; 
                   border-left: 4px solid #3498db; margin: 15px 0;">
                <p><b>Date:</b> ${date}</p>
                <p><b>Time:</b> ${time}</p>
              </div>

              <p>Please bring any necessary materials and arrive 5 minutes early.</p>
              <p style="color: #7f8c8d; font-size: 0.9em; 
                 text-align: center; margin-top: 20px;">
                © ${new Date().getFullYear()} University System. All rights reserved.
              </p>
            </div>
          `,
        });

        res.status(200).json({success: true});
      } catch (error) {
        console.error("Failed to send email:", error);
        res.status(500).json({error: "Failed to send email"});
      }
    };

    sendEmail();
  });
});