import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import { config } from '../config/environment.js';

// ─────────────────────────────────────────────
// SMTP Transporter — configured via server/.env
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: config.email.host,       // e.g. smtp.gmail.com
  port: Number(config.email.port), // e.g. 587
  secure: Number(config.email.port) === 465, // true for port 465, false for 587
  auth: {
    user: config.email.user,     // your email address
    pass: config.email.pass      // your App Password (not the regular password)
  }
});

// Verify SMTP connection on startup
transporter.verify((error) => {
  if (error) {
    logger.error(`Email SMTP connection failed: ${error.message}`);
  } else {
    logger.info(`Email SMTP ready — sending from: ${config.email.user}`);
  }
});

export const sendInvitationEmail = async (email, name, token) => {
  const invitationLink = `${config.clientUrl}/accept-invitation?token=${token}`;

  // Always log the link in the console for dev tracing
  logger.info(`\n=== INVITATION LINK ===\nTO: ${email}\nURL: ${invitationLink}\n=======================\n`);

  const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #6b21a8; border-bottom: 2px solid #6b21a8; padding-bottom: 10px;">Welcome to the Platform, ${name}!</h2>
      <p style="font-size: 16px; line-height: 1.5;">You have been invited by the Administrator to join our User Management System.</p>
      <p style="font-size: 16px; line-height: 1.5;">Click the button below to set your password and activate your account.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${invitationLink}" style="background-color: #6b21a8; color: white; text-decoration: none; padding: 12px 30px; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 16px;">Set Password &amp; Join</a>
      </div>
      <p style="font-size: 14px; color: #666;">This invitation expires in 24 hours.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #999;">If the button doesn't work, paste this link in your browser:</p>
      <p style="font-size: 12px; word-break: break-all; color: #6b21a8;">${invitationLink}</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Platform Support" <${config.email.from || config.email.user}>`,
      to: email,
      subject: 'You have been invited to the Platform',
      html: htmlContent
    });
    logger.info(`Email sent successfully to: ${email} — Message ID: ${info.messageId}`);
  } catch (error) {
    logger.error(`Failed to send email to ${email}: ${error.message}`);
  }

  return invitationLink;
};
