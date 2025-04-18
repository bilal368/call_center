let log = require("log4js").getLogger("System Management");
const sysModel = require('../model/systemInfo')
const sysInfo = sysModel.systemInfo
const archive = sysModel.archive
const autoDelete = sysModel.autoDelete
const mailer = sysModel.mailer
const reports = require("../model/reports");
const { calls } = reports;
const fs = require('fs');
const bcrypt = require("bcrypt");
const redisClient = require('../redisconnection');
const audit = require("../auditTrail");
const cron = require('node-cron');
const moment = require("moment");
// const systemInfo = systemInfo.systemInfo
// for archive
const convert = require('xml-js');
const path = require('path');
exports.uploadLogo = async (req, res) => {
    const logoImage = req.file;
    const adminUserId = req.body.adminUserId
    if (!req.file) {
        log.error('No file uploaded.')
        return res.status(400).send('No file uploaded.');

    }

    try {
        const result = await sysInfo.updateLogoName(logoImage.filename);
        if (result.changedRows > 0) {
            audit.auditTrailFunction(adminUserId, 'SYSTEM MANAGEMENT', 'UPLOAD', `Logo Uploaded`, 'dgOrganizationDetails', 0, null, null, null)
            res.status(200).json({ status: true, statusText: "Image uploaded successfully" });
        } else {
            res.status(406).json({ status: false, statusText: "Update file name failed" });
        }
    } catch (error) {
        log.error(error)
        console.log('Error', error)
        res.status(404).json({ status: false, statusText: "Upload failed" });
    }
};
exports.getLogoName = async (req, res) => {
    try {
        const result = await sysInfo.getLogoName()

        if (result.length > 0) {
            res.status(200).json({ status: true, statusText: "Logo name fetched successfully", logoImageFileName: result[0].logoImageFileName })
        } else {
            log.error('No data found')
            res.status(404).json({ status: false, statusText: "No data found" })
        }
    } catch (error) {
        log.error(error)
        console.log('Error', error)
        res.status(500).json({ status: false, statusText: "Internal server error", error: error });

    }
}
exports.getRegistrationDetails = async (req, res) => {
    try {

        const adminUserId = req.body.adminUserId
        const [result1] = await sysInfo.getRegistrationDetails()
        const [result2] = await sysInfo.getLicenseKey()
        const data = { ...result1, ...result2 }

        if (result1) {
            audit.auditTrailFunction(adminUserId, 'SYSTEM MANAGEMENT', 'READ', `Registration details accessed`, 'dgOrganizationDetails', 0, null, null, null)
            res.status(200).json({ status: true, statusText: "Registration details fetched successfully", data: data })
        } else {
            res.status(404).json({ status: false, statusText: "No data found", data: data })
        }
    } catch (error) {
        log.error(error)
        console.log('Error', error)
        res.status(500).json({ status: false, statusText: "Internal server error" });

    }
}
exports.saveRegistration = async (req, res) => {
    try {
        const { organizationName, address1, city, phone, email, address2, state, fax, website, adminUserId } = req.body;
        const result = await sysInfo.saveRegistration(organizationName, address1, city, phone, email, address2, state, fax, website)

        if (result) {
            let newValue = JSON.stringify(req.body)
            audit.auditTrailFunction(adminUserId, 'SYSTEM MANAGEMENT', 'CREATE', `Registration details saved`, 'dgOrganizationDetails', 1, null, newValue, null)

            res.status(200).json({ status: true, statusText: "Registration details saved successfully", data: result })
        } else {
            res.status(404).json({ status: false, statusText: "No data found", data: result })
        }
    } catch (error) {
        console.log('error', error);
        log.error(error)
        res.status(500).json({ status: false, statusText: "Internal server error" });

    }
}
exports.getDiskUsage = async (req, res, next) => {
    try {
        // Fetch the Redis key asynchronously
        const diskUsage = await redisClient.get(process.env.GET_DISK_USAGE_KEY);
        if (diskUsage) {
            // Parse and respond with the disk usage
            const parsedUsage = JSON.parse(diskUsage);
            return res.status(200).json({
                diskUsage: parsedUsage,
                status: true,
                statusText: "Disk Usage fetched successfully"
            });

        }
        return res.status(404).json({
            status: false,
            statusText: "DISK_USED_PERCENTAGE is empty"
        });

    } catch (error) {
        log.error(error)
        console.error('Error fetching DISK_USED_PERCENTAGE:', error);
        return res.status(500).json({
            status: false,
            statusText: "Internal server error",
            error: error.message
        });
    }
};

