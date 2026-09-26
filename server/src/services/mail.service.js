import nodemailer from 'nodemailer';
import env from '../config/env.js';

const transporter = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  : null;

/** Sends the password-reset OTP. Without SMTP config it is printed to the console. */
export async function sendOtpEmail(to, otp) {
  if (!transporter) {
    console.log(`[mail] SMTP not configured. Password reset OTP for ${to}: ${otp}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject: 'Your StockSense password reset code',
      text: `Your StockSense password reset code is ${otp}. It expires in ${env.otpTtlMinutes} minutes.`,
    });
  } catch (err) {
    console.error(`[mail] Could not send OTP email to ${to}: ${err.message}`);
    console.log(`[mail] Password reset OTP for ${to}: ${otp}`);
  }
}
