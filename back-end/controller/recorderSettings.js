const recSettings = require("../model/recorderSettings")
const recSettingsModel = recSettings.recSettings;
var log = require('log4js').getLogger("Redis");
const redisClient = require('../redisconnection');
const { v4: uuidv4 } = require('uuid');
const audit = require("../auditTrail");


exports.livedatafromredis = async (req, res) => {
    let agentFilterdata = req.body.agentFilterdata;
    let extenstionnuber = req.body.extensionfilterdata;
    let statusdata = req.body.statusData;

    let { offset } = req.body;
    let { limit } = req.body;
    // Subscribe to the 'LIVE_CHANNEL_STATUS' channel
    const key = 'CHANNEL_MONITOR';
    const extensionfilter = []
    const agentFilter = []
    let paginatedData;
    redisClient.hgetall(key)

        .then(result => {

            let processedData = [];
            Object.values(result).forEach(value => {

                let parsedEntry;
                try {
                    parsedEntry = JSON.parse(value);
                } catch (error) {
                    // console.error('Error parsing entry:', value, e);
                    return; // Skip this entry if there's an error 
                }

                parsedEntry = JSON.parse(value);

                extensionfilter.push(parsedEntry.Extension)
                agentFilter.push(parsedEntry.Agent)

                let matchesExtension = extenstionnuber.length === 0 || extenstionnuber.includes(parsedEntry.Extension);
                let matchesAgent = agentFilterdata.length === 0 || agentFilterdata.includes(parsedEntry.Agent);
                let matchesStatus = statusdata.length === 0 || statusdata.includes(parsedEntry.ChannelStatus);

                if (matchesExtension && matchesAgent && matchesStatus) {
                    processedData.push(parsedEntry);
                    paginatedData = processedData.slice(offset, offset + limit);
                }
            });
            // Send the filtered data as response
            res.status(200).json({
                status: true,
                statusText: 'Data Fetched Successfully',
                Data: paginatedData,
                Extension: [...new Set(extensionfilter)],
                agentFilter: [...new Set(agentFilter)],
                totalItems: processedData.length,
            });
            audit.auditTrailFunction(req.body.adminUserId, 'STATION MONITORING', 'READ', `Station monitoring accessed`, 'CHANNEL_MONITOR', 0, null, null, null);
        })
        .catch(err => {
            console.error('Error:', err);
            throw new err;
        })
        .finally(() => {
            // redis.quit();
        });
};
exports.recordersettings = async (req, res) => {

    try {
        let userData = {};
        if (req.body.value.logstatus == 'Off') {
            userData.LOG = 0
            userData.LOGGER_STATUS = '0'
        } else {
            userData.LOG = 1
            userData.LOGGER_STATUS = req.body.value.logstatus
        }

        userData = {
            ...userData,
            "Datapath": req.body.value.DataPath,
            "AES_SERVER_IP": req.body.value.aesserver,
            "AES_SERVER_PORT": req.body.value.aesport,
            "LOCAL_IP_ADDRESS": req.body.value.localipaddress,
            "LOCAL_PORT": req.body.value.localport,
            "SWITCH_CONNECTION_NAME": req.body.value.switchconnection,
            "SWITCH_IP_ADDRESS": req.body.value.switchipaddres,
            "AES_USER_NAME": req.body.value.aesusername,
            "AES_USER_PASSWORD": req.body.value.aespassword,
            "RTP_ADDRESS_IP": req.body.value.rtpip,
            "CODEC": req.body.value.codec,
            "XML_PROTOCOL": req.body.value.protocalversion,
            "CHINDEX": req.body.value.chindex,
            "IPCH": req.body.value.ipch,
        };
        // Flatten the object to pass it correctly to HSET

        const publishData = async (channel, message) => {
            try {
                // Publish the message to the specified channel
                const result = await redisClient.publish(channel, JSON.stringify(message));
                console.log(`Message published to channel ${channel}:`, message);
                console.log(`Number of subscribers that received the message: ${result}`);
            } catch (err) {
                console.error('Error publishing message:', err);
            }
        };

        const updateRedisAndPublishChanges = async () => {
            // Retrieve the current data from Redis
            const currentData = await redisClient.hgetall('AVAYA_RECORDING_SETTINGS');

            // Check for changes and store them
            let hasChanges = false;
            const changes = {};

            for (const key in userData) {
                if (userData[key] !== currentData[key]) {
                    hasChanges = true;
                    changes[key] = {
                        oldValue: currentData[key],
                        newValue: userData[key]
                    };
                }
            }

            if (hasChanges) {
                // Update Redis only with the changed fields
                for (const key in changes) {
                    // Update only the changed fields in Redis
                    await redisClient.hset('AVAYA_RECORDING_SETTINGS', key, changes[key].newValue);

                    // Publish the changes
                    const message = `Value changed for ${key}: old value = ${changes[key].oldValue}, new value = ${changes[key].newValue}`;
                    publishData('AVAYA_RECORDING_SETTINGS', message);
                }

                res.status(200).send({ status: true, messages: 'sucessfull' });
                audit.auditTrailFunction(req.body.adminUserId, 'AVAYARECORDER SETTINGS', 'CREATE', `Avaya recorder setting redis`, 'AVAYA_RECORDING_SETTINGS', 1, null, null, null);
            } else {
                console.log('No changes detected. Data remains the same.');
            }
        };

        // Call the function to update and publish changes
        const data = await updateRedisAndPublishChanges();

    } catch (err) {
        console.log(err);
        log.error(err);
        throw new err;
    }

}
exports.channelmapping = async (req, res) => {

    let channel = req.body.channel;
    let extension = req.body.extension;
    let password = req.body.password;

    try {
        if (!channel||!extension||!password) {
            res.status(400).send({ status: false, message: 'Fields cannot be empty' })
        }
        const channelvalidaton = await recSettingsModel.channelvalidation(2, channel)
        if (channelvalidaton[0].length > 0) {
            return res.status(409).send({ status: false, message: 'Channel already exists' })
        }


        const result = await recSettingsModel.channelmapping(2, channel, extension, password);

        if (result[0].affectedRows > 0) {
            res.status(200).send({ status: true, message: 'Sucessfully Added' })
        }
    } catch (err) {
        console.log(err);
        log.error(err);
    }
}
exports.channelmappinglist = async (req, res) => {
    const { limit, offset } = req.body
    try {
        const result = await recSettingsModel.channelmappinglist(limit, offset);
        const count = await recSettingsModel.channelmappingCount()


        if (result.length > 0) {
            audit.auditTrailFunction(req.body.adminUserId, 'AVAYA RECORDER', 'READ', `avaya recorder channel mapping accessed`, 'dgRecorderChannelMapping', 0, null, null, null);
            return res.status(200).send({ status: true, data: result[0], count: count[0].totalCount })

        } else {
            return res.status(400).send({ status: false, data: 'No data' })
        }
    }
    catch (err) {
        console.log(err);
        log.error(err);
    }
}
exports.updatechannel = async (req, res) => {
    const { channel, extension, password, recorderChannelMappingId } = req.body

    try {
        if (!channel||!extension||!password) {
            res.status(400).send({ status: false, message: 'Fields cannot be empty' })
        }

        const result = await recSettingsModel.Updatechannelmapping(2, channel, extension, password, recorderChannelMappingId);
        if (result[0].changedRows > 0) {
            res.status(200).send({ status: true, message: 'Avaya channel mapping updated successfully' })
        }

    } catch (error) {
        console.log(error);
        log.error(error);

    }

}
exports.deleteChannel = async (req, res) => {
    let ids = req.body.id; // Expecting an array of IDs

    try {
        if (!Array.isArray(ids)) {
            return res.status(400).send({ status: false, message: "Invalid input, expected an array of IDs" });
        }

        const results = await Promise.all(
            ids.map(async (id) => {
                return recSettingsModel.deletechannel(id);
            })
        );

        // Check if any rows were affected
        const deletedCount = results.filter(result => result[0].affectedRows > 0).length;

        if (deletedCount > 0) {
            return res.status(200).send({ status: true, message: `${deletedCount} records deleted successfully` });
        } else {
            return res.status(400).send({ status: false, message: "No records deleted" });
        }
    } catch (err) {
        console.error(err);
        log.error(err);
        return res.status(500).send({ status: false, message: "Server error" });
    }

}
exports.channelmappingsiptrunk = async (req, res) => {
    let channel = req.body.channel;
    let extension = req.body.extension;
    let type = req.body.type
    try {
        if (!channel) {
            res.status(400).send({ status: false, message: 'Excel cannot be empty' })
        }
        if (!extension) {
            res.status(400).send({ status: false, message: 'Excel cannot be empty' })
        }
        const channelvalidaton = await recSettingsModel.channelvalidation(3, channel)
        if (channelvalidaton[0].length > 0) {
            return res.status(409).send({ status: false, message: 'Channel already exists' })
        }


        const result = await recSettingsModel.channelmappingsiptrunk(3, channel, extension,);

        if (result[0].affectedRows == 1) {
            if (type == 'EXT') {
                redisClient.hset(channel, type, extension)
            } else {
                redisClient.hset(channel, type, extension)
            }
            res.status(200).send({ status: true, message: 'Sucessfully Added' })
        }
    } catch (err) {
        console.log(err);
        log.error(err);
    }
}
exports.getDIDlabelData = async (req, res) => {
    const { limit, offset,recorderTypeId } = req.body
    
    try {
        const result = await recSettingsModel.DIDmappingList(limit, offset,recorderTypeId);
        const count = await recSettingsModel.didMappingCount(recorderTypeId)
        
        audit.auditTrailFunction()
        if (result.length > 0) {
            audit.auditTrailFunction(req.body.adminUserId, 'E-One RECORDER', 'READ', `E One recorder DID mapping accessed`, 'dgDIDLabeling', 0, null, null, null);
            return res.status(200).send({ status: true, data: result[0], count: count[0].totalCount })

        } else {
            return res.status(404).send({ status: false, data: 'No data' })
        }
    }
    catch (err) {
        console.log(err);
        log.error(err);
    }
}


