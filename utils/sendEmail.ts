import nodemailer from "nodemailer";
import dns from "dns";

// Force Node.js to prefer IPv4 DNS resolution first to bypass cloud IPv6 unreachable issues (e.g. Render)
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const baseUrl = process.env.BASE_URL || (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  if (!baseUrl) {
    throw new Error("Please define the BASE_URL environment variable inside your environment configuration.");
  }
  const verificationLink = `${baseUrl}/verify-email?token=${token}`;
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
