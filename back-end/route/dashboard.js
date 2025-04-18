const express = require('express');
const routes = express.Router();
const bodyParser = require('body-parser');
const userController = require('../controller/user');
const expressJwt = require('jsonwebtoken');//express-jwt middleware is used to verify JWT tokens
const { auth } = require('../auth/jwtAuthentication');
const liveStatusController = require('../controller/dashboard');
const elsecontrollerLiveStream = require('../controller/eslController')

const { route } = require('./ldap');
const { frequent } = require('../model/reports');

// 
// Fetch Dashboard Features
routes.post('/fetchDashboardFeatures',auth.authenticateJWT, liveStatusController.fetchDashboardFeatures);
// Insert user features
routes.post('/updateUserDashboardStatus', auth.authenticateJWT, liveStatusController.updateUserDashboardStatus);
// Fetch channel Status
routes.post('/channelStatus',auth.authenticateJWT, liveStatusController.channelStatus);
// Fetch channel Status
routes.post('/usersDetails', auth.authenticateJWT, liveStatusController.activeUsers);
// Daily Call Traffic
routes.post('/dailyCallTrafficStatus',auth.authenticateJWT, liveStatusController.dailyCallTrafficStatus);

//liveSteamAudio
routes.post('/stationmonitorLiveStream', auth.authenticateJWT, elsecontrollerLiveStream.stationMonitorLive);
routes.post('/stoplivecall', auth.authenticateJWT, elsecontrollerLiveStream.stopLive)

// Fetch Filter Settings
routes.post('/fetchFilterSettings', auth.authenticateJWT, liveStatusController.fetchFilterSettings);
// Fetch Filter Agent Settings
routes.post('/fetchFilterAgentSettings', auth.authenticateJWT, liveStatusController.fetchFilterAgentSettings);
// Fetch Filter Settings
routes.post('/fetchUserExtensions', auth.authenticateJWT, liveStatusController.fetchUserExtensions);
// Fetch Filter Channel Time Settings
routes.post('/fetchChannelTime', auth.authenticateJWT, liveStatusController.fetchChannelTime);
// Fetch Filter Channel call Settings
routes.post('/fetchChannelCall', auth.authenticateJWT, liveStatusController.fetchChannelCall);
// Fetch Filter Agent Time Settings
routes.post('/fetchAgentTime', auth.authenticateJWT,liveStatusController.fetchAgentTime);
// Fetch Filter Agent Time Settingsc
routes.post('/fetchAgentCall', auth.authenticateJWT, liveStatusController.fetchAgentCall);
// Fetch Extensions
routes.post('/fetchExtensions', auth.authenticateJWT, liveStatusController.fetchExtensions);
// Fetch Agent Code
routes.post('/fetchAgentCode', auth.authenticateJWT, liveStatusController.fetchAgentCode);

// Fetch Filter Channel call Settings
routes.post('/licenceDecryption', auth.authenticateJWT, liveStatusController.decryption);

// Cancel Remove Update Dashboard Features
routes.post('/removeUpdateDashboardFeatures', auth.authenticateJWT, liveStatusController.removeUpdateDashboardFeatures);

routes.post('/fectchgeneralsetting', auth.authenticateJWT,liveStatusController.fechgeneralsettings)
//frequcantcall dasbord
routes.post('/frequantcalldasboard', auth.authenticateJWT,liveStatusController.frequantcall)
//call type traffic dashboard
routes.post('/calltypetrafficdasboard', auth.authenticateJWT,liveStatusController.calltypetraffic);

//concurrent call dashboard
routes.post('/concurrentcalldashboard', auth.authenticateJWT,liveStatusController.concurrentcall);


//get siptrunk and E1 recoder data
routes.post('/siptrunkeoneDashboard',auth.authenticateJWT,liveStatusController.siptrunkeoneDashboard);

module.exports = routes;