const config = require('../config/config');

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport(config.email.smtp);

/* istanbul ignore next */
if (config.env !== 'test') {
    transporter
        .verify()
        .then(() => console.log('Connected to email server'))
        .catch(() => console.log('Connect to email server failed. Make sure you have configured SMTP options in .env'));
}

const sendEmail = async (to, subject, text) => {
    try {
        const msg = { from: config.email.from, to, subject, text };
        await transporter.sendMail(msg);
        console.log(`[EMAIL] Sent to ${to}`);
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send to ${to}:`, error);
        // Don't throw here to avoid crashing the request, but log it clearly
    }
};

const sendResetPasswordEmail = async (to, token) => {
    const subject = 'Reset password';
    // Replace hardcoded localhost with config url if available
    const resetPasswordUrl = `http://localhost:${config.port}/reset-password?token=${token}`;
    const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
    await sendEmail(to, subject, text);
};

const sendVerificationEmail = async (to, token) => {
    console.log('[DEBUG] Inside sendVerificationEmail for:', to);
    const subject = 'Email Verification';
    // Replace hardcoded localhost with config url if available
    // Point to Frontend URL (Port 3000 assuming default React)
    const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;
    const text = `Dear user,
To verify your email, click on this link: ${verificationUrl}
If you did not create an account, then ignore this email.`;
    await sendEmail(to, subject, text);
};

module.exports = {
    transport: transporter,
    sendEmail,
    sendResetPasswordEmail,
    sendVerificationEmail,
};
