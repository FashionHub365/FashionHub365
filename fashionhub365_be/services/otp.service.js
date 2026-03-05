const crypto = require('crypto');
const redisService = require('./redis.service');

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_TTL_SECONDS = Math.floor(OTP_TTL_MS / 1000);
const REMEMBER_ME_TTL_SECONDS = OTP_TTL_SECONDS;

const loginOtpStore = new Map();
const rememberMeStore = new Map();

const buildEmailKey = (email) => email.trim().toLowerCase();
const buildOtpKey = (email) => `otp:login:${buildEmailKey(email)}`;
const buildRememberMeKey = (email) => `remember_me:${buildEmailKey(email)}`;

const generateOtpCode = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');

const setExpiringValue = (store, key, value, ttlMs) => {
    store.set(key, { ...value, expiresAt: Date.now() + ttlMs });
};

const getValidValue = (store, key) => {
    const entry = store.get(key);
    if (!entry) {
        return null;
    }

    if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return null;
    }

    return entry;
};

const createLoginOtp = async (email) => {
    const normalizedEmail = buildEmailKey(email);
    const otpCode = generateOtpCode();

    try {
        await redisService.setEx(buildOtpKey(normalizedEmail), OTP_TTL_SECONDS, otpCode);
    } catch (error) {
        setExpiringValue(loginOtpStore, normalizedEmail, { otpCode }, OTP_TTL_MS);
    }

    return otpCode;
};

const verifyLoginOtp = async (email, otpCode) => {
    const normalizedEmail = buildEmailKey(email);

    try {
        const storedOtp = await redisService.get(buildOtpKey(normalizedEmail));
        if (!storedOtp || storedOtp !== otpCode) {
            return false;
        }
        await redisService.del(buildOtpKey(normalizedEmail));
        return true;
    } catch (error) {
        const entry = getValidValue(loginOtpStore, normalizedEmail);
        if (!entry || entry.otpCode !== otpCode) {
            return false;
        }
        loginOtpStore.delete(normalizedEmail);
        return true;
    }
};

const saveRememberMe = async (email, rememberMe) => {
    const normalizedEmail = buildEmailKey(email);
    const value = JSON.stringify({ rememberMe: !!rememberMe });

    try {
        await redisService.setEx(buildRememberMeKey(normalizedEmail), REMEMBER_ME_TTL_SECONDS, value);
    } catch (error) {
        setExpiringValue(rememberMeStore, normalizedEmail, { rememberMe: !!rememberMe }, OTP_TTL_MS);
    }
};

const consumeRememberMe = async (email, fallback = false) => {
    const normalizedEmail = buildEmailKey(email);

    try {
        const raw = await redisService.get(buildRememberMeKey(normalizedEmail));
        await redisService.del(buildRememberMeKey(normalizedEmail));
        if (!raw) {
            return fallback;
        }
        return JSON.parse(raw).rememberMe;
    } catch (error) {
        const entry = getValidValue(rememberMeStore, normalizedEmail);
        rememberMeStore.delete(normalizedEmail);
        return entry ? entry.rememberMe : fallback;
    }
};

module.exports = {
    OTP_TTL_MS,
    createLoginOtp,
    verifyLoginOtp,
    saveRememberMe,
    consumeRememberMe,
};
