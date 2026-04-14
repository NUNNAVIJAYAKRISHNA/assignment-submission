import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }

});
export const sendVerificationEmail = async (email, token) => {
  const verificationLink =
    `${process.env.BASE_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your email",
    html: `
      <h3>Email Verification</h3>
      <p>Click the link below to verify your account:</p>
      <a href="${verificationLink}">
        Verify Email
      </a>
      <p>This link expires in 1 hour.</p>
    `
  });

};