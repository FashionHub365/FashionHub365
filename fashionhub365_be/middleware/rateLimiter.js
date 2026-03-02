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

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 3, // max 3 requests per hour per IP + Email
    keyGenerator: (req, res) => {
        // If email is provided in body, combine IP and email to form a unique key
        // Otherwise fallback to IP
        const email = req.body && req.body.email ? req.body.email.toLowerCase() : '';
        return email ? `${req.ip}_${email}` : req.ip;
    },
    message: {
        success: false,
        error: {
            code: 429,
            message: 'Too many password reset requests from this IP and email. Please try again later.',
        },
    },
});

module.exports = {
    authLimiter,
    forgotPasswordLimiter
};
