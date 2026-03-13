import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetCode = async (email, code) => {
  console.log("📨 Sending reset code to:", email, "code:", code);

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

    console.log("✅ RESEND RESULT:", result);

    return result;
  } catch (error) {
    console.error("❌ RESEND ERROR:", error);
    throw error;
  }
};