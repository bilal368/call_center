
const app = require('express');
const JWT_SECRET = process.env.JWT_SECRET; // Change this to your actual secret key
const jwt = require('jsonwebtoken');
const { log } = require('util');
let expiryTime ; // convert to milliseconds
const httpServer = require('http').createServer(app);
const io = require('socket.io')
    (httpServer, {
        cors: true,
        origins: ["*"]
    });
    
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        console.error("Unauthorized access to socket")
        return next(new Error('Unauthorized'));
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("Not valid token for access to socket")
        return next(new Error('Unauthorized'));
      }

        // this will be use for logout without interact if token expired.
        // use node sheduler or later for sheduled job 
        expiryTime = new Date(decoded.exp * 1000);
        console.log(`Token will expire on: ${expiryTime.toLocaleString()}`);
        socket.decoded = decoded;
      
      next();
    });
  });
  io.on("connection", (socket) => {
    console.info(`User:"${socket.decoded.userId}" connected to socket userId:${socket.id}`);
    io.emit(`connection`,socket.id)
    // setTimeout(()=>{
    //     io.emit('userPasswordUpdated',true)

    // },150000)
    socket.on('logout',(socket)=>{
        console.log("Received logout event from:", socket);
        io.emit("logout", socket); // Broadcast to all connected clients
    })
    socket.on('disconnect', () => {
        console.log(`User:"${socket.decoded.userId}" disconnected from socket userId:${socket.id}`);
    });
   

});
// just Color for CMD
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};
const PORT = process.env.PORT || 3007;
httpServer.listen(PORT, () => console.log(`Socket Server is running on port ${colors.cyan} ${PORT} ${colors.reset}`));
module.exports = io;

