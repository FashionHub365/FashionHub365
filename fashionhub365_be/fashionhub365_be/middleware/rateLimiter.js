const rateLimit = require('express-rate-limit');

// Gap 2: Stricter rate limiting — 10 requests per 10 minutes, count ALL
const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // 10 requests per window
    skipSuccessfulRequests: false, // Count ALL requests
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        console.warn(`[RATE LIMIT EXCEEDED - AUTH] IP: ${req.ip} | Method: ${req.method} | Path: ${req.originalUrl} | Body:`, req.body);
        res.status(options.statusCode).send(options.message);
    },
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
    handler: (req, res, next, options) => {
        console.warn(`[RATE LIMIT EXCEEDED - FORGOT PWD] IP: ${req.ip} | Method: ${req.method} | Path: ${req.originalUrl} | Body:`, req.body);
        res.status(options.statusCode).send(options.message);
    },
    message: {
        success: false,
        error: {
            code: 429,
            message: 'Too many password reset requests from this IP and email. Please try again later.',
        },
    },
});

const verificationEmailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyGenerator: (req, res) => {
        const email = req.body && req.body.email ? req.body.email.toLowerCase() : '';
        return email ? `${req.ip}_${email}` : req.ip;
    },
    handler: (req, res, next, options) => {
        console.warn(`[RATE LIMIT EXCEEDED - VERIFY EMAIL] IP: ${req.ip} | Method: ${req.method} | Path: ${req.originalUrl} | Body:`, req.body);
        res.status(options.statusCode).send(options.message);
    },
    message: {
        success: false,
        error: {
            code: 429,
            message: 'Too many verification email requests from this IP and email. Please try again later.',
        },
    },
});

const googleAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    skipSuccessfulRequests: true,
    handler: (req, res, next, options) => {
        console.warn(`[RATE LIMIT EXCEEDED - GOOGLE] IP: ${req.ip} | Method: ${req.method} | Path: ${req.originalUrl} | Body:`, req.body);
        res.status(options.statusCode).send(options.message);
    },
    message: {
        success: false,
        error: {
            code: 429,
            message: 'Too many Google login attempts, please try again after 15 minutes.',
        },
    },
});

module.exports = {
    authLimiter,
    forgotPasswordLimiter,
    googleAuthLimiter,
    verificationEmailLimiter,
};
