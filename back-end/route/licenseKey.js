const express = require('express');
const routes = express.Router();
const licenceController = require('../controller/licenceKey');
const { auth } = require('../auth/jwtAuthentication');

// fetch License Key 
routes.post('/fetchLicenseKey', licenceController.fetchLicenceKey);
// Insert License Key
routes.post('/insertLicenseKey', licenceController.insertLicenseKey);
// Validate License Key
routes.post('/validateLicenseKey', licenceController.validateLicenseKey);
//routes for validity mesage for license
routes.post('/validityChecking',auth.authenticateJWT,licenceController.fetchLicenseValidityCheck);
//routes for getting recorder types
routes.post('/licensevalidationDashboard',auth.authenticateJWT,licenceController.fetchToken);
module.exports = routes;