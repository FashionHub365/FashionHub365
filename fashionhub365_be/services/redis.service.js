const net = require('net');
const { URL } = require('url');
const config = require('../config/config');

class RedisService {
    constructor(redisUrl) {
        this.redisUrl = redisUrl;
        this.enabled = !!redisUrl;
        this.socket = null;
        this.buffer = '';
        this.pending = [];
        this.connected = false;
        this.connecting = null;
    }

    async connect() {
        if (!this.enabled) {
            return false;
        }

        if (this.connected) {
            return true;
        }

        if (this.connecting) {
            return this.connecting;
        }

        this.connecting = new Promise((resolve) => {
            try {
                const parsed = new URL(this.redisUrl);
                const port = Number(parsed.port || 6379);
                const host = parsed.hostname;
                const password = parsed.password || '';

                const socket = net.createConnection({ host, port }, async () => {
                    this.socket = socket;
                    this.connected = true;
                    if (password) {
                        try {
                            await this.send(['AUTH', password]);
                        } catch (error) {
                            this.disable();
                        }
                    }
                    resolve(this.connected);
                });

                socket.setEncoding('utf8');
                socket.on('data', (chunk) => this.handleData(chunk));
                socket.on('error', () => this.disable());
                socket.on('close', () => this.disable());
            } catch (error) {
                this.disable();
                resolve(false);
            }
        }).finally(() => {
            this.connecting = null;
        });

        return this.connecting;
    }

    disable() {
        this.enabled = false;
        this.connected = false;
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
        while (this.pending.length > 0) {
            const current = this.pending.shift();
            current.reject(new Error('Redis unavailable'));
        }
    }

    encode(parts) {
        return `*${parts.length}\r\n${parts.map((part) => {
            const value = String(part);
            return `$${Buffer.byteLength(value)}\r\n${value}\r\n`;
        }).join('')}`;
    }

    handleData(chunk) {
        this.buffer += chunk;

        while (this.pending.length > 0) {
            const parsed = this.parseResponse(this.buffer);
            if (!parsed) {
                return;
            }

            this.buffer = parsed.rest;
            const current = this.pending.shift();
            if (parsed.error) {
                current.reject(parsed.error);
            } else {
                current.resolve(parsed.value);
            }
        }
    }

    parseResponse(input) {
        if (!input || input.length < 1) {
            return null;
        }

        const type = input[0];
        const lineEnd = input.indexOf('\r\n');
        if (lineEnd === -1) {
            return null;
        }

        const line = input.slice(1, lineEnd);
        const rest = input.slice(lineEnd + 2);

        if (type === '+') {
            return { value: line, rest };
        }

        if (type === '-') {
            return { error: new Error(line), rest };
        }

        if (type === ':') {
            return { value: Number(line), rest };
        }

        if (type === '$') {
            const length = Number(line);
            if (length === -1) {
                return { value: null, rest };
            }
            if (rest.length < length + 2) {
                return null;
            }
            return {
                value: rest.slice(0, length),
                rest: rest.slice(length + 2),
            };
        }

        return null;
    }

    async send(parts) {
        const isConnected = await this.connect();
        if (!isConnected || !this.socket) {
            throw new Error('Redis unavailable');
        }

        return new Promise((resolve, reject) => {
            this.pending.push({ resolve, reject });
            this.socket.write(this.encode(parts));
        });
    }

    async setEx(key, ttlSeconds, value) {
        return this.send(['SETEX', key, ttlSeconds, value]);
    }

    async get(key) {
        return this.send(['GET', key]);
    }

    async del(key) {
        return this.send(['DEL', key]);
    }
}

module.exports = new RedisService(config.redis.url);
