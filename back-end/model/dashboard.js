const db = require('../utils/DAL');
const bcrypt = require('bcrypt');

var log = require('log4js').getLogger("User");
class dashboard {

    // Fetch Dashboard Features
    static async getDashboardFeatures(userId) {
        try {
            return await db.execute(`SELECT 
                f.dashboardFeatureName, 
                f.callRecordingDashboardFeatureId, 
                f.active, 
                IFNULL(uf.active, 0) AS userFeatureActive 
            FROM 
                dgCallRecordingDashboardFeature f
            LEFT JOIN 
                dgCallRecordingDashboardUserFeature uf 
            ON 
                f.callRecordingDashboardFeatureId = uf.callRecordingDashboardFeatureId 
            AND 
                uf.userId = ${userId};`);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    // Fetch Licence key
    static async fetchDisconnectStatus() {
        try {
            return await db.execute("SELECT COUNT(*) AS DisconnectStatus FROM dgChannel WHERE channelStatus = 0;");
        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    // Daily Call Traffic Status
    static async getDailyCallTrafficStatus(startDay, endDate) {
        try {
            // Pass parameters as an array in the second argument to execute()
            return await db.execute(`Call spGetCallRecordingDashboardDailyCallTraffic(?, ?)`, [startDay, endDate]);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    static async getCallTypeTraffic(startDay, endDate) {
        try {
            // Pass parameters as an array in the second argument to execute()
            return await db.execute(`Call spGetCallRecordingDashboardCallTypeTraffic(?, ?)`, [startDay, endDate]);


        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    static async getFrequentCall(startDay, endDate) {
        try {
            // Pass parameters as an array in the second argument to execute()
            return await db.execute(`Call spGetCallRecordingDashboardFrequentCall(?, ?)`, [startDay, endDate]);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    static async getConcurrentCall(startDay, endDate) {
        try {
            // Pass parameters as an array in the second argument to execute()
            return await db.execute(`Call spGetCallRecordingDashboardMaxConcurrentCall(?, ?)`, [startDay, endDate]);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    // Get Channel Time Status
    static async getChannelTimeStatus(startDay, endDate, userId,pagenumber,recorderPage,columnname,sort) {    
        try {
            // Pass parameters as an array in the second argument to execute()
            return await db.execute(`Call spGetCallRecordingDashboardStationTimeActivity(?, ?, ?,?,?,?,?)`, [startDay, endDate, userId,pagenumber,recorderPage,columnname,sort]);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    // Get Channel Time Status
    static async getChannelCallStatus(startDay, endDate, userId,pagenumber,recorderPage,columnname,sort) {
    
        
        try {
            // Pass parameters as an array in the second argument to execute()
            return await db.execute(`Call spGetCallRecordingDashboardStationCallActivity(?, ?, ?,?,?,?,?)`, [startDay, endDate, userId,pagenumber,recorderPage,columnname,sort]);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    // Get Agent Time Status
    static async getAgentTimeStatus(startDay, endDate, userId,pagenumber,recorderPage,columnname,sort) {             
        try {
            // Pass parameters as an array in the second argument to execute()
            return await db.execute(`Call spGetCallRecordingDashboardAgentTimeActivity(?, ?, null,?,?,?,?)`, [startDay,endDate,pagenumber,recorderPage,columnname,sort]);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    // Get Agent Call Status
    static async getAgentCallStatus(startDay, endDate, userId,pagenumber,recorderPage,columnname,sort) {

        try {
            // Pass parameters as an array in the second argument to execute()
            return await db.execute(`Call spGetCallRecordingDashboardAgentCallActivity(?,?, null,?,?,?,?)`, [startDay, endDate,pagenumber,recorderPage,columnname,sort]);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    static async getziptrunke1recoder(pagenumber, recorderPage,sort,startData,endDate) {    
        try {
            // Pass parameters as an array in the second argument to execute()
            return await db.execute(`Call spGetExtensionSummaryReport(null,null,?,?,null,null,?,?,null,null,?)`, [startData,endDate, pagenumber, recorderPage,sort]);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    // validate User Id
    static async validateUserId(userId) {
        try {
            return await db.execute(`SELECT * from dgCallRecordingDashboardUserFeature where userId = ${userId}`);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }

    // validate User Id
    static async validateSettingUserId(userId) {
        try {
            return await db.execute(`SELECT callRecordingDashboardUserFeatureId 
      FROM dgCallRecordingDashboardUserFeature 
      WHERE userId = ${userId} AND active = 1`);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    // fetch Features
    static async fetchFeatures(featureIds) {
        try {
            return await db.execute(`SELECT * 
      FROM dgCallRecordingDashboardUserFeatureExtension 
      WHERE callRecordingDashboardUserFeatureId IN (${featureIds}) AND active = 1`);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }

    // fetch Features
    static async fetchAgentFeatures(featureIds) {
        try {
            return await db.execute(`SELECT * 
  FROM dgCallRecordingDashboardUserFeatureAgent 
  WHERE callRecordingDashboardUserFeatureId IN (${featureIds}) AND active = 1`);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    // insert features
    static async insertfeatures(userId, datas) {
        try {

            // Prepare an array to hold the values for insertion
            const insertValues = datas.map(feature => {
                //3 - channel status , 10 - Active userd, 11 - Recent Users
                const isActive = [3, 10, 11].includes(feature.callRecordingDashboardFeatureId) ? 1 : feature.selected;
                return `(${userId}, ${feature.callRecordingDashboardFeatureId}, ${isActive})`;
            }).join(', ');

            // Construct the SQL insert query
            const insertQuery = `INSERT INTO dgCallRecordingDashboardUserFeature (userId, callRecordingDashboardFeatureId, active) VALUES ${insertValues};`;

            // Execute the insert query
            const [result] = await db.execute(insertQuery);


            // Return a success message or the number of rows inserted
            return {
                status: true,
                message: "Insertion completed successfully.",
                insertedRows: result.affectedRows // Number of rows inserted
            };
        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    // Update features 
    static async updateFeatures(userId, datas, filtersettings, selectedTabIndex, AgentSettings) {
        try {
            const [features] = [datas];
            // console.log("features",features);

            let callDashboardStatus = 0;
            let timeDashboardStatus = 0;
            let ChannelCallDashboardUserFeatureId = 0;
            let ChannelTimeDashboardUserFeatureId = 0;
            let AgentDurationStatus = 0;
            let AgentCallStatus = 0;
            let AgentDurationUserFeatureId = 0;
            let AgentCallUserFeatureId = 0;
            // Loop through each data object in the datas array
            for (const feature of features) {

                if (feature.callRecordingDashboardFeatureId == 1 && feature.selected) {
                    timeDashboardStatus = 1;
                    const [[callRecordingDashboardUserFeatureId]] = await db.execute(`
                            select callRecordingDashboardUserFeatureId from dgCallRecordingDashboardUserFeature where
                            userId = ? AND callRecordingDashboardFeatureId = ?
                        `, [userId, feature.callRecordingDashboardFeatureId]);
                    ChannelTimeDashboardUserFeatureId = callRecordingDashboardUserFeatureId.callRecordingDashboardUserFeatureId
                }
                if (feature.callRecordingDashboardFeatureId == 2 && feature.selected) {
                    callDashboardStatus = 1;
                    const [[callRecordingDashboardUserFeatureId]] = await db.execute(`
                            select callRecordingDashboardUserFeatureId from dgCallRecordingDashboardUserFeature where
                            userId = ? AND callRecordingDashboardFeatureId = ?
                        `, [userId, feature.callRecordingDashboardFeatureId]);
                    ChannelCallDashboardUserFeatureId = callRecordingDashboardUserFeatureId.callRecordingDashboardUserFeatureId;
                }
                if (feature.callRecordingDashboardFeatureId == 7 && feature.selected) {
                    AgentDurationStatus = 1;
                    const [[callRecordingDashboardUserFeatureId]] = await db.execute(`
                        select callRecordingDashboardUserFeatureId from dgCallRecordingDashboardUserFeature where
                        userId = ? AND callRecordingDashboardFeatureId = ?
                    `, [userId, feature.callRecordingDashboardFeatureId]);
                    AgentDurationUserFeatureId = callRecordingDashboardUserFeatureId.callRecordingDashboardUserFeatureId;
                }
                if (feature.callRecordingDashboardFeatureId == 8 && feature.selected) {
                    AgentCallStatus = 1;
                    const [[callRecordingDashboardUserFeatureId]] = await db.execute(`
                        select callRecordingDashboardUserFeatureId from dgCallRecordingDashboardUserFeature where
                        userId = ? AND callRecordingDashboardFeatureId = ?
                    `, [userId, feature.callRecordingDashboardFeatureId]);
                    AgentCallUserFeatureId = callRecordingDashboardUserFeatureId.callRecordingDashboardUserFeatureId;
                }

                // Determine the active status based on the feature ID and selected value
                //3 - channel status , 10 - Active userd, 11 - Recent Users
                const isFeatureInArray = [3, 10, 11].includes(feature.callRecordingDashboardFeatureId);
                const activeStatus = isFeatureInArray || feature.selected ? 1 : 0;

                // Update the active status for the existing feature record
                const [updateResult] = await db.execute(`
                        UPDATE dgCallRecordingDashboardUserFeature 
                        SET active = ?, modifiedDate = current_timestamp()
                        WHERE userId = ? AND callRecordingDashboardFeatureId = ?
                    `, [activeStatus, userId, feature.callRecordingDashboardFeatureId]);


                // Optionally, log or handle the case where no rows were affected
                if (updateResult.affectedRows === 0) {
                    console.log(`No record found for userId ${userId} and featureId ${feature.callRecordingDashboardFeatureId}`);
                }
            }


            // Helper function to handle both update and insert logic
            async function handleAgents(settingsArray, featureId, isUpdate, status) {
                let type
                if (settingsArray.name == 'Agent Time Activity') {
                    type = 1
                } else if (settingsArray.name == 'Agent Call Activity') {
                    type = 2
                }
                let agentCodesString
                if (settingsArray.agentCodes) {
                    const agentCodes = settingsArray.agentCodes;
                    agentCodesString = agentCodes.join(',');
                }


                if (isUpdate) {
                    if (agentCodesString !== undefined) {
                        // Update query
                        const updateQuery = `
                        UPDATE dgCallRecordingDashboardUserFeatureAgent 
                        SET agentCode = "${agentCodesString}", active = '${status}', type = ${type}
                        WHERE callRecordingDashboardUserFeatureId = ${featureId};
                    `;

                        // Execute the update query
                        const [result] = await db.execute(updateQuery);
                    }
                } else {
                    // Insert query
                    const insertQuery = `
                        INSERT INTO dgCallRecordingDashboardUserFeatureAgent 
                        (agentCode, callRecordingDashboardUserFeatureId, active, type) 
                        VALUES ('${agentCodesString}', ${featureId}, ${status}, ${type});
                    `;
                    // Execute the insert query
                    const [result] = await db.execute(insertQuery);
                }

            }

            if (AgentDurationUserFeatureId !== 0 || AgentCallUserFeatureId !== 0) {

                // Check if 'Station Time Activity' exists
                const [[DashboardUserFeatureIdStatus]] = await db.execute(`
                    SELECT callRecordingDashboardUserFeatureId 
                    FROM dgCallRecordingDashboardUserFeatureAgent 
                    WHERE callRecordingDashboardUserFeatureId = ?
                `, [AgentDurationUserFeatureId]);

                // Check if 'Station Call Activity' exists
                const [[DashboardCallUserFeatureIdStatus]] = await db.execute(`
                    SELECT callRecordingDashboardUserFeatureId 
                    FROM dgCallRecordingDashboardUserFeatureAgent 
                    WHERE callRecordingDashboardUserFeatureId = ?
                `, [AgentCallUserFeatureId]);

                // Determine if updates or inserts are required based on query results
                const isUpdate = !!DashboardUserFeatureIdStatus;
                const isCallUpdate = !!DashboardCallUserFeatureIdStatus;

                // Filter out undefined elements from filtersettings
                const validSettingsArray = AgentSettings.filter((settings) => settings !== undefined);

                // Loop through valid filter settings and handle upsert based on activity type
                // for (const settingsArray of validSettingsArray) {

                //     if (settingsArray.name === 'Agent Time Activity') {
                //         // Perform update or insert for 'Station Time Activity'
                //         await handleAgents(settingsArray, AgentDurationUserFeatureId, isUpdate, AgentDurationStatus);
                //     } else if (settingsArray.name === 'Agent Call Activity') {
                //         // Perform update or insert for 'Station Call Activity'
                //         await handleAgents(settingsArray, AgentCallUserFeatureId, isCallUpdate, AgentCallStatus);
                //     }
                // }
            }


            // Helper function to handle both update and insert logic
            async function handleUpsert(settingsArray, featureId, isUpdate, status, selectedTabIndex, extensions) {

                if (selectedTabIndex) {
                    // Destructure the object
                    const { locationId, departmentId, divisionId, extensionNumber } = settingsArray;

                    // Convert arrays to comma-separated strings for SQL
                    const locationIdString = locationId.join(',');
                    const departmentIdString = departmentId.join(',');
                    const divisionIdString = divisionId.join(',');
                    const extensionNumberString = extensionNumber.join(',');

                    if (isUpdate) {
                        // Update query
                        const updateQuery = `
                        UPDATE dgCallRecordingDashboardUserFeatureExtension 
                        SET locationId = '${locationIdString}', departmentId = '${departmentIdString}', 
                            divisionId = '${divisionIdString}', extensionNumber = '${extensionNumberString}',
                            active = '${status}', type = ${selectedTabIndex}
                        WHERE callRecordingDashboardUserFeatureId = ${featureId};
                    `;

                        // Execute the update query
                        const [result] = await db.execute(updateQuery);

                    } else {
                        // Insert query
                        const insertQuery = `
                        INSERT INTO dgCallRecordingDashboardUserFeatureExtension 
                        (locationId, departmentId, divisionId, extensionNumber, callRecordingDashboardUserFeatureId, active, type) 
                        VALUES ('${locationIdString}', '${departmentIdString}', '${divisionIdString}', '${extensionNumberString}', ${featureId}, ${status},  ${selectedTabIndex});
                    `;

                        // Execute the insert query
                        const [result] = await db.execute(insertQuery);

                    }
                } else {
                    const extensionNumberString = extensions.join(',');
                    if (isUpdate) {

                        // Update query
                        const updateQuery = `
                        UPDATE dgCallRecordingDashboardUserFeatureExtension 
                        SET locationId = null, departmentId = null, 
                            divisionId = null, extensionNumber = '${extensionNumberString}',
                            active = '${status}', type = ${selectedTabIndex}
                        WHERE callRecordingDashboardUserFeatureId = ${featureId};
                    `;

                        // Execute the update query
                        const [result] = await db.execute(updateQuery);

                    } else {
                        // Insert query
                        const insertQuery = `
                        INSERT INTO dgCallRecordingDashboardUserFeatureExtension 
                        (locationId, departmentId, divisionId, extensionNumber, callRecordingDashboardUserFeatureId, active, type) 
                        VALUES (null, null, null, '${extensionNumberString}', ${featureId}, ${status},  ${selectedTabIndex});
                    `;

                        // Execute the insert query
                        const [result] = await db.execute(insertQuery);

                    }
                }

            }

            if (ChannelCallDashboardUserFeatureId !== 0 || ChannelTimeDashboardUserFeatureId !== 0) {
                // Check if 'Station Time Activity' exists
                const [[DashboardUserFeatureIdStatus]] = await db.execute(`
                    SELECT callRecordingDashboardUserFeatureId 
                    FROM dgCallRecordingDashboardUserFeatureExtension 
                    WHERE callRecordingDashboardUserFeatureId = ?
                `, [ChannelTimeDashboardUserFeatureId]);

                // Check if 'Station Call Activity' exists
                const [[DashboardCallUserFeatureIdStatus]] = await db.execute(`
                    SELECT callRecordingDashboardUserFeatureId 
                    FROM dgCallRecordingDashboardUserFeatureExtension 
                    WHERE callRecordingDashboardUserFeatureId = ?
                `, [ChannelCallDashboardUserFeatureId]);

                // Determine if updates or inserts are required based on query results
                const isUpdate = !!DashboardUserFeatureIdStatus;
                const isCallUpdate = !!DashboardCallUserFeatureIdStatus;
                // Filter out undefined elements from filtersettings
                const validSettingsArray = filtersettings.filter((settings) => settings !== undefined);

                // Loop through valid filter settings and handle upsert based on activity type
                // for (const settingsArray of validSettingsArray) {

                //     if (settingsArray.name === 'Station Time Activity') {        
                //         // Perform update or insert for 'Station Time Activity'
                //         await handleUpsert(settingsArray, ChannelTimeDashboardUserFeatureId, isUpdate, timeDashboardStatus, settingsArray.selectedTabIndex, settingsArray.extensions);
                //     } else if (settingsArray.name === 'Station Call Activity') {
                //         // Perform update or insert for 'Station Call Activity'
                //         await handleUpsert(settingsArray, ChannelCallDashboardUserFeatureId, isCallUpdate, callDashboardStatus, settingsArray.selectedTabIndex, settingsArray.extensions);
                //     }
                // }
            }

            return { status: true, message: "Features updated successfully." };
        } catch (err) {
            log.error(err);
            throw err;
        }
    }
    static async getExtensions() {
        try {
            return await db.execute(`SELECT * 
      FROM dgExtension 
      where active = 1`);
        } catch (err) {
            log.error(err);
            throw err;
        }

    }
    // Agent Codes
    static async agentCodes() {
        try {
            return await db.execute(`SELECT * 
      FROM dgUser 
      where active = 1 AND agentCode != 'null'`);
        } catch (err) {
            log.error(err);
            throw err;
        }

    }
    // updateDashboard
    static async updateDashboard(userId, dashboardName) {
        try {

            return await db.execute(`UPDATE dgCallRecordingDashboardUserFeature
                SET active = 0
                WHERE userId = ${userId}
                AND callRecordingDashboardFeatureId = (
                    SELECT callRecordingDashboardFeatureId
                    FROM dgCallRecordingDashboardFeature
                    WHERE dashboardFeatureName = '${dashboardName}'
                );`);
        } catch (err) {
            log.error(err);
            throw err;
        }

    }
    static async fetchgeneralsettings(userid) {
        try {
            return await db.execute(`select * from dgCallRecordingDashboardUserFeature where active=1 AND userId=?`,[userid])
        } catch (error) {
            console.log(error);

        }
    }
}

module.exports = { dashboard };