exports.manualArchive = async (req, res, next) => {
    const { isActivePath, archiveFileName, mount_point, adminUserId } = req.body;
    // Validate input
    if (!mount_point || typeof isActivePath !== 'boolean' || !archiveFileName) {
        log.error('Invalid input')
        return res.status(400).json({
            status: false,
            statusText: "Invalid input"
        });
    }
    if (isActivePath) {
        try {
            await archive.resetDefaultLocation();
        } catch (error) {
            log.error(error)
            console.error(error)
        }
    }
    try {
        // Fetch call reports
        let inDialledNumber, inExtensionNumber, inCallDirection, inAgentCode, inColorCode,
            inChannelName, inAgentName, inCallStartDateTime, inCallEndDateTime, inPageNumber,
            inRecordsPerPage, inUserId, inSortColumn, inSortOrder, inSelectedTag
            ;

        const jsonData = await calls.getCallReports(
            inDialledNumber,
            inExtensionNumber,
            inCallDirection,
            inAgentCode,
            inColorCode,
            inChannelName,
            inAgentName,
            inCallStartDateTime,
            inCallEndDateTime,
            "00:00:00",
            "23:59:59",
            inPageNumber,
            inRecordsPerPage,
            inUserId,
            inSortColumn,
            inSortOrder,
            inSelectedTag
        );

        // Check if jsonData is an array of arrays
        if (Array.isArray(jsonData) && jsonData.length > 0) {
            // Transform jsonData to the desired XML format
            const xmlData = {
                root: {
                    row: jsonData[0].map(call => ({
                        CST: call.callStartTime ? call.callStartTime.toISOString() : '', // Call Start Time
                        CET: call.callEndTime ? call.callEndTime.toISOString() : '',   // Call End Time
                        DUR: call.duration || '',                                     // Call Duration
                        DN: call.dialledNumber || '',                                 // Dialled Number
                        CID: call.callerId || '',
                        // Caller ID
                        CN: call.channelName || '',                                   // Channel Name
                        EN: call.extensionNumber || '',                               // Extension Number
                        AC: call.agentCode || '',                                     // Agent Code
                        AN: call.agentName || '',                                     // Agent Name
                        RFN: call.recordedFileName || '',                             // Recorded File Name
                        CD: call.callDirection || '',                                 // Call Direction
                        CDT: call.callDirectionText || '',                            // Call Direction Text
                        RCID: call.recordingCallLogId || '',                          // Recording Call Log ID
                        isLocked: call.isLocked || '',                                // Is Locked
                        notes: call.notes || '',                                      // Notes
                        SF: call.supervisorFeedBack || '',                            // Supervisor Feedback
                        CCID: call.colorCodeId || '',                                 // Color Code ID
                        CC: call.colorCode || ''                                      // Color Code
                    }))
                }
            };


            try {
                const options = { compact: true, ignoreComment: true, spaces: 4 };
                const result = convert.js2xml(xmlData, options);
                // Resolve file path
                const filePath = `/opt/app/DATA/${mount_point}/${archiveFileName}.xml`;
                const pathTowrite=`/opt/app/DATA/${mount_point}`
                // Save the XML file
                await fs.promises.writeFile(filePath, result, "utf8");
                console.log(`File successfully written: ${filePath}`);

                // Update archive status
                const result2 = await archive.updateArchiveStatus(`${archiveFileName}.xml`, pathTowrite, 'P', mount_point, 'Manual');
                if (result2.error) {
                    return res.status(409).json({ message: result2.error });
                }

                if (result2.action === 'inserted') {
                    // Publish status to Redis
                    const channelName = process.env.ARCHIVE_STATUS || "archive_status";
                    const messageData = { status: "COMPLETED" };

                    try {
                        await redisClient.publish(channelName, JSON.stringify(messageData));
                        console.log(`Message published to Redis channel ${channelName}:`, messageData);
                    } catch (err) {
                        console.error("Error publishing to Redis:", err);
                        return res.status(500).json({ status: false, statusText: "Failed to publish to Redis" });
                    }

                    // Log audit trail
                    await audit.auditTrailFunction(adminUserId, 'SYSTEM MANAGEMENT', 'CREATE', "Manual archive generated", 'recordingCallLogId', 0, null, JSON.stringify(req.body), null);

                    return res.status(200).json({ status: true, statusText: "Data archived successfully", filePath });
                } else {
                    return res.status(500).json({ message: 'Unexpected error' });
                }

            } catch (error) {
                console.error("Error processing XML:", error);
                return res.status(500).json({ status: false, statusText: "Internal server error", error: error.message });
            }
        } else {
            console.error('No valid data found in jsonData');
            log.warn('No valid data found in jsonData')
            return res.status(400).json({
                status: false,
                statusText: "No valid data found"
            });
        }
    } catch (error) {
        console.error('Error', error);
        return res.status(500).json({
            status: false,
            statusText: "No valid data found",
            error
        });
    }
};

