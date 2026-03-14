import { Resend } from "resend";
import { logger } from "../utils/logger.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetCode = async (email, code) => {
  logger.info("Sending password reset code", { email });
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Password reset code",
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>Password Reset</h2>
          <p>Your confirmation code is:</p>
          <h1>${code}</h1>
          <p>The code is valid for <b>10 minutes</b>.</p>
          <p>If you didn't request a password reset, you can ignore this email.</p>
        </div>
      `,
    });
    logger.info("Password reset code sent", { email, resendId: result?.id });
    return result;
  } catch (error) {
    logger.error("Resend email error", { email, error: error.message, stack: error.stack });
    throw error;
  }
};