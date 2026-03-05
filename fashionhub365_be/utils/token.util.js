const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { InvalidatedToken } = require('../models');
const { tokenTypes } = require('../constants/tokens');

const getBearerToken = (req) => {
    const authHeader = req.headers.authorization || '';
    return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const verifyJwt = (token) => jwt.verify(token, config.jwt.secret);

const invalidateAccessToken = async (token) => {
    const payload = verifyJwt(token);
    const tokenHash = hashToken(token);

    await InvalidatedToken.findOneAndUpdate(
        { token_hash: tokenHash },
        { $set: { token_hash: tokenHash, expires_at: new Date(payload.exp * 1000) } },
        { upsert: true }
    );

    return payload;
};

const isAccessTokenValid = async (token) => {
    try {
        const tokenHash = hashToken(token);
        const invalidatedToken = await InvalidatedToken.findOne({ token_hash: tokenHash });
        if (invalidatedToken) {
            return false;
        }

        const payload = verifyJwt(token);
        return payload.type === tokenTypes.ACCESS;
    } catch (error) {
        return false;
    }
};

module.exports = {
    getBearerToken,
    hashToken,
    verifyJwt,
    invalidateAccessToken,
    isAccessTokenValid,
};