exports.getDefaultLocation = async (req, res) => {
    try {
        const mountPoint = req.body.mount_point;
        const location = await archive.getDefaultLocation();
        const autoArchiveList = await archive.getAutoArchiveList();
        const manualArchivedList = await archive.getManualArchivedList();
        const directoryPath = `/opt/app/DATA/${mountPoint}`;
        if (!fs.existsSync(directoryPath)) {
            console.log("Network path not accessible:", directoryPath);
            return res.status(400).json({
                status: false,
                statusText: "Network path not accessible"
            });
        }
        // Read folder list from the specified path
        fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {

            if (err) {
                console.error(err);
                log.error(err);
                return res.status(500).json({
                    status: false,
                    statusText: "Failed to read directory",
                    error: err.message
                });
            }

            // Filter only directories
            const folders = files.filter(file => file.isDirectory()).map(file => file.name);
            console.log("folder:",folders);
            return res.status(200).json({
                path: directoryPath,
                folders,
                path: location[0].archiveFilePath,
                archiveList: '',
                autoArchiveList,
                manualArchivedList,
                status: true,
                statusText: "Default location fetched successfully"
            });
        });

    } catch (error) {
        console.error(error);
        log.error(error);
        return res.status(500).json({
            status: false,
            statusText: "Internal server error",
            error: error.message
        });
    }
};
exports.mountFileSystem = async (req, res) => {
    const { username, password, path, mount_point } = req.body; // Get username and password from request body
    // / Validate input

    if (!username || !password || !path || !mount_point) {
        log.error('Invalid input')
        return res.status(400).json({
            status: false,
            statusText: "Invalid input"
        });
    }
    try {
        // Modify mount_point to include /opt/app/DATA/
        const updatedMountPoint = `/opt/app/DATA/${mount_point}`;
        // Pass modified mount_point to mountFileSystem
        const responseData = await archive.mountFileSystem({
            ...req.body,
            mount_point: updatedMountPoint
        });
        return res.status(200).json({
            responseData,
            status: true,
            statusText: "Mounted successfully"
        });
    }
    catch (error) {
        console.error('Error happen', error);
        log.error(error)
        if (error?.status == 404) {
            return res.status(404).json({
                status: false,
                statusText: "Directory not found.",
                error: error.message
            });
        }
        return res.status(500).json({
            status: false,
            statusText: "Internal server error",
            error: error.message
        });
    }
}
exports.unMountFileSystem = async (req, res) => {
    // Define the request payload based on the curl command
    try {
        const responseData = await archive.unMountFileSystem(req.body.mount_point);
        return res.status(200).json({
            responseData,
            status: true,
            statusText: "unmounted successfully"
        });
    }
    catch (error) {
        console.error(error?.status);
        log.error(error)
        return res.status(500).json({
            status: false,
            statusText: "Internal server error",
            error: error.message
        });
    }
}
exports.getArchiveList = async (req, res) => {
    try {
        const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

        const { pageNumber, recordsPerPage, searchName, selectedArchiveTypes, adminUserId } = req.body;
        console.log('Client IP:', clientIp, 'Selected Archive Types:', selectedArchiveTypes);

        const inPageNumber = parseInt(pageNumber, 10) || 1; // Default to page 1
        const inRecordsPerPage = parseInt(recordsPerPage, 10) || 10; // Default to 10 records per page

        // Ensure selectedArchiveTypes is an array
        const validArchiveTypes = ["Manual", "Auto Daily", "Auto Weekly", "Auto Monthly"];
        let archiveTypeFilter = [];

        if (Array.isArray(selectedArchiveTypes) && selectedArchiveTypes.length > 0) {
            archiveTypeFilter = selectedArchiveTypes.filter(type => validArchiveTypes.includes(type));
        }

        // Fetch paginated data with filtering
        const data = await archive.getArchiveList(inPageNumber, inRecordsPerPage, searchName, archiveTypeFilter);

        // Audit logging
        audit.auditTrailFunction(
            adminUserId, 'ARCHIVE REPORT', 'READ',
            `Archive report accessed`,
            'dgArchiveDataDetail', 0, null, null, null
        );

        return res.status(200).json({
            data: data.records,
            totalRecords: data.totalRecords,
            totalPages: data.totalPages,
            currentPage: inPageNumber,
            status: true,
            statusText: "Data fetched successfully"
        });
    } catch (error) {
        console.error("Error:", error);
        log.error(error);
        return res.status(500).json({
            status: false,
            statusText: "Internal server error",
            error: error.message
        });
    }
};
exports.deleteArchiveReport = async (req, res) => {
    const { adminUserId, archiveDataDetailId, password, archiveFileName, archiveFilePath, mountedPoint } = req.body
    try {
        const user = await archive.findUserById(adminUserId);
        // Check if the user exists
        if (!user) {
            return res.status(404).json({
                status: false,
                statusText: "User not found",
            });
        }
        // Verify the password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: false,
                statusText: "Unauthorized access: Invalid password",
            });
        }
        // Delete the archive report
        const data = await archive.deleteArchiveReport(archiveDataDetailId);
        let oldValue = { archiveDataDetailId, archiveFileName, archiveFilePath, mountedPoint }
        oldValue = JSON.stringify(oldValue)
        audit.auditTrailFunction(adminUserId, 'ARCHIVE REPORT', 'DELETE', `Archive report deleted`, 'dgArchiveDataDetail', archiveDataDetailId, oldValue, null, null)
        // Respond with success
        return res.status(200).json({
            status: true,
            statusText: "Archive report deleted successfully",
            data,
        });

    } catch (error) {
        console.error(error);
        log.error(error);
        return res.status(500).json({
            status: false,
            statusText: "Internal server error",
            error: error.message
        });
    }
}
var xml2js = require('xml2js');
exports.getXMLData = async (req, res) => {
    try {
        const { archiveDataDetailId, archiveFileName, mountedPoint, adminUserId } = req.body;

        // Validate required parameters
        if (!archiveDataDetailId || !archiveFileName || !mountedPoint) {
            return res.status(400).json({
                status: false,
                statusText: "Missing required parameters: archiveDataDetailId, archiveFileName, or mountedPoint.",
            });
        }

        // Construct the file path
        // const filePath = `opt/app/DATA${mountedPoint}/${archiveFileName}`;
        const filePath = `${mountedPoint}/${archiveFileName}`;

        // Check if the file exists before reading
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                status: false,
                statusText: `File not found: ${filePath}. Please verify the mounted point and file name.`,
            });
        }

        // Load the XML file
        const xmlData = fs.readFileSync(filePath, 'utf8');
        const parser = new xml2js.Parser();
        const jsonData = await parser.parseStringPromise(xmlData); // Convert XML to JSON

        // Transform the rows
        const rows = jsonData.root.row.map(row => {
            const flatRow = {};
            for (const key in row) {
                flatRow[key] = Array.isArray(row[key]) ? row[key][0] : row[key];
            }
            return flatRow;
        });

        // Generate a unique filename
        const filename = `${archiveDataDetailId}_${archiveFileName}.json`;

        // Store data in Redis with a 12-hour expiration time (43200 seconds)
        redisClient.set(filename, JSON.stringify(rows), 'EX', 43200, (err, reply) => {
            if (err) {
                log.error("Error saving to Redis:", err);
                console.error("Error saving to Redis:", err);
                return res.status(500).json({
                    status: false,
                    error: "Failed to save data to Redis.",
                });
            }

            console.log(`Data for key ${filename} replaced in Redis.`);
            audit.auditTrailFunction(adminUserId, 'ARCHIVE REPORT', 'READ', `Archive report accessed`, 'dgOrganizationDetails', 0, null, null, null)
            return res.status(200).json({
                status: true,
                message: `Data replaced for key ${filename}.`,
                redisKey: filename
            });
        });
    } catch (error) {
        console.error("Error parsing XML:", error);
        log.error("Error parsing XML:", error);
        // Handle different error types
        if (error.code === "ENOENT") {
            return res.status(404).json({
                status: false,
                statusText: `File not found: ${error.path}. Please verify the mounted point and file name.`,
            });
        } else if (error.name === "SyntaxError") {
            return res.status(400).json({
                status: false,
                statusText: "Failed to parse XML. The file might be corrupted or not well-formed.",
            });
        } else {
            return res.status(500).json({
                status: false,
                statusText: "An unexpected error occurred. Please try again later.",
            });
        }
    }
};
exports.getCallsFromXML = async (req, res) => {
    try {
        const {
            redisKey,
            pageNumber,
            recordsPerPage,
            inCallStartDateTime,
            inCallEndDateTime,
            inDialledNumber,
            inExtensionNumber,
            inCallDirection,
            inAgentCode,
            inColorCode,
            inChannelName,
            inTagName,
            inAgentName,
        } = req.body;

        // Fetch JSON data from Redis
        const allCalls = await archive.readJSONFromRedis(redisKey);

        if (!Array.isArray(allCalls)) {
            console.error("Invalid data: Expected an array.");
            log.error("Invalid data: Expected an array.");
            throw new Error("Data read from Redis is not an array.");
        }

        // Filtering logic
        let filteredCalls = allCalls;

        // Date range filtering
        if (inCallStartDateTime || inCallEndDateTime) {
            const startDateTime = inCallStartDateTime
                ? new Date(inCallStartDateTime)
                : null;
            const endDateTime = inCallEndDateTime
                ? new Date(inCallEndDateTime)
                : null;

            filteredCalls = filteredCalls.filter((call) => {
                const callStart = new Date(call.CST); // Use CST for callStartTime
                if (startDateTime && callStart < startDateTime) return false;
                if (endDateTime && callStart > endDateTime) return false;
                return true;
            });
        }

        // Additional filters (updated keys)
        if (inDialledNumber) {
            filteredCalls = filteredCalls.filter(
                (call) =>
                    (call.DN || "").toLowerCase() === inDialledNumber.toLowerCase()
            );
        }

        if (inExtensionNumber) {
            filteredCalls = filteredCalls.filter(
                (call) =>
                    (call.EN || "").toLowerCase() === inExtensionNumber.toLowerCase()
            );
        }

        if (inCallDirection) {
            filteredCalls = filteredCalls.filter(
                (call) =>
                    (call.CD || "").toLowerCase() === inCallDirection.toLowerCase()
            );
        }

        if (inAgentCode) {
            filteredCalls = filteredCalls.filter(
                (call) =>
                    (call.AC || "").toLowerCase() === inAgentCode.toLowerCase()
            );
        }

        if (inColorCode) {
            filteredCalls = filteredCalls.filter(
                (call) =>
                    (call.CC || "").toLowerCase() === inColorCode.toLowerCase()
            );
        }

        if (inChannelName) {
            filteredCalls = filteredCalls.filter(
                (call) =>
                    (call.CN || "").toLowerCase() === inChannelName.toLowerCase()
            );
        }

        if (inTagName) {
            filteredCalls = filteredCalls.filter(
                (call) =>
                    (call.tagName || "").toLowerCase() === inTagName.toLowerCase()
            );
        }

        if (inAgentName) {
            filteredCalls = filteredCalls.filter(
                (call) =>
                    (call.AN || "").toLowerCase() === inAgentName.toLowerCase()
            );
        }

        // Pagination logic
        const inPageNumber = parseInt(pageNumber, 10) || 1;
        const inRecordsPerPage = parseInt(recordsPerPage, 10) || 10;

        const totalRecords = filteredCalls.length;
        const totalPages = Math.ceil(totalRecords / inRecordsPerPage);
        const startIndex = (inPageNumber - 1) * inRecordsPerPage;
        const paginatedCalls = filteredCalls.slice(
            startIndex,
            startIndex + inRecordsPerPage
        );
        // Before sending the paginated calls in the response
        const formattedCalls = paginatedCalls.map((call) => ({
            callStartTime: call.CST || '', // Ensure date strings
            callEndTime: call.CET || '',
            duration: call.DUR || '',
            dialledNumber: call.DN || '',
            callerId: call.CID || '',
            channelName: call.CN || '',
            extensionNumber: call.EN || '',
            agentCode: call.AC || '',
            agentName: call.AN || '',
            recordedFileName: call.RFN || '',
            callDirection: call.CD || '',
            callDirectionText: call.CDT || '',
            recordingCallLogId: call.RCID || '',
            isLocked: call.isLocked || '',
            notes: call.notes || '',
            supervisorFeedBack: call.SF || '',
            colorCodeId: call.CCID || '',
            colorCode: call.CC || ''
        }));
        // Send the paginated calls in the response
        return res.status(200).json({
            status: true,
            data: formattedCalls,
            totalRecords,
            totalPages,
            currentPage: inPageNumber,
        });
    } catch (error) {
        log.error("Error fetching calls:", error.message);
        console.error("Error fetching calls:", error.message);
        return res.status(500).json({
            status: false,
            error: error.message,
        });
    }
};

