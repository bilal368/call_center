const express=require('express');
const routes=express.Router()
const {auth}=require('../auth/jwtAuthentication')
const alertsController=require('../controller/alerts')
const bodyParser = require('body-parser');

routes.use(bodyParser.urlencoded({ extended: false }));// Body Parser for parsing data sent from the page
//Route for get users for adding in Alert Management
// Route for manage alerts get/add/addedlist/setAlert
routes.post('/manageAlerts',auth.authenticateJWT,alertsController.manageAlerts)
// Route for get Recorder Types
routes.post('/getRecorderTypes',auth.authenticateJWT,alertsController.getRecorderTypes)

module.exports=routes