exports.saveDIDlabel = async (req, res) => {
    const { didNumber, didLabel,recorderTypeId } = req.body

    try {
        if (!didNumber||!didLabel) {
            res.status(400).send({ status: false, message: 'Fields cannot be empty' })
        }
        const labelDuplication = await recSettingsModel.labelDuplication(didNumber)
        if (labelDuplication[0].length > 0) {
            return res.status(409).send({ status: false, message: 'DID already exists' })
        }


        const result = await recSettingsModel.labelInsert(recorderTypeId,didNumber,didLabel);

        if (result[0].affectedRows > 0) {
            let newValue = JSON.stringify(req.body)
            audit.auditTrailFunction(req.body.adminUserId, 'E-One RECORDER', 'CREATE', `E One recorder new did label added`, 'dgDIDLabeling', 0, null, newValue, null);
            res.status(200).send({ status: true, message: 'Successfully Added' })
        }
    } catch (err) {
        console.log(err);
        log.error(err);
    }
}
exports.updateDIDlabel = async (req, res) => {
    
    let {  didLabel,didLabelingId } = req.body;
    console.log( didLabel,didLabelingId );

    try {
        if ( !didLabel||!didLabelingId) {
            return res.status(400).send({ status: false, message: 'Fields cannot be empty' });
        }
      
        const result = await recSettingsModel.updateLabel( didLabel,didLabelingId);

        if (result[0].affectedRows > 0) {
            let newValue = JSON.stringify(req.body)
            audit.auditTrailFunction(req.body.adminUserId, 'E-One RECORDER', 'UPDATE', `E One recorder did label updated`, 'dgDIDLabeling', 0, null, newValue, null);
            return res.status(200).send({ status: true, message: 'Successfully Updated' });
        } else {
            return res.status(500).send({ status: false, message: 'Update failed' });
        }
    } catch (err) {
        console.error(err);
        log.error(err);
        return res.status(500).send({ status: false, message: 'Internal Server Error' });
    }
};
exports.deleteDID = async (req, res) => {
    let ids = req.body.id; // Expecting an array of IDs

    try {
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).send({ status: false, message: "Invalid input, expected a non-empty array of IDs" });
        }

        const results = await Promise.allSettled(
            ids.map(async (id) => {
                return recSettingsModel.deleteLabel(id);
            })
        );

        const deletedCount = results.filter(result => result.status === "fulfilled" && result.value[0]?.affectedRows > 0).length;
        const failedCount = results.length - deletedCount;

        if (deletedCount > 0) {
            return res.status(200).send({ 
                status: true, 
                message: `${deletedCount} record(s) deleted successfully`,
                failed: failedCount > 0 ? `${failedCount} failed to delete` : null
            });
        } else {
            return res.status(400).send({ status: false, message: "No records deleted" });
        }
    } catch (err) {
        console.error(err);
        log.error(err);
        return res.status(500).send({ status: false, message: "Server error" });
    }
};

