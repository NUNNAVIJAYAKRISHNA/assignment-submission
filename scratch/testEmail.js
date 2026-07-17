const nodemailer = require("nodemailer");
require("dotenv").config();

async function testEmail() {
  console.log("USER:", process.env.EMAIL_USER);
  console.log("PASS:", process.env.EMAIL_PASS ? "PRESENT" : "MISSING");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    await transporter.verify();
    console.log("TRANSPORTER VERIFICATION SUCCESSFUL");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // send to self
      subject: "ClassVault SMTP Test",
      text: "This is a test email from ClassVault setup."
    });

    console.log("EMAIL SENT SUCCESSFUL:", info.messageId);
    process.exit(0);
  } catch (err) {
    console.error("EMAIL SENDING FAILED:", err);
    process.exit(1);
  }
}

testEmail();
