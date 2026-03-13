import crypto from "crypto";

export const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashResetCode = (code) => {
  return crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
};

export const compareResetCode = (plainCode, hashedCode) => {
  const hashedPlainCode = hashResetCode(plainCode);
  return hashedPlainCode === hashedCode;
};