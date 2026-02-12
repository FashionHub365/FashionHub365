const rateLimit = require('express-rate-limit');

// Gap 2: Stricter rate limiting — 10 requests per 10 minutes, count ALL
const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // 10 requests per window
    skipSuccessfulRequests: false, // Count ALL requests
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 429,
            message: 'Too many requests, please try again later.',
        },
    },
});

module.exports = {
    authLimiter,
};
