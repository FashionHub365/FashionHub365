const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../.env') });

const envVarsSchema = Joi.object()
    .keys({
        NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
        PORT: Joi.number().default(5000),
        MONGO_URI: Joi.string().required().description('Mongo DB url'),
        JWT_SECRET: Joi.string().required().description('JWT secret key'),
        JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
        JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
        SMTP_HOST: Joi.string().description('server that will send the emails'),
        SMTP_PORT: Joi.number().description('port to connect to the email server'),
        SMTP_USERNAME: Joi.string().description('username for email server'),
        SMTP_PASSWORD: Joi.string().description('password for email server'),
        EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
        REDIS_URL: Joi.string().uri().description('Redis connection string'),
        FRONTEND_URL: Joi.string().allow('').description('frontend base URL'),
        BANK_TRANSFER_WEBHOOK_SECRET: Joi.string().allow('').description('shared secret for bank transfer webhook'),
        VNPAY_TMN_CODE: Joi.string().allow('').description('VNPay terminal code'),
        VNPAY_HASH_SECRET: Joi.string().allow('').description('VNPay hash secret'),
        VNPAY_URL: Joi.string().allow('').description('VNPay payment URL'),
        VNPAY_RETURN_URL: Joi.string().allow('').description('VNPay return URL'),
        PAYMENT_PENDING_TTL_MINUTES: Joi.number().default(15).description('ttl minutes for pending payment and stock reservation'),
        PAYMENT_RECONCILE_INTERVAL_SECONDS: Joi.number().default(60).description('interval for reconcile worker'),
        OUTBOX_WORKER_INTERVAL_SECONDS: Joi.number().default(10).description('interval for outbox worker'),
        OUTBOX_MAX_RETRY: Joi.number().default(10).description('max retry count for outbox events'),
        OUTBOX_PROCESSING_TIMEOUT_SECONDS: Joi.number().default(300).description('seconds before processing outbox event is treated as stale'),
    })
    .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    frontendUrl: envVars.FRONTEND_URL || 'http://localhost:3000',
    mongoose: {
        url: envVars.MONGO_URI,
    },
    jwt: {
        secret: envVars.JWT_SECRET,
        accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
        refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    },
    email: {
        smtp: {
            host: envVars.SMTP_HOST,
            port: envVars.SMTP_PORT,
            auth: {
                user: envVars.SMTP_USERNAME,
                pass: envVars.SMTP_PASSWORD,
            },
        },
        from: envVars.EMAIL_FROM,
    },
    redis: {
        url: envVars.REDIS_URL || '',
    },
    payment: {
        bankTransferWebhookSecret: envVars.BANK_TRANSFER_WEBHOOK_SECRET || '',
        pendingTtlMinutes: envVars.PAYMENT_PENDING_TTL_MINUTES,
        reconcileIntervalSeconds: envVars.PAYMENT_RECONCILE_INTERVAL_SECONDS,
        vnpay: {
            tmnCode: envVars.VNPAY_TMN_CODE || '',
            hashSecret: envVars.VNPAY_HASH_SECRET || '',
            url: envVars.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
            returnUrl: envVars.VNPAY_RETURN_URL || '',
        },
    },
    outbox: {
        intervalSeconds: envVars.OUTBOX_WORKER_INTERVAL_SECONDS,
        maxRetry: envVars.OUTBOX_MAX_RETRY,
        processingTimeoutSeconds: envVars.OUTBOX_PROCESSING_TIMEOUT_SECONDS,
    },
};
