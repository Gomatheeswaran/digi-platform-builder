import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email: string, otp: string, purpose: "register" | "login" | "reset") {
  const subject =
    purpose === "register"
      ? "Verify your email — App Platform"
      : purpose === "reset"
      ? "Password Reset OTP — App Platform"
      : "Login OTP — App Platform";

  const bodyText =
    purpose === "register"
      ? "Thanks for signing up! Verify your email to get started."
      : purpose === "reset"
      ? "We received a request to reset your password. Use the OTP below to proceed."
      : "Use this OTP to log in to your account.";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1677ff; margin-bottom: 8px;">App Platform</h2>
      <p style="color: #555; margin-bottom: 24px;">${bodyText}</p>
      <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #888; font-size: 14px; margin: 0 0 8px;">Your one-time password</p>
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1677ff;">${otp}</span>
        <p style="color: #888; font-size: 12px; margin: 12px 0 0;">Valid for 10 minutes</p>
      </div>
      ${purpose === "reset" ? '<p style="color: #e53e3e; font-size: 13px;">If you did not request a password reset, please ignore this email or contact support immediately.</p>' : ""}
      <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    html,
  });
}