exports.channelmappinglistsiptrunk = async (req, res) => {
    const { limit, offset } = req.body
    try {
        const result = await recSettingsModel.channelmappinglistsiptrunk(limit, offset);
        const count = await recSettingsModel.channelmaapingsigtrunlcount()

        if (result.length > 0) {
            return res.status(200).send({ status: true, data: result[0], count: count[0].totalCount })
        } else {
            return res.status(400).send({ status: false, data: 'No data' })
        }
    } catch (err) {
        console.log(err);
        log.error(err);
    }
}
exports.updatechannelsiptrunk = async (req, res) => {
    const { channel, extension, recorderChannelMappingId } = req.body
    try {
        if (!channel) {
            res.status(400).send({ status: false, message: 'Please enter the channel' })
        }
        if (!extension) {
            res.status(400).send({ status: false, message: 'Please enter the extension' })
        }

        const result = await recSettingsModel.Updatechannelmapping(3, channel, extension, null, recorderChannelMappingId);
        if (result[0].changedRows > 0) {
            res.status(200).send({ status: true, message: 'SIP channel mapping updated  successfully' })
        }

    } catch (error) {
        console.log(error);
        log.error(err);
        res.status(500).json({ error: 'Something went wrong' });

    }

}
exports.devicelist = async (req, res) => {
    try {
        const key = 'DEVICE_LIST';

        // Fetch data from Redis using hgetall
        redisClient.hgetall(key, (err, result) => {
            if (err) {
                log.error(err);
                console.error('Error fetching data from Redis:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            if (!result) {
                return res.status(404).json({ message: 'No data found' });
            }

            // Trim and correct backslashes
            const correctedData = Object.keys(result).reduce((acc, curr) => {
                try {
                    const rawString = result[curr];

                    // Correct escaped backslashes
                    const correctedString = rawString.replace(/\\\\/g, '\\\\');
                    // Parse the corrected JSON string
                    acc[curr] = JSON.parse(correctedString);
                } catch (error) {
                    console.error(`Error parsing JSON for key ${curr}:`, error.message);
                    acc[curr] = `Error parsing JSON: ${error.message}`; // Add an error message for this field
                }
                return acc;
            }, {});

            // Send the corrected data as a response
            res.json(correctedData);
        });
    } catch (error) {
        log.error(error);
        console.error('Error in device list controller:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

exports.updateRecordEnableDisable = async (req, res) => {
    try {
        let { ChannelID, Active } = req.body;  // Extract data from the request body
        const key = 'CHANNEL_MONITOR';
        if (!ChannelID && !Active) {
            res.status(404).send('Enter Channel');
        }
        let oldvalue = Active === 0 ? 1 : 0;
        let enable = Active === 0 ? 'Disable' : 'Enable'

        // Fetch the CHANNEL_MONITOR data from Redis
        redisClient.hget(key, ChannelID, (err, data) => {
            if (err) {


                return res.status(500).send('Error fetching channel data');
            }

            if (data) {
                // Parse the data (assuming it's a JSON string in Redis)
                const channelData = JSON.parse(data);

                // Update the Active status
                channelData.Active = Active;

                // Save the updated channel data back to Redis
                redisClient.hset(key, ChannelID, JSON.stringify(channelData), (err, result) => {


                    if (err) {
                        return res.status(500).send('Error updating active status');
                    }
                    audit.auditTrailFunction(req.body.adminUserId, 'STATION MONITORING', 'UPDATE', `Station monitoring channel ${enable}`, 'CHANNEL_MONITOR', ChannelID, oldvalue, Active, null);
                    return res.status(200).send({ status: true, statusText: 'Channel status updated' });

                });
            } else {
                return res.status(404).send({ status: false, statusText: 'Channel not found' });
            }
        });
    } catch (error) {
        console.log(error);
        log.error(error);
        return res
            .status(500)
            .json({ status: false, statusText: "An error occurred during login" });
    }

}
exports.siptrunkRecorderSettings = async (req, res) => {
    try {
        const bodyValues = req.body.value;
        const selectedDevice = req.body.selectDeviceValue;
        const selectedIndex = req.body.selectedIndex;

        // Create the userData object based on the constant values
        let userData = {};

        // Conditional logic based on 'logstatus'
        if (bodyValues.logstatus === 'Off') {
            userData.LOG = 0;
            userData.LOGGER_STATUS = '0';
        } else {
            userData.LOG = 1;
            userData.LOGGER_STATUS = bodyValues.logstatus;
        }

        // Add remaining fields from the body values to the userData object
        userData = {
            ...userData,
            "DATADRIVE": bodyValues.DataPath,
            "CHINDEX": bodyValues.chindex,
            "MEDIA_FORWARD_IP": bodyValues.mediafwdip,
            "MEDIA_PROXY_IP": bodyValues.MEDIA_PROXY_IP,
            "GATEWAY_IP": bodyValues.gatewayip,
            "RTP_TIMEOUT": bodyValues.rtptimeout,
            "DYNAMIC_CHANNELS": bodyValues.dynamicchannels,
            "PCAP_DUMP": bodyValues.pcapdump,
            "SIP_PORT": bodyValues.sipport,
            "TCP_SIP": bodyValues.TCP_SIP,
            "RTP_PROXY": bodyValues.rtplog,
            "REMOTE_PARTY_ID_DIGITS": bodyValues.remotepartyiddigits,
            "REMOTE_PARTY_ID_EXT": bodyValues.remotepartyid,
            "GRE": bodyValues.gre,
            "DEVICE": selectedIndex,
            "IPCH": bodyValues.ipch,
            "RECORDING_MODE": bodyValues.extension,
            "IPAddress": selectedDevice.ipaddress,
            "MacAddress": selectedDevice.macaddress,
            "Description": selectedDevice.description,
        };
        const publishData = async (channel, message) => {
            try {
                // Publish the message to the specified channel
                const result = await redisClient.publish(channel, JSON.stringify(message));
                console.log(`Message published to channel ${channel}:`, message);
                console.log(`Number of subscribers that received the message: ${result}`);
            } catch (err) {
                log.error(err);
                console.error('Error publishing message:', err);
            }
        };

        const updateRedisAndPublishChanges = async () => {
            // Retrieve the current data from Redis
            const currentData = await redisClient.hgetall('SIP_TRUNK_RECORDER_SETTINGS');

            // Check for changes and store them
            let hasChanges = false;
            const changes = {};

            for (const key in userData) {
                if (userData[key] !== currentData[key]) {
                    hasChanges = true;
                    changes[key] = {
                        oldValue: currentData[key],
                        newValue: userData[key]
                    };
                }
            }

            if (hasChanges) {
                // Update Redis only with the changed fields
                for (const key in changes) {
                    // Update only the changed fields in Redis
                    await redisClient.hset('SIP_TRUNK_RECORDER_SETTINGS', key, changes[key].newValue);

                    // Publish the changes
                    const message = `Value changed for ${key}: old value = ${changes[key].oldValue}, new value = ${changes[key].newValue}`;
                    publishData('SIP_TRUNK_RECORDER_SETTINGS', message);
                }
                res.status(200).send({ status: true, messages: 'sucessfull' });
            } else {
                console.log('No changes detected. Data remains the same.');
            }
        };

        // Call the function to update and publish changes
        await updateRedisAndPublishChanges();



    } catch (error) {
        console.log(error);
        log.error(error);
        return res
            .status(500)
            .json({ status: false, statusText: "An error occurred during login" });
    }


}
exports.siptrunkRecorderSettingsGetData = async (req, res) => {
    try {
        const currentData = await redisClient.hgetall('SIP_TRUNK_RECORDER_SETTINGS');
        if (currentData) {
            return res.status(200).send({ status: true, data: currentData });

        } else {
            return res.status(404).send({ status: false, message: "No Data found" });
        }

    } catch (error) {
        console.log(error);
        log.error(error);
        return res
            .status(500)
            .json({ status: false, statusText: "An error occurred" });


    }
}
exports.fetchTokenConfig = async (req, res) => {
    try {
        const result = await recSettingsModel.fetchTokenConfig()
        if (result.length > 0) {
            return res.status(200).send({ status: true, token: result[0].token });
        } else {
            return res.status(404).send({ status: false, message: "No  Data" })
        }

    } catch (error) {
        console.log(error);
        log.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }

}

exports.fectchSiptrunkRecorderSettings = async (req, res) => {
    try {
        const currentData = await redisClient.hgetall('SIP_TRUNK_RECORDER_SETTINGS');

        if (currentData) {
            return res.status(200).send({ status: true, data: currentData })

        } else {
            return res.status(404).send({ status: false, message: 'NO Data founded' })
        }
    } catch (error) {
        log.error(error);
        res.status(500).json({ error: 'Something went wrong' });

    }

}

exports.insertanalougerecodersettings = async (req, res) => {

    try {
        let userData = {};
        if (req.body.value.logstatus == 'Off') {
            userData.LOG = 0
            userData.LOGGER_STATUS = '0'
        } else {
            userData.LOG = 1
            userData.LOGGER_STATUS = req.body.value.logstatus
        }

        userData = {
            ...userData,
            "DATADRIVE": req.body.value.DataPath,
            "ACH": req.body.value.ACH,
            "MISSCALL": req.body.value.Misscall,
            "ENABLEVOICEFILESPLIT": req.body.value.Enablevoice,
            "VOLTAGE_CAPTURE": req.body.value.Voltage,
            "MAXFILESIZE": req.body.value.Maxfilesize,
            "CHINDEX": req.body.value.chindex,
            "MEDIA_FORWARD_IP": req.body.value.mediafwdip,
            "MEDIA_PROXY_IP": req.body.value.mediaproxy

            // "LOG": req.body.value.log,
            // "LOGGER_STATUS": req.body.value.logstatus,
        };
        // Flatten the object to pass it correctly to HSET
        const userId = 'ANALOG_RECORDER_SETTINGS';

        const publishData = async (channel, message) => {
            try {
                // Publish the message to the specified channel
                const result = await redisClient.publish(channel, JSON.stringify(message));
                console.log(`Message published to channel ${channel}:`, message);

            } catch (err) {
                log.error(err);
                console.error('Error publishing message:', err);
            }
        };

        const updateRedisAndPublishChanges = async () => {
            // Retrieve the current data from Redis
            const currentData = await redisClient.hgetall('ANALOG_RECORDER_SETTINGS');

            // Check for changes and store them
            let hasChanges = false;
            const changes = {};

            for (const key in userData) {
                if (userData[key] !== currentData[key]) {
                    hasChanges = true;
                    changes[key] = {
                        oldValue: currentData[key],
                        newValue: userData[key]
                    };
                }
            }

            if (hasChanges) {
                // Update Redis only with the changed fields
                for (const key in changes) {
                    // Update only the changed fields in Redis
                    await redisClient.hset('ANALOG_RECORDER_SETTINGS', key, changes[key].newValue);

                    // Publish the changes
                    const message = `Value changed for ${key}: old value = ${changes[key].oldValue}, new value = ${changes[key].newValue}`;
                    publishData('ANALOG_RECORDER_SETTINGS', message);
                }
                res.status(200).send({ status: true, messages: 'sucessfull' });
            } else {

            }
        };

        // Call the function to update and publish changes
        const data = await updateRedisAndPublishChanges();





    } catch (err) {
        console.log(err);
        log.error(err);
        res.status(404).send({ status: false, messages: err });
        throw new err;
    }
}
exports.analoguegenralSetting = async (req, res) => {
    try {
        const currentData = await redisClient.hgetall('ANALOG_RECORDER_SETTINGS');

        if (currentData) {
            return res.status(200).send({ status: true, data: currentData })

        } else {
            return res.status(404).send({ status: false, message: 'NO Data founded' })
        }
    } catch (error) {
        log.error(error);
        res.status(500).json({ error: 'Something went wrong' });

    }
}


exports.channelsettingsinsertanalouge = async (req, res) => {

    let { channelId, adminUserId, ...channelData } = req.body;
    if (!channelData) {
        return res.status(404).send({ status: false, messages: 'Please select any data' });
    }
    if (!channelId) {
        channelId = uuidv4()
    }

    try {
        const publishData = async (channel, message) => {
            try {
                // Publish the message to the specified channel
                const result = await redisClient.publish(channel, JSON.stringify(message));
                console.log(`Message published to channel ${channel}:`, message);
            } catch (err) {
                console.error('Error publishing message:', err);
            }
        };
        const dataToStore = {
            ...channelData,
            adminUserId: adminUserId || null // Ensure adminUserId is included, defaulting to null if not provided
        };



        // Append data to a Redis list
        await redisClient.hset('ANALOG_RECORDER_CHANNEL_SETTINGS', channelId, JSON.stringify(dataToStore));

        // Publish the changes
        const message = `New data inserted into ANALOG_RECORDER_CHANNEL_SETTINGS`;
        await publishData('ANALOG_RECORDER_CHANNEL_SETTINGS', message);

        res.status(200).send({ status: true, messages: 'Channel mapped successfully' });
    } catch (error) {
        log.error(error);
        console.log(error);
        res.status(500).send({ status: false, messages: 'Internal server error' });
    }
};

exports.getChanellsettingsDatat = async (req, res) => {

    try {
        const data = await redisClient.hgetall('ANALOG_RECORDER_CHANNEL_SETTINGS');

        if (!data || Object.keys(data).length === 0) {
            res.status(404).send({ status: false, message: 'No data found' });
            return;
        }

        const correctedData = Object.entries(data).reduce((acc, [key, value]) => {
            try {
                // Attempt to parse JSON if it's a valid JSON string
                if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                    const parsedValue = JSON.parse(value);

                    // Merge channelData into the result if found
                    if (parsedValue.channelData) {
                        acc.channelData.push(parsedValue.channelData);
                    }
                } else {
                    // Treat as a simple key-value pair
                    acc.settings[key] = value;
                }
            } catch (error) {
                log.error(error);
                console.error(`Failed to parse key "${key}":`, error);
                acc.errors.push({ key, error: error.message });
            }
            return acc;
        }, { channelData: [], settings: {}, });

        res.status(200).send({ status: true, data: correctedData });
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).send({ status: false, message: 'Internal Server Error' });
    }


}
exports.digitalRecordersettings = async (req, res) => {
    try {
        let userData = {};
        if (req.body.value.logstatus == 'Off') {
            userData.LOG = 0
            userData.LOGGER_STATUS = '0'
        } else {
            userData.LOG = 1
            userData.LOGGER_STATUS = req.body.value.logstatus
        }

        userData = {
            ...userData,
            "DATADRIVE": req.body.value.DataPath,
            "ACH": req.body.value.ACH,
            "MISSCALL": req.body.value.Misscall,
            "ENABLEVOICEFILESPLIT": req.body.value.Enablevoice,
            "VOLTAGE_CAPTURE": req.body.value.Voltage,
            "MAXFILESIZE": req.body.value.Maxfilesize,
            "CHINDEX": req.body.value.chindex,
            "MEDIA_FORWARD_IP": req.body.value.mediafwdip,
            "MEDIA_PROXY_IP": req.body.value.mediaproxy

        };

        const userId = 'DIGITAL_RECORDER_SETTINGS';

        const publishData = async (channel, message) => {
            try {
                // Publish the message to the specified channel
                const result = await redisClient.publish(channel, JSON.stringify(message));
                console.log(`Message published to channel ${channel}:`, message);

            } catch (err) {
                console.error('Error publishing message:', err);
            }
        };

        const updateRedisAndPublishChanges = async () => {
            // Retrieve the current data from Redis
            const currentData = await redisClient.hgetall('DIGITAL_RECORDER_SETTINGS');

            // Check for changes and store them
            let hasChanges = false;
            const changes = {};

            for (const key in userData) {
                if (userData[key] !== currentData[key]) {
                    hasChanges = true;
                    changes[key] = {
                        oldValue: currentData[key],
                        newValue: userData[key]
                    };
                }
            }

            if (hasChanges) {
                // Update Redis only with the changed fields
                for (const key in changes) {
                    // Update only the changed fields in Redis
                    await redisClient.hset('DIGITAL_RECORDER_SETTINGS', key, changes[key].newValue);

                    // Publish the changes
                    const message = `Value changed for ${key}: old value = ${changes[key].oldValue}, new value = ${changes[key].newValue}`;
                    publishData('DIGITAL_RECORDER_SETTINGS', message);
                }
                res.status(200).send({ status: true, messages: 'sucessfull' });
            } else {

            }
        };

        // Call the function to update and publish changes
        await updateRedisAndPublishChanges();

    } catch (err) {
        console.log(err);
        log.error(err);
        res.status(404).send({ status: false, messages: err });
        throw new err;
    }
}
exports.mediapoxiysettings = async (req, res) => {
    const { body } = req.body     
    try {
        let userData = {};
        if (body.logstatus == 'Off') {
            userData.LOG = 0
            userData.LOGGER_STATUS = '0'
        } else {
            userData.LOG = 1
            userData.LOGGER_STATUS = body.logstatus
        }


        userData = {
            ...userData,
            "DATA_PATH": body.DataPath,
            "IPCH": body.ipch,
            "FREESWITCH_PORT": body.freeswitchport,
            "FREESWITCH_RETURN_PORT": body.freeswitchportreturn,
            "SESSION_PORT": body.sessionport,
            "MEDIA_FORWARD_IP": body.mediaforward,
            "LOCAL_IP": body.localip,
            "SET_EXT_AS_AGENT": body.setasextesion,
            "AVAYA_ACTIVE": body.avayaactive,

        };
        // Flatten the object to pass it correctly to HSET
        const userId = 'MEDIA_PROXY_SETTINGS';

        const publishData = async (channel, message) => {
            try {
                // Publish the message to the specified channel
                const result = await redisClient.publish(channel, JSON.stringify(message));
                console.log(`Message published to channel ${channel}:`, message);
                console.log(`Number of subscribers that received the message: ${result}`);
            } catch (err) {
                console.error('Error publishing message:', err);
            }
        };

        const updateRedisAndPublishChanges = async () => {
            // Retrieve the current data from Redis
            const currentData = await redisClient.hgetall('MEDIA_PROXY_SETTINGS');

            // Check for changes and store them
            let hasChanges = false;
            const changes = {};

            for (const key in userData) {
                if (userData[key] !== currentData[key]) {
                    hasChanges = true;
                    changes[key] = {
                        oldValue: currentData[key],
                        newValue: userData[key]
                    };
                }
            }

            if (hasChanges) {
                // Update Redis only with the changed fields
                for (const key in changes) {
                    // Update only the changed fields in Redis
                    await redisClient.hset('MEDIA_PROXY_SETTINGS', key, changes[key].newValue);

                    // Publish the changes
                    const message = `Value changed for ${key}: old value = ${changes[key].oldValue}, new value = ${changes[key].newValue}`;
                    publishData('MEDIA_PROXY_SETTINGS', message);
                }
                res.status(200).send({ status: true, messages: 'sucessfull' });
            } else {
                console.log('No changes detected. Data remains the same.');
            }
        };

        // Call the function to update and publish changes
        const data = await updateRedisAndPublishChanges();
    } catch (err) {
        console.log(err);
        log.error(err);
        throw new err;
    }

}
exports.getDigitalDatasettings = async (req, res) => {
    try {
        const currentData = await redisClient.hgetall('DIGITAL_RECORDER_SETTINGS');
        if (currentData) {
            return res.status(200).send({ status: true, data: currentData });

        } else {
            return res.status(404).send({ status: false, message: "No Data found" });
        }

    } catch (error) {
        log.error(error);
        console.log(error);
        return res
            .status(500)
            .json({ status: false, statusText: "An error occurred" });


    }
}

exports.mediaproxyGetData = async (req, res) => {
    try {
        const currentData = await redisClient.hgetall('MEDIA_PROXY_SETTINGS');
        if (currentData) {
            return res.status(200).send({ status: true, data: currentData });

        } else {
            return res.status(404).send({ status: false, message: "No Data found" });
        }

    } catch (error) {
        log.error(error);
        console.log(error);
        return res
            .status(500)
            .json({ status: false, statusText: "An error occurred" });


    }
}
exports.voltageenergy = async (req, res) => {
    try {
        const voltage = await redisClient.hgetall('VOLTAGE_LINE');
        const energy = await redisClient.hgetall('ENERGY_LINE')
        if (voltage || energy) {

            let voltageKeys = Object.keys(voltage)

            let data = []

            for (let i = 0; i < voltageKeys.length; i++) {
                data.push({ channel: voltageKeys[i], voltage: voltage[voltageKeys[i]], energy: energy[voltageKeys[i]] })
            }

            return res.status(200).send({
                status: true,
                data: data
            });
        } else {
            return res.status(404).send({ status: false, message: "No Data found" });
        }

    } catch (error) {
        log.error(error);
        console.log(error);
        return res
            .status(500)
            .json({ status: false, statusText: "An error occurred" });
    }

}

exports.digitalrecorderevent = async (req, res) => {
    try {
        const isstaticevent = 0
        const { digitalevent, category } = req.body
        if (!digitalevent) {
            return res.status(204).send({ status: false, message: "Please enter event" });
        }
        const isExist = await recSettingsModel.digitarecordereventalexist(digitalevent, category)

        if (isExist[0].recordCount > 0) {
            return res.status(409).send({ status: false, message: "Event already exist" });
        }

        const response = await recSettingsModel.digitarecorderevent(digitalevent, null, category, isstaticevent)
        // console.log(response[0].insertId>0);

        if (response[0].insertId > 0) {
            return res.status(200).send({
                status: true,
                messages: 'Succesful'
            });
        } else {
            return res.status(404).send({ status: false, message: "Error to insertdata" });
        }



    } catch (error) {
        log.error(error);
        return res
            .status(500)
            .json({ status: false, statusText: "An error occurred" });
    }
}

exports.getEventMangement = async (req, res) => {
    try {
        const data = await recSettingsModel.digitalrecoredereventget()
        // console.log(data);
        if (data.length > 0) {
            return res.status(200).send({
                status: true,
                data: data
            });
        } else {
            return res.status(404).send({ status: false, message: "No Data found" });
        }

    } catch (error) {
        log.error(error);
        return res
            .status(500)
            .json({ status: false, statusText: "An error occurred" });
    }


}
exports.deleteEvents = async (req, res) => {
    try {
        // console.log(req.body);
        const { digitalevent } = req.body
        if (!digitalevent) {
            return res.status(204).send({ status: false, message: "Please enter event" });
        }
        const deleteddata = await recSettingsModel.digitalrecoredereventdelete(digitalevent)
        if (deleteddata.affectedRows > 0) {
            return res.status(200).send({
                status: true,
                messages: 'Succesful'
            });
        } else {
            return res.status(404).send({ status: false, message: "Error to Delete data" });
        }




    } catch (error) {
        log.error(error);
        return res
            .status(500)
            .json({ status: false, statusText: "An error occurred" });
    }

}

exports.eventsredis = async (req, res) => {
    const { STARTRECORD, STOPRECORD, CALLINFO, INGOREEVENT, DIRECTION, } = req.body
    // console.log(STARTRECORD,STOPRECORD,DIRECTION,INGOREEVENT,CALLINFO,'body');
    const finalData = [STARTRECORD, STOPRECORD, DIRECTION, INGOREEVENT, CALLINFO]

    try {
        async function storeDataInRedis() {
            for (const item of finalData) {
                await redisClient.set(item.events, JSON.stringify(item.values));
                //   console.log(`Stored in Redis: ${item.events} -> ${JSON.stringify(item.values)}`);
            }

        }
        storeDataInRedis().then(() => res.status(200).send({
            status: true,
            messages: 'Succesful'
        })).catch((err) => res
            .status(500)
            .json({ status: false, statusText: "An error occurred" })
        );
    } catch (error) {
        log.error(error);
        console.log(error);

    }


}
exports.geteventsredis = async (req, res) => {
    async function getDataForMultipleEvents(eventNames) {
        try {
            const response = {};

            for (const eventName of eventNames) {
                const result = await redisClient.get(eventName);
                response[eventName] = result ? JSON.parse(result) : []; // Store array or empty array
            }

            return response; // Return JSON object
        } catch (error) {
            log.error(error);
            console.error("❌ Error retrieving data from Redis:", error);
            return { error: "Failed to fetch data from Redis" };
        }
    }

    // Example Usage:
    const eventsArray = ["START_RECORD", "STOP_RECORD", "DIRECTION", "CALL_INFO", "IGNORE_EVENTS"];
    //   getDataForMultipleEvents(eventsArray);
    getDataForMultipleEvents(eventsArray).then((data) => res.status(200).send({
        status: true,
        data: data
    })).catch((err) => 
        
        res
        .status(500)
        .json({ status: false, statusText: "An error occurred" })
    );

}
exports.removefromredisevent = async (req, res) => {
    const { event, values } = req.body
    try {
        if (!event || !values) {
            return res.status(204).send({ status: false, message: "Please enter event" });
        }
        const keyarryas = [values]


        const data = await redisClient.set(event, JSON.stringify(keyarryas));
        if (data == 'OK') {
            return res.status(200).send({
                status: true,
                messages: 'Succesful'
            });
        } else {
            return res.status(404).send({ status: false, message: "Error to insertdata" });
        }
    } catch (error) {
        log.error(error);

        return res
            .status(500)
            .json({ status: false, statusText: "An error occurred" });
    }
}

exports.deleteAnagloueData = async (req, res) => {

    const { channelName } = req.body; // Assuming channelNames is an array of strings

    // Check if channelNames is provided and is an array
    if (!Array.isArray(channelName) || channelName.length === 0) {
        return res.status(400).send({ status: false, message: 'No channel names provided' });
    }

    async function deleteChannels(channelName) {
        try {
            // Loop through the array of channel names and delete each
            for (const channelNamedata of channelName) {
                const result = await redisClient.hdel("ANALOG_RECORDER_CHANNEL_SETTINGS", channelNamedata);

                // Check if the channel was successfully deleted
                if (result === 1) {
                    console.log(`Channel '${channelNamedata}' deleted successfully.`);
                } else {
                    console.log(`Channel '${channelNamedata}' not found.`);
                }
            }

            // Send a success message after attempting to delete all channels
            res.status(200).send({
                status: true,
                message: `${channelName.length} channel(s) processed for deletion.`,
            });
        } catch (error) {
            log.error(error);
            console.error("Error deleting channels:", error);
            res.status(500).send({ status: false, message: 'Error deleting channels' });
        }
    }

    // Call the deleteChannels function
    deleteChannels(channelName);

}
exports.insertEoneRecorder = async (req, res) => {
    let body = req.body;


    try {
        let userData = {};
        if (req.body.value.logstatus == 'Off') {
            userData.LOG = 0
            userData.LOGGER_STATUS = '0'
        } else {
            userData.LOG = 1
            userData.LOGGER_STATUS = req.body.value.logstatus
        }
        if (req.body.value.staticchannel == '0') {
            userData.STATIC_CHANNELS = 0
        } else {

            userData.STATIC_CHANNELS = 1
            userData.BASE_NUMBER = req.body.value.basenumber
            userData.BASE_NUMBER_START = req.body.value.basenumberstart

        }

        userData = {
            ...userData,
            "DATADRIVE": req.body.value.DataPath,
            "ECH": req.body.value.ACH,
            "MAXFILESIZE": req.body.value.Maxfilesize,
            "CHINDEX": req.body.value.chindex,
            "MEDIA_FORWARD_IP": req.body.value.mediafwdip,
            "MEDIA_PROXY_IP": req.body.value.mediaproxy,

        };
        // Flatten the object to pass it correctly to HSET
        const userId = 'E1_RECORDER_SETTINGS';

        const publishData = async (channel, message) => {
            try {
                // Publish the message to the specified channel
                const result = await redisClient.publish(channel, JSON.stringify(message));
                console.log(`Message published to channel ${channel}:`, message);

            } catch (err) {
                log.error(err);
                console.error('Error publishing message:', err);
            }
        };

        const updateRedisAndPublishChanges = async () => {
            // Retrieve the current data from Redis
            const currentData = await redisClient.hgetall('E1_RECORDER_SETTINGS');

            // Check for changes and store them
            let hasChanges = false;
            const changes = {};

            for (const key in userData) {
                if (userData[key] !== currentData[key]) {
                    hasChanges = true;
                    changes[key] = {
                        oldValue: currentData[key],
                        newValue: userData[key]
                    };
                }
            }

            if (hasChanges) {
                // Update Redis only with the changed fields
                for (const key in changes) {
                    // Update only the changed fields in Redis
                    await redisClient.hset('E1_RECORDER_SETTINGS', key, changes[key].newValue);

                    // Publish the changes
                    const message = `Value changed for ${key}: old value = ${changes[key].oldValue}, new value = ${changes[key].newValue}`;
                    publishData('E1_RECORDER_SETTINGS', message);
                }
                res.status(200).send({ status: true, messages: 'sucessfull' });
            } else {

            }
        };

        // Call the function to update and publish changes
        const data = await updateRedisAndPublishChanges();

    } catch (err) {
        console.log(err);
        log.error(err);
        res.status(404).send({ status: false, messages: err });
        throw new err;
    }
}

exports.geteoneData = async (req, res) => {
    try {
        const currentData = await redisClient.hgetall('E1_RECORDER_SETTINGS');

        if (currentData) {
            return res.status(200).send({ status: true, data: currentData })

        } else {
            return res.status(404).send({ status: false, message: 'NO Data founded' })
        }
    } catch (error) {
        log.error(error);
        res.status(500).json({ error: 'Something went wrong' });

    }
}