import nodemailer from "nodemailer";
import dns from "dns";

// Force Node.js to prefer IPv4 DNS resolution first to bypass cloud IPv6 unreachable issues (e.g. Render)
dns.setDefaultResultOrder("ipv4first");

const getTransporter = () => {
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

  const brevoApiKey = process.env.BREVO_API_KEY || process.env.BREV0_API_KEY;
  let brevoErrorDetail: string | null = null;

  // 1. Try Brevo (Recommended for Render - supports both API Key 'xkeysib-' and SMTP Relay 'xsmtpsib-')
  if (brevoApiKey) {
    const senderEmail = process.env.EMAIL_USER || "vijayakrishna.n213@gmail.com";
    
    // If key is an SMTP Relay Key (starts with xsmtpsib-)
    if (brevoApiKey.startsWith("xsmtpsib-")) {
      try {
        console.log("Attempting email dispatch via Brevo SMTP Relay...");
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
          subject: "Verify your email",
          html: htmlContent
        });

        console.log(`[Brevo SMTP Relay] Verification email sent successfully to ${email}`);
        return;
      } catch (err: any) {
        brevoErrorDetail = err.message || String(err);
        console.warn("Brevo SMTP Relay dispatch failed:", err);
      }
    } else {
      // If key is a REST API Key (starts with xkeysib-)
      try {
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
            subject: "Verify your email",
            htmlContent
          })
        });

        if (res.ok) {
          console.log(`[Brevo API] Verification email sent successfully to ${email}`);
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

  let resendErrorDetail: string | null = null;

  // 2. Try Resend API if configured
  if (process.env.RESEND_API_KEY) {
    const fromAddress = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || "ClassVault <onboarding@resend.dev>";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: fromAddress,
          to: email,
          subject: "Verify your email",
          html: htmlContent
        })
      });

      if (res.ok) {
        console.log(`[Resend API] Verification email sent successfully to ${email}`);
        return;
      }

      resendErrorDetail = await res.text();
      console.warn(`Resend API dispatch failed (${res.status}): ${resendErrorDetail}`);
    } catch (err: any) {
      resendErrorDetail = err.message || String(err);
      console.warn("Resend API fetch threw exception:", err);
    }
  }

  // 3. Fallback to standard Nodemailer SMTP (e.g. Gmail) if SMTP credentials are configured
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      console.log("Attempting email dispatch via Nodemailer SMTP fallback...");
      await getTransporter().sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify your email",
        html: htmlContent
      });
      console.log(`[Nodemailer SMTP] Verification email sent successfully to ${email}`);
      return;
    } catch (smtpErr: any) {
      console.error("Nodemailer SMTP fallback failed:", smtpErr);
      const errors = [
        brevoErrorDetail ? `Brevo API (${brevoErrorDetail})` : null,
        resendErrorDetail ? `Resend API (${resendErrorDetail})` : null,
        `SMTP (${smtpErr.message || smtpErr})`
      ].filter(Boolean).join(", ");
      throw new Error(`Failed to send verification email via: ${errors}`);
    }
  }

  if (brevoErrorDetail || resendErrorDetail) {
    throw new Error(`Email dispatch failed. Brevo: ${brevoErrorDetail || "N/A"}, Resend: ${resendErrorDetail || "N/A"}`);
  }

  throw new Error("No email sending configuration found. Please set BREVO_API_KEY, RESEND_API_KEY, or EMAIL_USER/EMAIL_PASS.");
};
