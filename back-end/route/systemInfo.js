const express=require('express');
const routes=express.Router()
const {auth}=require('../auth/jwtAuthentication')
const systemInfo=require('../controller/systemInfo')
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs=require('fs')
routes.use(bodyParser.urlencoded({ extended: false }));// Body Parser for parsing data sent from the page
// Configure Multer to store image in memory as buffer
// Set up multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/logoImages');  // Directory to store uploaded files
  },
  filename: function (req, file, cb) {
    // Clear the upload location before uploading a new file
    fs.readdir('./uploads/logoImages/', (err, files) => {
      if (err) {
        console.error(err);
        return;
      }
      files.forEach((file) => {
        fs.unlink(path.join('./uploads/logoImages/', file), (err) => {
          if (err) {
            console.error(err);
          }
        });
      });
    });

    // Generate a new filename with a timestamp to avoid filename conflicts
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
// Route for get logo images
routes.use('/uploads/logoImages', express.static('uploads/logoImages'));
// Route for upload Logo
routes.post('/uploadLogo',auth.authenticateJWT,upload.single('file'),systemInfo.uploadLogo)
// Route for get logo name to show logo frontend :: not needed middleware
routes.get('/getLogoName',systemInfo.getLogoName)
// Route for get registration details
routes.post('/getRegistrationDetails',auth.authenticateJWT,systemInfo.getRegistrationDetails)
// Route for save registration details
routes.post('/saveRegistration',auth.authenticateJWT,systemInfo.saveRegistration)
// Route for get Disk Usage from redis
routes.get('/getDiskUsage',auth.authenticateJWT,systemInfo.getDiskUsage)
// Route for get Disk Usage from redis
routes.post('/manualArchive',auth.authenticateJWT,systemInfo.manualArchive)
// Route for get Default Location
routes.post('/getDefaultLocation',auth.authenticateJWT,systemInfo.getDefaultLocation)

// Route for mount CIFS file system
routes.post('/mountCIFS',auth.authenticateJWT,systemInfo.mountFileSystem)
// Route for un-mount CIFS file system
routes.post('/unMountCIFS',auth.authenticateJWT,systemInfo.unMountFileSystem)
// Route for get archive list
routes.post('/getArchiveList',auth.authenticateJWT,systemInfo.getArchiveList)
// Route for delete archive list
routes.post('/deleteArchiveReport',auth.authenticateJWT,systemInfo.deleteArchiveReport)
// Route for get data from XML
routes.post('/getXMLData',auth.authenticateJWT,systemInfo.getXMLData)
// Route for get data from json that converted from XML
routes.post('/getCallsFromXML',auth.authenticateJWT,systemInfo.getCallsFromXML)
//Route for auto archive 
routes.post('/autoArchive',auth.authenticateJWT,systemInfo.getAutoArchive);
//Route for save auto-delete settings
routes.post('/saveAutoDelete',auth.authenticateJWT,systemInfo.saveAutoDelete);
//Route for get auto-delete settings
routes.post('/getAutoDeleteSettings',auth.authenticateJWT,systemInfo.getAutoDeleteSettings);
// Route for saving mailer settings
routes.post('/saveMailSettings', auth.authenticateJWT, systemInfo.saveMailSettings);
// Route for get mailer settings
routes.get('/getSMTPmailSettings', auth.authenticateJWT, systemInfo.getSMTPmailSettings);
module.exports=routes