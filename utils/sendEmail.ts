import nodemailer from "nodemailer";
import dns from "dns";

// Force Node.js to prefer IPv4 DNS resolution first to bypass cloud IPv6 unreachable issues (e.g. Render/Vercel)
dns.setDefaultResultOrder("ipv4first");

const getTransporter = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      connectionTimeout: 5000,
      socketTimeout: 5000,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    connectionTimeout: 5000,
    socketTimeout: 5000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

async function dispatchEmail(email: string, subject: string, htmlContent: string): Promise<void> {
  let smtpErrorDetail: string | null = null;
  let brevoErrorDetail: string | null = null;
  let resendErrorDetail: string | null = null;

  // 1. PRIORITY 1: Primary Nodemailer SMTP (Gmail or custom SMTP)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      console.log(`Attempting primary email dispatch via Nodemailer SMTP for subject "${subject}"...`);
      const sender = process.env.EMAIL_USER;
      await getTransporter().sendMail({
        from: `ClassVault <${sender}>`,
        to: email,
        subject,
        html: htmlContent
      });
      console.log(`[Nodemailer SMTP] Email sent successfully to ${email}`);
      return;
    } catch (smtpErr: any) {
      smtpErrorDetail = smtpErr.message || String(smtpErr);
      console.warn("Nodemailer SMTP dispatch failed, trying fallback services:", smtpErr);
    }
  }

  // 2. FALLBACK 1: Brevo (API Key or SMTP Relay Key)
  const brevoApiKey = process.env.BREVO_API_KEY || process.env.BREV0_API_KEY;
  if (brevoApiKey) {
    const senderEmail = process.env.EMAIL_USER || "vijayakrishna.n213@gmail.com";
    
    // If key is an SMTP Relay Key (starts with xsmtpsib-)
    if (brevoApiKey.startsWith("xsmtpsib-")) {
      try {
        console.log("Attempting fallback email dispatch via Brevo SMTP Relay...");
        const brevoTransporter = nodemailer.createTransport({
          host: "smtp-relay.brevo.com",
          port: 587,
          secure: false,
          connectionTimeout: 5000,
          socketTimeout: 5000,
          auth: {
            user: senderEmail,
            pass: brevoApiKey
          }
        });

        await brevoTransporter.sendMail({
          from: `ClassVault <${senderEmail}>`,
          to: email,
          subject,
          html: htmlContent
        });

        console.log(`[Brevo SMTP Relay] Email sent successfully to ${email}`);
        return;
      } catch (err: any) {
        brevoErrorDetail = err.message || String(err);
        console.warn("Brevo SMTP Relay dispatch failed:", err);
      }
    } else {
      // If key is a REST API Key (starts with xkeysib-)
      try {
        console.log("Attempting fallback email dispatch via Brevo REST API...");
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": brevoApiKey
          },
          body: JSON.stringify({
            sender: { name: "ClassVault", email: senderEmail },
            to: [{ email }],
            subject,
            htmlContent
          })
        });

        if (res.ok) {
          console.log(`[Brevo API] Email sent successfully to ${email}`);
          return;
        }

        brevoErrorDetail = await res.text();
        console.warn(`Brevo API dispatch failed (${res.status}): ${brevoErrorDetail}`);
      } catch (err: any) {
        brevoErrorDetail = err.message || String(err);
        console.warn("Brevo API fetch threw exception:", err);
      }
    }
  }

  // 3. FALLBACK 2: Resend API if configured
  if (process.env.RESEND_API_KEY) {
    const fromAddress = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || "ClassVault <onboarding@resend.dev>";
    try {
      console.log("Attempting fallback email dispatch via Resend API...");
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: fromAddress,
          to: email,
          subject,
          html: htmlContent
        })
      });

      if (res.ok) {
        console.log(`[Resend API] Email sent successfully to ${email}`);
        return;
      }

      resendErrorDetail = await res.text();
      console.warn(`Resend API dispatch failed (${res.status}): ${resendErrorDetail}`);
    } catch (err: any) {
      resendErrorDetail = err.message || String(err);
      console.warn("Resend API fetch threw exception:", err);
    }
  }

  // If all attempted options failed
  const errors = [
    smtpErrorDetail ? `Nodemailer SMTP (${smtpErrorDetail})` : null,
    brevoErrorDetail ? `Brevo (${brevoErrorDetail})` : null,
    resendErrorDetail ? `Resend (${resendErrorDetail})` : null
  ].filter(Boolean).join("; ");

  if (errors) {
    throw new Error(`Failed to send email. Details: ${errors}`);
  }

  throw new Error("No email sending configuration found. Please set EMAIL_USER/EMAIL_PASS, BREVO_API_KEY, or RESEND_API_KEY.");
}

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const baseUrl = process.env.BASE_URL || (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  if (!baseUrl) {
    throw new Error("Please define the BASE_URL environment variable inside your environment configuration.");
  }
  const verificationLink = `${baseUrl}/verify-email?token=${token}`;

  const htmlContent = `
    <h3>Email Verification</h3>
    <p>Click the link below to verify your account:</p>
    <a href="${verificationLink}">
      Verify Email
    </a>
    <p>This link expires in 1 hour.</p>
  `;

  await dispatchEmail(email, "Verify your email", htmlContent);
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const baseUrl = process.env.BASE_URL || (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  if (!baseUrl) {
    throw new Error("Please define the BASE_URL environment variable inside your environment configuration.");
  }
  const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  const htmlContent = `
    <h3>Reset Your Password</h3>
    <p>We received a request to reset your ClassVault account password.</p>
    <p>Click the link below to set a new password:</p>
    <a href="${resetLink}">
      Reset Password
    </a>
    <p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>
  `;

  await dispatchEmail(email, "Reset Your ClassVault Password", htmlContent);
};
