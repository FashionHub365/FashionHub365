require('dotenv').config();

const redisService = require('../services/redis.service');

const run = async () => {
    if (!process.env.REDIS_URL) {
        console.log('REDIS_URL is not configured. OTP will fall back to in-memory store.');
        process.exit(0);
    }

    try {
        const key = `smoke:redis:${Date.now()}`;
        await redisService.setEx(key, 30, 'ok');
        const value = await redisService.get(key);
        await redisService.del(key);

        if (value !== 'ok') {
            throw new Error(`Unexpected Redis value: ${value}`);
        }

        console.log('Redis smoke test passed.');
        process.exit(0);
    } catch (error) {
        console.error('Redis smoke test failed:', error.message);
        process.exit(1);
    }
};

run();
