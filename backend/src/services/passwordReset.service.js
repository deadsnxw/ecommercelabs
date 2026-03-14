import {
  createResetCode,
  deleteOldResetCodes,
  findValidResetCode,
  markResetCodeAsUsed
} from "../db/password.repository.js";
import { generateResetCode, hashResetCode, compareResetCode } from "../utils/resetCode.util.js";
import { sendPasswordResetCode } from "./email.service.js";
import { findUserByEmailOrNickname, updateUser } from "../db/user.repository.js";
import { hashPassword } from "../utils/auth.utils.js";
import { logger } from "../utils/logger.js";

export const requestPasswordReset = async (user) => {
  const code = generateResetCode();
  const codeHash = hashResetCode(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await deleteOldResetCodes(user.user_id);
  await createResetCode({ userId: user.user_id, codeHash, expiresAt });
  logger.info("Password reset requested", { userId: user.user_id, email: user.email });
  await sendPasswordResetCode(user.email, code);
};

export const verifyResetCode = async (email, code) => {
  const user = await findUserByEmailOrNickname(email);
  if (!user) return false;
  const resetEntry = await findValidResetCode(user.user_id);
  if (!resetEntry) return false;
  const isValid = compareResetCode(code, resetEntry.code_hash);
  if (!isValid) return false;
  if (resetEntry.expires_at < new Date()) return false;
  return true;
};

export const resetPassword = async (email, code, newPassword) => {
  const user = await findUserByEmailOrNickname(email);
  if (!user) throw new Error("User not found");
  const resetEntry = await findValidResetCode(user.user_id);
  if (!resetEntry) throw new Error("No reset code found");
  const isValid = compareResetCode(code, resetEntry.code_hash);
  if (!isValid || resetEntry.expires_at < new Date()) {
    throw new Error("Invalid or expired code");
  }
  const newHashedPassword = await hashPassword(newPassword);
  await updateUser(user.user_id, { password_hash: newHashedPassword });
  await markResetCodeAsUsed(resetEntry.id);
  logger.info("Password reset successfully", { userId: user.user_id });
};

export const resendCode = async (email) => {
  const user = await findUserByEmailOrNickname(email);
  if (!user) throw new Error("User not found");
  await requestPasswordReset(user);
};