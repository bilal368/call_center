const express = require('express');
const routes = express.Router();
const reportController = require('../controller/reports');
const auditTrail = require('../auditTrail')
const { auth } = require('../auth/jwtAuthentication');

// Route for Fetching call Report
routes.post('/CallReports', auth.authenticateJWT, reportController.callReports);
// Route for Fetching call Report Details
routes.post('/fetchcallReportsDetails', auth.authenticateJWT, reportController.fetchcallReportsDetails);
// Route for Fetching Audio call Report
routes.post('/audioCallReports', auth.authenticateJWT, reportController.audioCallReports);
// Route for Lock call Report
routes.post('/lockCallReports', auth.authenticateJWT, reportController.lockCallReports);
// Route for Unlock Call Reports
routes.post('/UnlockCallReports', auth.authenticateJWT, reportController.UnlockCallReports);
// Route for Lock Selected call Report
routes.post('/lockSelectedCallReports', auth.authenticateJWT, reportController.lockSelectedCallReports);
// Route for Notes adding for call Report
routes.post('/notesCallReports', auth.authenticateJWT, reportController.notesReports);
// Route for Adding Feedback for call Report
routes.post('/transcriptCallReports', auth.authenticateJWT, reportController.transcriptCallReports);
// Route for Fetching all color codes
routes.post('/colorCode', auth.authenticateJWT, reportController.colorCode);
// Route for Updating color codes for call Report
routes.post('/updatecolorCode', auth.authenticateJWT, reportController.updatecolorCode);
// Route for Deactivate call Report
routes.delete('/deleteReports', auth.authenticateJWT, reportController.deleteReports);
// Route for Extension Reports 
routes.post('/ExtensionReports', auth.authenticateJWT, reportController.extensionReports);
// Route for get ColorCodeDetailExcelReport
routes.post('/ColorCodeDetailExcelReport', auth.authenticateJWT, reportController.getColorCodeDetailExcelReport);
// Route for color code Report
routes.post('/colorCodeReports', auth.authenticateJWT, reportController.getColorCodeSummaryReport);
// Route for agent Reports
routes.post('/agentReports', auth.authenticateJWT, reportController.getAgentSummaryReport);
// Route for Fetching agent filter Details
routes.post('/agentNamefilter', auth.authenticateJWT, reportController.agentNamefilter);
// Route for get frequent call report 
routes.post('/frequentCallReports', auth.authenticateJWT, reportController.getfrequentCallSummaryReport);
// Route for Extension Reports 
routes.post('/ExtensionReports', auth.authenticateJWT, reportController.extensionReports);
// Route for get filters
routes.post('/getFilters', auth.authenticateJWT, reportController.getFilters);
// Route for get filters- deltedUsrid,deletedusername
routes.post('/getDeletedUserDetails', auth.authenticateJWT, reportController.getDeletedUserDetails);
// Route for get filters- deltedUsrid,deletedusername
routes.post('/getloginUserDetails', auth.authenticateJWT, reportController.getloginUserDetails);
// Route for deleteCallReport
routes.post('/deleteCallReport', auth.authenticateJWT, reportController.deletedCallReport);
// Route for timeline report
routes.post('/timelineReports', auth.authenticateJWT, reportController.timelineReports);
// Route for Login Track Reports
routes.post('/loginTrackReports', auth.authenticateJWT, reportController.loginTrackReports);
// Route for get filters for login track
routes.post('/getFiltersloginTrack', auth.authenticateJWT, reportController.getFiltersloginTrack);
// Route for concurrent call report
routes.post('/concurrentReports', auth.authenticateJWT, reportController.concurrentReports);
// Route for fetch fetch Call Tagging
routes.post('/fetchCallTagging', auth.authenticateJWT, reportController.fetchCallTagging);
// Route for fetch Call Tagging Details
routes.post('/fetchCallTaggingDetails', auth.authenticateJWT, reportController.fetchCallTaggingDetails);
// Route for Update Call Tagging
routes.post('/updateCallTagging', auth.authenticateJWT, reportController.updateCallTagging);
// Route for Insert Call Tagging Details
routes.post('/insertCallTaggingDetails', auth.authenticateJWT, reportController.insertCallTaggingDetails);
// Route for Delete Call Tagging Details
routes.post('/deleteCallTaggingDetails', auth.authenticateJWT, reportController.deleteCallTaggingDetails);
// Route For AuditTrail Reports
routes.post('/AuditTrailReport', auth.authenticateJWT, reportController.getAuditTrailReport);
// Route For AuditTrail Reports
routes.post('/updateAuditTrailReport', auth.authenticateJWT, reportController.updateAuditTrailFunction);
module.exports = routes;