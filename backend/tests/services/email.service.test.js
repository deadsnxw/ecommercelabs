import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.hoisted(() => vi.fn());

vi.mock('resend', () => ({
    Resend: class {
        constructor() {
            this.emails = { send: mockSend };
        }
    },
}));

import { sendPasswordResetCode } from '../../src/services/email.service.js';

beforeEach(() => {
    vi.resetAllMocks();
});

describe('sendPasswordResetCode', () => {
    it('отправляет письмо с кодом через resend', async () => {
        mockSend.mockResolvedValueOnce({ id: 'email-123' });

        const result = await sendPasswordResetCode('test@test.com', '123456');

        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            to: 'test@test.com',
            subject: 'Password reset code',
            html: expect.stringContaining('123456'),
        }));
        expect(result).toEqual({ id: 'email-123' });
    });

    it('письмо содержит срок действия кода', async () => {
        mockSend.mockResolvedValueOnce({ id: 'email-456' });

        await sendPasswordResetCode('test@test.com', '999999');

        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            html: expect.stringContaining('10 minutes'),
        }));
    });

    it('пробрасывает ошибку если resend упал', async () => {
        mockSend.mockRejectedValueOnce(new Error('Resend API error'));

        await expect(sendPasswordResetCode('test@test.com', '123456'))
            .rejects.toThrow('Resend API error');
    });
});