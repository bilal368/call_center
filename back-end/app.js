const express = require('express');
const app = express();
require('dotenv').config();
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const log4js = require('log4js');
const bodyParser = require('body-parser');
const cron = require('node-cron');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//  used for securing HTTP headers.
app.use(helmet());



//making a log directory, just in case it isn't there. 
try {
    require('fs').mkdirSync('./log');
} catch (error) {
    if (error.code != 'EEXIST') {
        console.error("Could not set up log directory, error was: ", error);
        process.exit(1);
    }
}
//Configuring log file types & path
log4js.configure({
    appenders: {
        access: {
            type: 'dateFile',
            filename: __dirname + '/log/access.log',
            pattern: '-yyyy-MM-dd',
            category: 'http'
        },
        app: {
            type: 'file',
            filename: __dirname + '/log/app.log',
            maxLogSize: 10485760,
            numBackups: 3
        },
        errorFile: {
            type: 'file',
            filename: __dirname + '/log/errors.log'
        },
        errors: {
            type: 'logLevelFilter',
            level: 'ERROR',
            appender: 'errorFile'
        }
    },
    categories: {
        default: { appenders: ["app", "errors"], level: "ALL" },
        http: { appenders: ["access"], level: "ALL" }
    }
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
let requestCount = 0;
app.use((req, res, next) => {
    requestCount++;
    console.log(`${colors.yellow} Total API Hits: ${requestCount} ${colors.reset} `);
    next();
  });

//initializing log4js 
const log = log4js.getLogger("startup");
const userRoutes = require('./route/user');
const ldapRoutes = require('./route/ldap');
const recording_Reports = require('./route/reports');
const licenseKey = require('./route/licenseKey');
const alertsRoutes=require('./route/alerts');
const recordersRedis=require('./route/recorderSettings')
const dashboardredis=require('./route/dashboard')
const systemInfo=require('./route/systemInfo')
const rolesAndPriv=require('./route/rolesAndPriv')
app.use('/api/_user', userRoutes);
app.use('/api/_ldap',ldapRoutes);
app.use('/api/_reports',recording_Reports);
app.use('/api/_license',licenseKey);
app.use('/api/_alerts',alertsRoutes);
app.use('/api/_recorders',recordersRedis);
app.use('/api/_dashboard',dashboardredis);
app.use('/api/_systemInfo',systemInfo);
app.use('/api/_rolesAndPrivileges',rolesAndPriv)
const serveStatic = require('serve-static');
app.use('/api/_uploads', express.static(path.join(__dirname, 'uploads')));
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${colors.cyan} ${PORT} ${colors.reset}`);
    log.info(`🚀Server is running on port ${PORT}`)
});

module.exports=colors