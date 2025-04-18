const express = require('express');
const routes = express.Router();
const bodyParser = require('body-parser');
const ldapController = require('../controller/ldap');
const expressJwt = require('jsonwebtoken');//express-jwt middleware is used to verify JWT tokens
const { auth } = require('../auth/jwtAuthentication');

routes.use(bodyParser.urlencoded({ extended: false }));// Body Parser for parsing data sent from the page
// Route for LDAP authentication auth.authenticateJWT,
routes.post('/authentication', ldapController.ldapAuthentication);
// Route For fetching Users
routes.post('/fetchLDAPUsers',auth.authenticateJWT, ldapController.fetchLDAPUsers);
// Route for fetching LDAP hierarchy data
routes.post('/Hierarchy', ldapController.getHierarchy);
// Route for fetching LDAP hierarchy data
routes.post('/HierarchySearch',auth.authenticateJWT,  ldapController.getHierarchySearch);
// Route for fetching LDAP hierarchy data
routes.post('/HierarchySave',auth.authenticateJWT,  ldapController.saveHierarchy);
// Route for fetching LDAP employee details
routes.post('/EmployeeDataMapping',  ldapController.getEmployeeDataMapping);
//Route for Storing Employee attributes
//routes.post('/saveAttributes',ldapController.SaveAttributes);
//Route for fetch user groups in ldap
routes.post('/getUserGroups',auth.authenticateJWT, ldapController.getUserGroups);
//Route for fetch user groups in ldap
routes.post('/getUserRoles',auth.authenticateJWT, ldapController.getUserRoles);
//Route for store user groups to DB
routes.post('/saveUserRoles',auth.authenticateJWT, ldapController.saveUserRoles);
//Route for saving Employee details
routes.post('/EmployeeDataSaving',auth.authenticateJWT, ldapController.LDAPuserDataSaving);
//Route for extensionMapping
routes.post('/getExtensionMapping',auth.authenticateJWT, ldapController.getExtensionMapping);
//Route for getInsertUpdateMapping
routes.post('/getMappingDetails',auth.authenticateJWT,ldapController.getMappingDetails);
//Route for departmentByLocationId getDepartmentByLocation
routes.post('/getDepartmentByLocation',auth.authenticateJWT, ldapController.getDepartmentsByLocation);
//Route for divisinByDepartment
routes.post('/getDivisionsByDept',auth.authenticateJWT, ldapController.getDivisionsByDepartment);
//Route for Selected extension Details
routes.post('/getExtensionDetailsByID',auth.authenticateJWT, ldapController.getExtensionDetailsByID);
//Route for ADD Mapping extension
routes.post('/addExtensionMapping',auth.authenticateJWT,ldapController.addExtensionMapping);
//
routes.post('/MappingHeirarchy',auth.authenticateJWT,ldapController.MappingHeirarchy);
//Routes for employeeByiD
routes.post('/getEmployeesByUserID',auth.authenticateJWT, ldapController.getEmployeesByUserID);
//Route for Delete Extension
routes.post('/deleteExtensionMapping',auth.authenticateJWT, ldapController.deleteExtensionMapping);
//Route for ExtensionfileUpload 
routes.post('/ExtensionfileUpload',auth.authenticateJWT, ldapController.ExtensionfileUpload);
//Route for ExtensionfileUpload 
routes.post('/IsExtensionExists',auth.authenticateJWT, ldapController.IsExtensionExists);
//updateFileUploadedExtension
routes.post('/updateFileUploadedExtension',auth.authenticateJWT, ldapController.updateFileUploadedExtension);
module.exports = routes;