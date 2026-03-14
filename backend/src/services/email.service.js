import { Resend } from "resend";
import { logger } from "../utils/logger.js";

let resend = null;

const getResend = () => {
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
};

export const sendPasswordResetCode = async (email, code) => {
    logger.info("Sending password reset code", { email });
    try {
        const result = await getResend().emails.send({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Password reset code",
            html: `...`,
        });
        logger.info("Password reset code sent", { email, resendId: result?.id });
        return result;
    } catch (error) {
        logger.error("Resend email error", { email, error: error.message, stack: error.stack });
        throw error;
    }
};
