import { requestPasswordReset, verifyResetCode, resetPassword, resendCode } from "../services/passwordReset.service.js";
import { findUserByEmailOrNickname } from "../db/user.repository.js";

export const requestPasswordResetController = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  
  try {
    const user = await findUserByEmailOrNickname(email);

    if (!user) {
      return res.status(200).json({ message: "If the email exists, a reset code has been sent." });
    }
    
    await requestPasswordReset(user);
    return res.status(200).json({ message: "If the email exists, a reset code has been sent." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyCodeController = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: "Email and code are required" });

  try {
    const isValid = await verifyResetCode(email, code);
    if (!isValid) return res.status(400).json({ message: "Invalid or expired code" });

    return res.status(200).json({ message: "Code verified successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPasswordController = async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ message: "Email, code and new password are required" });

  try {
    await resetPassword(email, code, newPassword);
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};

export const resendCodeController = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    await resendCode(email);
    return res.status(200).json({ message: "Reset code resent if email exists" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};