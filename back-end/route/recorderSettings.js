const express = require('express');
const routes = express.Router();
const { auth } = require('../auth/jwtAuthentication');
const recSettingsController = require('../controller/recorderSettings');

// Route for inserting recorder settings into Redis
routes.post('/insertRecorderSettingRedis', auth.authenticateJWT, recSettingsController.recordersettings);

// Route for channel mapping
routes.post('/channelMapping', auth.authenticateJWT, recSettingsController.channelmapping);


//Route for update channelmapping
routes.post('/updatechannel', auth.authenticateJWT, recSettingsController.updatechannel)

// Route for fetching the channel mapping list
routes.post('/channelMappingList', auth.authenticateJWT, recSettingsController.channelmappinglist);

// Route for deleting a channel
routes.post('/deleteChannel', auth.authenticateJWT, recSettingsController.deleteChannel);

// Route for SIP trunk channel mapping
routes.post('/channelMappingSiptrunk', auth.authenticateJWT, recSettingsController.channelmappingsiptrunk);

// Route for fetching the SIP trunk channel mapping list
routes.post('/channelMapListSiptrunk', auth.authenticateJWT, recSettingsController.channelmappinglistsiptrunk);

// Route for update SIP trunk channel mapping
routes.post('/updatechannelsiptrunk', auth.authenticateJWT, recSettingsController.updatechannelsiptrunk);


//siptrunkdevicelist
routes.post('/siptrunkDevicelist', auth.authenticateJWT, recSettingsController.devicelist)

//routes for siptrunk settings
routes.post('/siptrunkRecorderSettings', auth.authenticateJWT, recSettingsController.siptrunkRecorderSettings)
//routes for geting data of siptrunk
routes.post('/siptrunkRecorderSettingsGetData', auth.authenticateJWT, recSettingsController.siptrunkRecorderSettingsGetData)

routes.post('/fecthLicenseToken', auth.authenticateJWT, recSettingsController.fetchTokenConfig)
routes.post('/fectchSiptrunkRecorderSettings', auth.authenticateJWT, recSettingsController.fectchSiptrunkRecorderSettings)

//Route insert analogue recorder settings
routes.post('/insertanalogueRecorderSettings', auth.authenticateJWT, recSettingsController.insertanalougerecodersettings)

//Route insert channel mapping analogue recorder
routes.post('/channelSettingsInsertAnalouge', auth.authenticateJWT, recSettingsController.channelsettingsinsertanalouge)

routes.post('/GetsettingDataAnalogue', auth.authenticateJWT, recSettingsController.analoguegenralSetting)
//Routes to get list channel mapped data analogue
routes.post('/getChannelsettingsDataAnalogue', auth.authenticateJWT, recSettingsController.getChanellsettingsDatat)
//Routes to mediaproxy Data
routes.post('/mediaProxySettings', auth.authenticateJWT, recSettingsController.mediapoxiysettings)
//Routes to get media proxy data
routes.post('/GetmediaporxyData', auth.authenticateJWT, recSettingsController.mediaproxyGetData)
//Routes to digital recorder
routes.post('/digitalRecordersettings', auth.authenticateJWT, recSettingsController.digitalRecordersettings)

//Routes get digital data
routes.post('/getDigitalDataSettings',auth.authenticateJWT, recSettingsController.getDigitalDatasettings)
//Routes to Voltageenergy
routes.post('/VoltageEnergy', auth.authenticateJWT, recSettingsController.voltageenergy)
//Routes to get digital event
routes.post('/digitalrecorderEvent', auth.authenticateJWT, recSettingsController.digitalrecorderevent)
//Routes to get digital recorder Data
routes.post('/getDigitalRecorderData', auth.authenticateJWT, recSettingsController.getEventMangement)
//Routes to delete analogue recorder settings
routes.post('/deleteAnalogueData', auth.authenticateJWT, recSettingsController.deleteAnagloueData);
//Routes to insert E1 recorder settings
routes.post('/insertEoneRecorder', auth.authenticateJWT, recSettingsController.insertEoneRecorder);

//Routes to get E1 recorder settings
routes.post('/getEoneRecorderdata', auth.authenticateJWT, recSettingsController.geteoneData);
//Routes to get DID labeled Data
routes.post('/getDIDlabelData', auth.authenticateJWT, recSettingsController.getDIDlabelData);
//Routes to add new DID label
routes.post('/saveDIDlabel', auth.authenticateJWT, recSettingsController.saveDIDlabel);
//Routes to update DID label
routes.post('/updateDIDlabel', auth.authenticateJWT, recSettingsController.updateDIDlabel);
//Routes to delete DID
routes.post('/deleteDIDlabel', auth.authenticateJWT, recSettingsController.deleteDID);
//Routes to delete the digital recorder event
routes.post('/deleteEventData', auth.authenticateJWT, recSettingsController.deleteEvents)

//Routes to event data in redis
routes.post('/eventsDataRedis', auth.authenticateJWT, recSettingsController.eventsredis)

//routes to get the event data from redis
routes.post('/GeteventDataFromredis',auth.authenticateJWT,recSettingsController.geteventsredis)

//Routes to remove the event from redis digtial
routes.post('/removeFromRedisevent', auth.authenticateJWT, recSettingsController.removefromredisevent)
module.exports = routes;