const LEVELS = ['error', 'warn', 'info', 'debug'];

const log = (level, message, extra = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...extra,
    };
    process.stdout.write(JSON.stringify(entry) + '\n');
};

export const logger = {
    info:  (message, extra) => log('INFO',  message, extra),
    warn:  (message, extra) => log('WARN',  message, extra),
    error: (message, extra) => log('ERROR', message, extra),
    debug: (message, extra) => log('DEBUG', message, extra),
};