import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    requestPasswordResetController,
    verifyCodeController,
    resetPasswordController,
    resendCodeController,
} from '../../src/controllers/PasswordResetController.js';

vi.mock('../../src/services/passwordReset.service.js', () => ({
    requestPasswordReset: vi.fn(),
    verifyResetCode: vi.fn(),
    resetPassword: vi.fn(),
    resendCode: vi.fn(),
}));

vi.mock('../../src/db/user.repository.js', () => ({
    findUserByEmailOrNickname: vi.fn(),
}));

import {
    requestPasswordReset,
    verifyResetCode,
    resetPassword,
    resendCode,
} from '../../src/services/passwordReset.service.js';
import { findUserByEmailOrNickname } from '../../src/db/user.repository.js';

const makeRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('requestPasswordResetController', () => {
    beforeEach(() => vi.resetAllMocks());

    it('возвращает 400 если email не передан', async () => {
        const req = { body: {} };
        const res = makeRes();

        await requestPasswordResetController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Email is required' });
    });

    it('возвращает 200 если пользователь не найден (не раскрываем инфо)', async () => {
        findUserByEmailOrNickname.mockResolvedValue(null);

        const req = { body: { email: 'ghost@test.com' } };
        const res = makeRes();

        await requestPasswordResetController(req, res);

        expect(requestPasswordReset).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'If the email exists, a reset code has been sent.' });
    });

    it('отправляет код и возвращает 200 если пользователь найден', async () => {
        const fakeUser = { user_id: 1, email: 'test@test.com' };
        findUserByEmailOrNickname.mockResolvedValue(fakeUser);
        requestPasswordReset.mockResolvedValue();

        const req = { body: { email: 'test@test.com' } };
        const res = makeRes();

        await requestPasswordResetController(req, res);

        expect(requestPasswordReset).toHaveBeenCalledWith(fakeUser);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'If the email exists, a reset code has been sent.' });
    });

    it('возвращает 500 при ошибке', async () => {
        findUserByEmailOrNickname.mockRejectedValue(new Error('DB error'));

        const req = { body: { email: 'test@test.com' } };
        const res = makeRes();

        await requestPasswordResetController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});

describe('verifyCodeController', () => {
    beforeEach(() => vi.resetAllMocks());

    it('возвращает 400 если email или code не переданы', async () => {
        const req = { body: { email: 'test@test.com' } };
        const res = makeRes();

        await verifyCodeController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Email and code are required' });
    });

    it('возвращает 400 если код невалидный', async () => {
        verifyResetCode.mockResolvedValue(false);

        const req = { body: { email: 'test@test.com', code: '000000' } };
        const res = makeRes();

        await verifyCodeController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired code' });
    });

    it('возвращает 200 если код валидный', async () => {
        verifyResetCode.mockResolvedValue(true);

        const req = { body: { email: 'test@test.com', code: '123456' } };
        const res = makeRes();

        await verifyCodeController(req, res);

        expect(verifyResetCode).toHaveBeenCalledWith('test@test.com', '123456');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Code verified successfully' });
    });

    it('возвращает 500 при ошибке', async () => {
        verifyResetCode.mockRejectedValue(new Error('DB error'));

        const req = { body: { email: 'test@test.com', code: '123456' } };
        const res = makeRes();

        await verifyCodeController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});

describe('resetPasswordController', () => {
    beforeEach(() => vi.resetAllMocks());

    it('возвращает 400 если не все поля переданы', async () => {
        const req = { body: { email: 'test@test.com', code: '123456' } };
        const res = makeRes();

        await resetPasswordController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Email, code and new password are required' });
    });

    it('успешно сбрасывает пароль', async () => {
        resetPassword.mockResolvedValue();

        const req = { body: { email: 'test@test.com', code: '123456', newPassword: 'newpass123' } };
        const res = makeRes();

        await resetPasswordController(req, res);

        expect(resetPassword).toHaveBeenCalledWith('test@test.com', '123456', 'newpass123');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Password reset successfully' });
    });

    it('возвращает 400 с сообщением ошибки из сервиса', async () => {
        resetPassword.mockRejectedValue(new Error('Invalid or expired code'));

        const req = { body: { email: 'test@test.com', code: 'bad', newPassword: 'newpass123' } };
        const res = makeRes();

        await resetPasswordController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired code' });
    });
});

describe('resendCodeController', () => {
    beforeEach(() => vi.resetAllMocks());

    it('возвращает 400 если email не передан', async () => {
        const req = { body: {} };
        const res = makeRes();

        await resendCodeController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Email is required' });
    });

    it('возвращает 200 после повторной отправки', async () => {
        resendCode.mockResolvedValue();

        const req = { body: { email: 'test@test.com' } };
        const res = makeRes();

        await resendCodeController(req, res);

        expect(resendCode).toHaveBeenCalledWith('test@test.com');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Reset code resent if email exists' });
    });

    it('возвращает 500 при ошибке', async () => {
        resendCode.mockRejectedValue(new Error('Service error'));

        const req = { body: { email: 'test@test.com' } };
        const res = makeRes();

        await resendCodeController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
});