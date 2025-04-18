const Redis = require('ioredis');
const io = require('./socket');
require('dotenv').config();
const redisHost =process.env.REDIS_HOST;
const redisPort =process.env.REDIS_PORT ;
let log = require("log4js").getLogger("redisUpdates");
const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  // password: redisPassword
});
try {
  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });
  redisClient.subscribe('CHANNEL_STATUS_UPDATE', (err, count) => {
    if (err) {
      console.error('Failed to subscribe:', err);
    } else {
      console.log(`Subscribed to ${count} channel(s).`);
    }
  });
  
  // Listen for messages
  redisClient.on('message', (channel, message) => {
    // console.log(`Received message from ${channel}: ${message}`);
    io.emit('userCountUpdate', 'DataFromsocket');
    
  });
} catch (error) {
  console.log(error);
}

module.exports = { redisClient };