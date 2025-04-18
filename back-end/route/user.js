const express = require('express');
const routes = express.Router();
const bodyParser = require('body-parser');
const userController = require('../controller/user');
const { auth } = require('../auth/jwtAuthentication');
const multer = require('multer');
const liveStatusController = require('../controller/recorderSettings');
const { route } = require('./ldap');


routes.use(bodyParser.urlencoded({ extended: false }));// Body Parser for parsing data sent from the page


// Route for login
routes.post('/login', userController.login);
// Route for user logout
routes.post('/logOut', userController.logOut);
// Route for user unlock
routes.post('/unLockUser',auth.authenticateJWT,  userController.unLockUser);
// Route for initiating the password reset process 
routes.post('/forgotPassword', userController.forgotPassword);
// Route for updating/resetting the password 
routes.post('/resetPassword', userController.updateResetPassword);
// Route for insert user groups 
routes.post('/insertUsergroups',auth.authenticateJWT, userController.insertUsergroups);
// Route for get user groups 
routes.post('/getUsergroups',auth.authenticateJWT, userController.getUsergroups);
routes.post('/getUsergroupsAlert',auth.authenticateJWT, userController.getUsergroupsAlert);
//Search routes
routes.post('/SearchData',auth.authenticateJWT, userController.SearchResult);
// Route for edit user groups 
routes.post('/updateUsergroups',auth.authenticateJWT,userController.updateUsergroups);
// Route for delete user groups 
routes.post('/deleteUsergroups',auth.authenticateJWT,userController.deleteUsergroups);
// Route for insert users 
routes.post('/insertUsers',auth.authenticateJWT, userController.insertUsers);
// Route for Upload users 
routes.post('/UploadUsers',auth.authenticateJWT, userController.UploadUsers);
// Route for get users 
routes.post('/getUsers',auth.authenticateJWT, userController.getUsers);
// Route for update users by Id
routes.post('/getUsersId',auth.authenticateJWT, userController.updateuserById);
//Route for getting user by roleid
routes.post('/getuserlistbyid',auth.authenticateJWT,userController.getUserlistbyId)
// Route for edit user 
routes.post('/updateUsers',auth.authenticateJWT,userController.updateUsers);
// Route for delete users 
routes.post('/deleteUsers',auth.authenticateJWT,userController.deleteUsers);
// Route for insert usersExcel
routes.post('/insertUsersExcel',auth.authenticateJWT, userController.insertUsersExcel);
// Route for fetch Station Monitor Data
routes.post('/fetchStationMonitorData',auth.authenticateJWT,userController.fectingStationMonitorData);
// Route for fetching live data from Redis for all stations
routes.post('/redisDataStation', auth.authenticateJWT, liveStatusController.livedatafromredis);
//Route for enable or disable recording 
routes.post('/updateRecorderEnableDisable',auth.authenticateJWT,liveStatusController.updateRecordEnableDisable)

// Route for get Employees 
routes.post('/getEmployees',auth.authenticateJWT, userController.getEmployees);
// Route for add Employees  
routes.post('/addEmployees',auth.authenticateJWT, userController.addEmployees);
// Route for update Employees 
routes.post('/updateEmployees',auth.authenticateJWT, userController.updateEmployees);
//routes for getting deartment based on the locations
routes.post('/departmentList',auth.authenticateJWT, userController.getDepartmentList);
//routes for delete employees
routes.post('/deleteEmployees',auth.authenticateJWT,userController.deleteEmployees);
// Route for Upload employees 
routes.post('/UploadEmployees',auth.authenticateJWT, userController.UploadEmployees);
//Route for excel import of employees location,department,division
routes.post('/getHierachyMappingDetails',auth.authenticateJWT,userController.getHierachyMappingDetails);
//Route for save excel import of employees location,department,division
routes.post('/MappingHeirarchyEmployee',auth.authenticateJWT,userController.MappingHeirarchyEmployee);
// Route for hierarchyNames location,department,division  
routes.post('/hierarchyNames',auth.authenticateJWT, userController.hierarchyNames);
// Route for get location  
routes.post('/getLocationDepartmentDivision',auth.authenticateJWT, userController.getLocationDepartmentDivision);
//Route Fir Department by locationID
routes.post('/getDepartmentByLocation',auth.authenticateJWT,userController.getDepartmentByLocation);
//Route Fir Division by department
routes.post('/getDivisionByDept',auth.authenticateJWT,userController.getDivisionByDept);
//Route Fir Division by locationID
routes.post('/getDivisionBylocation',auth.authenticateJWT,userController.getDivisionBylocation);
// Route for add location  
routes.post('/addLocation',auth.authenticateJWT, userController.addLocation);
// Route for update location  
routes.post('/updateLocation',auth.authenticateJWT, userController.updateLocation);
// Route for Delete location  
routes.post('/deleteLocation',auth.authenticateJWT, userController.deleteLocation);
// Route for add Department  
routes.post('/addDepartment', auth.authenticateJWT,userController.addDepartment);
// Route for update Department
routes.post('/updateDepartment',auth.authenticateJWT, userController.updateDepartment);
// Route for Delete Department  
routes.post('/deleteDepartment',auth.authenticateJWT, userController.deleteDepartment);
// Route for add Division  
routes.post('/addDivision',auth.authenticateJWT, userController.addDivision);
// Route for update Division
routes.post('/updateDivision',auth.authenticateJWT, userController.updateDivision);
// Route for Delete Division  
routes.post('/deleteDivision',auth.authenticateJWT, userController.deleteDivision);
// Route for get extension ,Agents,Phonenumber filters
routes.post('/getFilters',auth.authenticateJWT,userController.getFilters);
// Route for Languages
routes.post('/UserLanguages',auth.authenticateJWT, userController.languages);
// Route for Update User Language
routes.post('/UpdateUserlanguage',auth.authenticateJWT, userController.UpdateUserlanguage);

module.exports = routes;
