const express=require('express');
const routes=express.Router()
const {auth}=require('../auth/jwtAuthentication')
const bodyParser = require('body-parser');
let log = require("log4js").getLogger("Alert");
const rolesAndPrivModel = require('../controller/rolesAndPriv')

routes.use(bodyParser.urlencoded({ extended: false }));// Body Parser for parsing data sent from the page
//Route for roles and privileges 
// Route for get user Roles and Privileges
routes.post('/saveRolesAndPrivileages',auth.authenticateJWT,rolesAndPrivModel.saveRolesAndPrivileges);
// routes for get Privileges
routes.post('/getPrivileages',auth.authenticateJWT,rolesAndPrivModel.getPrivileages);
//Routes for get users : group by Role
routes.post('/usersByRole',auth.authenticateJWT,rolesAndPrivModel.getUsersByRoleGroups);
//Routes for get users : group by Role
routes.post('/getDataforDataRestrictions',auth.authenticateJWT,rolesAndPrivModel.getDataforDataRestrictions);


module.exports=routes