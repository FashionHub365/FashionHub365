const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { Session } = require('../models');
const { tokenTypes } = require('../constants/tokens');
const crypto = require('crypto');
const mongoose = require('mongoose');

const normalizeDeviceInfo = (deviceInfo = {}) => {
    if (typeof deviceInfo === 'string') {
        return { agent: deviceInfo };
    }
    if (deviceInfo && typeof deviceInfo === 'object') {
        return deviceInfo;
    }
    return {};
};

const generateToken = (userId, expires, type, sessionId = null, secret = config.jwt.secret) => {
    const payload = {
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expires.getTime() / 1000),
        type,
        ...(sessionId && { sid: sessionId })
    };
    return jwt.sign(payload, secret);
};


const generateAuthTokens = async (user, deviceInfo = {}, ipAddress = '', options = {}) => {
    const normalizedDeviceInfo = normalizeDeviceInfo(deviceInfo);

    const accessTokenExpires = new Date();
    accessTokenExpires.setMinutes(accessTokenExpires.getMinutes() + config.jwt.accessExpirationMinutes);

    const refreshExpirationDays = options.rememberMe ? config.jwt.refreshExpirationDays : 1;
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + refreshExpirationDays);


    const sessionId = new mongoose.Types.ObjectId();
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');


    const accessToken = generateToken(user._id, accessTokenExpires, tokenTypes.ACCESS, sessionId);


    await Session.create({
        _id: sessionId,
        user_id: user._id,
        refresh_token_hash: refreshTokenHash,
        expires_at: refreshTokenExpires,
        device_info: JSON.stringify(normalizedDeviceInfo),
        ip_address: ipAddress
    });

    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires,
        },
        refresh: {
            token: refreshToken, // Return raw token to user
            expires: refreshTokenExpires,
        },
    };
};

module.exports = {
    generateToken,
    generateAuthTokens,
    normalizeDeviceInfo,
};
