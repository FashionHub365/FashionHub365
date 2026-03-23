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

const {
    getVerificationEmailTemplate,
    getResetPasswordEmailTemplate,
    getWelcomeEmailTemplate,
    getPasswordChangedEmailTemplate,
    getOrderCreatedEmailTemplate,
    getOrderCancelledEmailTemplate,
} = require('../utils/emailTemplates');

const sendEmail = async (to, subject, html) => {
    try {
        const msg = { from: config.email.from, to, subject, html };
        await transporter.sendMail(msg);
        console.log(`[EMAIL] Sent to ${to}`);
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send to ${to}:`, error);
        // Don't throw here to avoid crashing the request, but log it clearly
    }
};

const sendResetPasswordEmail = async (to, token) => {
    const subject = 'Yêu cầu đặt lại mật khẩu - FashionHub365';
    // Replace hardcoded localhost with config url if available
    const resetPasswordUrl = `${config.frontendUrl || 'http://localhost:3000'}/reset-password?token=${token}`;
    const html = getResetPasswordEmailTemplate(resetPasswordUrl);
    await sendEmail(to, subject, html);
};

const sendVerificationEmail = async (to, token) => {
    console.log('[DEBUG] Inside sendVerificationEmail for:', to);
    const subject = 'Xác thực địa chỉ email - FashionHub365';
    // Replace hardcoded localhost with config url if available
    const verificationUrl = `${config.frontendUrl || 'http://localhost:3000'}/verify-email?token=${token}`;
    const html = getVerificationEmailTemplate(verificationUrl);
    await sendEmail(to, subject, html);
};

const sendWelcomeEmail = async (to) => {
    const subject = 'Chào mừng bạn đến với FashionHub365';
    const html = getWelcomeEmailTemplate();
    await sendEmail(to, subject, html);
};

const sendPasswordChangedConfirmationEmail = async (to) => {
    const subject = 'Mật khẩu của bạn đã được thay đổi';
    const html = getPasswordChangedEmailTemplate();
    await sendEmail(to, subject, html);
};

const sendOrderCreatedEmail = async (to, order) => {
    const subject = `Xác nhận đơn hàng #${order.uuid.substring(0, 8)} - FashionHub365`;
    const html = getOrderCreatedEmailTemplate(order);
    await sendEmail(to, subject, html);
};

const sendOrderCancelledEmail = async (to, order, reason) => {
    const subject = `Đơn hàng #${order.uuid.substring(0, 8)} đã bị hủy - FashionHub365`;
    const html = getOrderCancelledEmailTemplate(order, reason);
    await sendEmail(to, subject, html);
};

module.exports = {
    transport: transporter,
    sendEmail,
    sendResetPasswordEmail,
    sendVerificationEmail,
    sendWelcomeEmail,
    sendPasswordChangedConfirmationEmail,
    sendOrderCreatedEmail,
    sendOrderCancelledEmail,
};