exports.getAutoArchive = async (req, res) => {
    try {
        const { path: archivePath, mountPoint, timePeriod, day, time, adminUserId } = req.body;
        const validPeriods = ['Auto Daily', 'Auto Weekly', 'Auto Monthly'];
        if (!validPeriods.includes(timePeriod)) {
            return res.status(400).json({ error: 'Invalid timePeriod' });
        }

        const mountPath = `/opt/app/DATA/${mountPoint}`;
        await archive.saveAutoSchedules(archivePath, mountPath, timePeriod, day, time, adminUserId);
        audit.auditTrailFunction(adminUserId, 'SYSTEM MANAGEMENT', 'CREATE', 'Auto archive generated', 'dgAutoArchiveScheduleData', 0, null, null, null);

        // Store schedule data in Redis for `sendDataToClient` to use
        const updatedBody = { ...req.body, mountPoint: mountPath };
        await redisClient.set(timePeriod, JSON.stringify(updatedBody));

        return res.status(200).json({ status: true });
    } catch (err) {
        console.error('Error in getAutoArchive:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
console.log("Script Started");
async function sendDataToClient() {
    try {
        console.log("sendDataToClient");
        const now = moment().format('YYYY-MM-DD_HH-mm-ss');
        const timePeriods = ['Auto Daily', 'Auto Weekly', 'Auto Monthly'];

        for (const timePeriod of timePeriods) {
            await redisClient.del(timePeriod);

            let dataString = await redisClient.get(timePeriod);

            if (!dataString) {
                console.log(`Fetching ${timePeriod} data from database...`);
                // Fetch from DB if Redis is empty
                const rows = await archive.getSchedules(timePeriod);
                if (rows.length > 0) {
                    dataString = JSON.stringify(rows[0]);
                    await redisClient.set(timePeriod, dataString);
                }
            }

            if (!dataString) continue;
            const data = JSON.parse(dataString);

            const [hour, minute] = data.time.split(':');
            console.log('hr:',hour,'minute:',minute);
            let scheduledType, startDate, endDate, type;
            switch (data.timePeriod) {
                case 'Auto Daily':
                    scheduledType = `${minute} ${hour} * * *`;
                    startDate = moment().subtract(1, 'days').startOf('day').format('YYYY/MM/DD HH:mm:ss');
                    endDate = moment().subtract(1, 'days').endOf('day').format('YYYY/MM/DD HH:mm:ss');
                    type = 'Auto Daily';
                    break;
                case 'Auto Weekly':
                    scheduledType = `${minute} ${hour} * * ${data.day || 0}`;
                    startDate = moment().subtract(1, 'weeks').startOf('isoWeek').format('YYYY/MM/DD HH:mm:ss');
                    endDate = moment().subtract(1, 'weeks').endOf('isoWeek').format('YYYY/MM/DD HH:mm:ss');
                    type = 'Auto Weekly';
                    break;
                case 'Auto Monthly':
                    scheduledType = `${minute} ${hour} ${data.day || 1} * *`;
                    startDate = moment().subtract(1, 'months').startOf('month').format('YYYY/MM/DD HH:mm:ss');
                    endDate = moment().subtract(1, 'months').endOf('month').format('YYYY/MM/DD HH:mm:ss');
                    type = 'Auto Monthly';
                    break;
                default:
                    console.error('Unknown time period:', data.timePeriod);
                    continue;
            }
            console.log(`Scheduling cron job with pattern: ${scheduledType}`);
            cron.schedule(scheduledType, async () => {
                console.log("Scheduled task executed at:", new Date().toLocaleString());
                console.log("done");
                const jsonData = await calls.getCallReports(null, null, null, null, null, null, null, startDate, endDate, "00:00:00", "23:59:59", null, null, null, null, null, null);
                if (!Array.isArray(jsonData) || jsonData.length === 0) {
                    console.log(`No valid data found for location: ${data.location}`);
                    return;
                }

                const xmlData = {
                    root: {
                        row: jsonData[0].map(call => ({
                            CST: call.callStartTime ? call.callStartTime.toISOString() : '',
                            CET: call.callEndTime ? call.callEndTime.toISOString() : '',
                            DUR: call.duration || '',
                            DN: call.dialledNumber || '',
                            CID: call.callerId || '',
                            CN: call.channelName || '',
                            EN: call.extensionNumber || '',
                            AC: call.agentCode || '',
                            AN: call.agentName || '',
                            RFN: call.recordedFileName || '',
                            CD: call.callDirection || '',
                            CDT: call.callDirectionText || '',
                            RCID: call.recordingCallLogId || '',
                            isLocked: call.isLocked || '',
                            notes: call.notes || '',
                            SF: call.supervisorFeedBack || '',
                            CCID: call.colorCodeId || '',
                            CC: call.colorCode || ''
                        }))
                    }
                };

                const options = { compact: true, ignoreComment: true, spaces: 4 };
                const result = convert.js2xml(xmlData, options);
                const fileName = `${data.timePeriod}_${now}.xml`;
                const filePath = `${data.mountPoint}/${fileName}`;
                console.log("filePath:",filePath)
                try {
                    await fs.promises.writeFile(filePath, result, "utf8");
                    console.log(` File successfully written at: ${filePath}`);
                    const archiveUpdateResult = await archive.updateArchiveStatus(fileName, data.path, 'P', data.mountPoint, type);
                    redisClient.publish(process.env.ARCHIVE_STATUS, JSON.stringify({ status: 'COMPLETED' }));
                } catch (error) {
                    console.error(` Error writing file: ${error.message}`);
                }
            });
        }
    } catch (error) {
        console.error('Error sending data to client:', error);
    }
}
console.log("Calling sendDataToClient...");
sendDataToClient();
console.log("sendDataToClient function executed");
exports.saveAutoDelete = async (req, res) => {

    try {
        const { adminUserId, autoDeleteType, thresholdMin, thresholdMax, retentionPeriod } = req.body;
        // Validate required fields
        // Validate required fields
        if (autoDeleteType === undefined || autoDeleteType === null ||
            (autoDeleteType == 0 && (thresholdMin == null || thresholdMax == null)) ||
            (autoDeleteType == 1 && (retentionPeriod === undefined || retentionPeriod === null || retentionPeriod === ''))) {
            return res.status(400).json({
                status: false,
                statusText: "Invalid request data. Please check your inputs."
            });
        }

        // Construct data object
        // Ensure values are correctly assigned based on autoDeleteType
        const thresholdMinValue = autoDeleteType == 0 ? thresholdMin || null : null;
        const thresholdMaxValue = autoDeleteType == 0 ? thresholdMax || null : null;
        const retentionDays = autoDeleteType == 1 ? retentionPeriod || null : null;
        const autoDeleteSettings = await autoDelete.saveAutoDelete(autoDeleteType, thresholdMinValue, thresholdMaxValue, retentionDays)
        let data = { autoDeleteType, thresholdMin, thresholdMax, retentionPeriod }
        let newValue = JSON.stringify(data)
        audit.auditTrailFunction(adminUserId, 'SYSTEM MANAGEMENT', 'CREATE', `Auto delete settings saved`, 'dgAutoDeleteSettings', 0, null, newValue, null)
        return res.status(200).json({
            status: true,
            statusText: "Auto-delete settings saved successfully"
        });

    } catch (error) {
        log.error(error);
        console.error('Error saving auto-delete settings:', error);
        return res.status(500).json({
            status: false,
            statusText: "Internal server error",
            error: error.message
        });
    }
};
exports.getAutoDeleteSettings = async (req, res) => {
    try {
        const { adminUserId } = req.body;
        const autoDeleteSettings = await autoDelete.getAutoDelete(); // Fetch existing settings

        if (!autoDeleteSettings) {
            log.error("No auto-delete settings found");
            return res.status(404).json({
                status: false,
                statusText: "No auto-delete settings found"
            });
        }
        audit.auditTrailFunction(adminUserId, 'SYSTEM MANAGEMENT', 'READ', `Auto delete settings accessed`, 'dgAutoDeleteSettings', 0, null, null, null)
        return res.status(200).json({
            status: true,
            statusText: "Auto-delete settings retrieved successfully",
            data: autoDeleteSettings
        });

    } catch (error) {
        log.error(error);
        console.error('Error retrieving auto-delete settings:', error);
        return res.status(500).json({
            status: false,
            statusText: "Internal server error",
            error: error.message
        });
    }
};
exports.saveMailSettings = async (req, res) => {
    try {
        const { adminUserId, SMTPServer, username, SMTPPort, passwordNew, senderEmail, isSslEnabled } = req.body;

        // Validate required fields
        if (!SMTPServer || !username || !SMTPPort || !passwordNew || !senderEmail) {
            return res.status(400).json({
                status: false,
                statusText: "Invalid request data. Please check your inputs."
            });
        }

        // Convert isSslEnabled to boolean
        const isSsl = isSslEnabled === "true" || isSslEnabled === true;
        const hashedPassword = await bcrypt.hash(passwordNew, 10);
        // Save mailer settings in the database
        const mailerSettings = await mailer.saveMailSettings(SMTPServer, username, SMTPPort, hashedPassword, senderEmail, isSslEnabled);

        let data = {SMTPServer, username, SMTPPort, senderEmail, isSslEnabled: isSsl };
        let newValue = JSON.stringify(data);

        // Log the action in the audit trail
        audit.auditTrailFunction(adminUserId, 'SYSTEM MANAGEMENT', 'CREATE', `Mail settings saved`, 'dgSMTPSetting', 0, null, newValue, null);

        return res.status(200).json({
            status: true,
            statusText: "Mail settings saved successfully"
        });

    } catch (error) {
        log.error(error);
        console.error('Error saving mail settings:', error);
        return res.status(500).json({
            status: false,
            statusText: "Internal server error",
            error: error.message
        });
    }
};
exports.getSMTPmailSettings = async (req, res) => {
    try {
        const { adminUserId } = req.body;
        const smtpSettings = await mailer.getSMTPSettings(); // Fetch existing settings
        
        if (!smtpSettings) {
            log.error("No Mail settings found");
            return res.status(404).json({
                status: false,
                statusText: "No Mail settings found"
            });
        }

        audit.auditTrailFunction(
            adminUserId,
            'SYSTEM MANAGEMENT',
            'READ',
            `Mail settings accessed`,
            'dgSMTPSetting',
            0,
            null,
            null,
            null
        );

        return res.status(200).json({
            status: true,
            statusText: "Mail settings retrieved successfully",
            data: smtpSettings
        });

    } catch (error) {
        log.error(error);
        console.error('Error retrieving Mail settings:', error);
        return res.status(500).json({
            status: false,
            statusText: "Internal server error",
            error: error.message
        });
    }
};

