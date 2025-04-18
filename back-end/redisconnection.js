const Redis = require('ioredis');
require('dotenv').config();

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;

// const redisPassword = 'XLOGIX_REDIS';
const redisClient = new Redis({
    host: redisHost,
    port: redisPort,
    // password: redisPassword
});
try {
    redisClient.on('connect', () => {
        console.log('Connected to Redis');
    });
    redisClient.on('error', (err) => {
        console.error('Redis error:', err);
    });
} catch (error) {
    console.log(error);
}
module.exports = redisClient;
