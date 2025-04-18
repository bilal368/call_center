let log = require("log4js").getLogger("Reports");
const reports = require("../model/reports");
const path = require("path");
const fs = require("fs");
const messages = require("ldap/lib/messages");
const moment = require("moment");
const { exec, spawn } = require("child_process");
const crypto = require('crypto');

const audit = require("../auditTrail");
const { calls, frequent, colorCode, extensionReport, agents, auditTrail, timelineReport, concurrentReport, deletedCallReport, loginTrackReports } = reports;

// Function to calculate date range based on type
const calculateDateRange = (dateType, customFromDate, customToDate) => {
  let startDate, endDate;
  switch (dateType) {
    case "Today":
      startDate = moment().startOf("day").format("YYYY/MM/DD HH:mm:ss");
      endDate = moment().endOf("day").format("YYYY/MM/DD HH:mm:ss");
      break;
    case "This Week":
      startDate = moment().startOf("week").format("YYYY-MM-DD HH:mm:ss");
      endDate = moment().endOf("week").format("YYYY-MM-DD HH:mm:ss");
      break;
    case "This Month":
      startDate = moment().startOf("month").format("YYYY/MM/DD HH:mm:ss");
      endDate = moment().endOf("month").format("YYYY/MM/DD HH:mm:ss");
      break;
    case "This Quarter":
      startDate = moment().startOf("quarter").format("YYYY/MM/DD HH:mm:ss");
      endDate = moment().endOf("quarter").format("YYYY/MM/DD HH:mm:ss");
      break;
    case "This Year":
      startDate = moment().startOf("year").format("YYYY/MM/DD HH:mm:ss");
      endDate = moment().endOf("year").format("YYYY/MM/DD HH:mm:ss");
      break;
    case "Custom":
      if (!customFromDate || !customToDate) {
        throw new Error(
          "Custom dates must be provided for the Custom date type"
        );
      }
      startDate = moment(customFromDate)
        .startOf("day")
        .format("YYYY/MM/DD HH:mm:ss");
      endDate = moment(customToDate).endOf("day").format("YYYY/MM/DD HH:mm:ss");
      break;
    default:
      throw new Error("Invalid date type");
  }
  return { startDate, endDate };
};
// Fetch Call Reports
exports.callReports = async (req, res, next) => {
  try {
    const {
      inDateType,
      inDialledNumber,
      inExtensionNumber,
      inCallDirection,
      inAgentCode,
      inColorCode,
      inChannelName,
      inAgentName,
      inCallStartDate,
      inCallEndDate,
      inPageNumber,
      inRecordsPerPage,
      inUserId,
      inSortColumn,
      inSortOrder,
      inTagName
    } = req.body;

    // Calculate date range and times only once
    const { startDate: inCallStartDateTime, endDate: inCallEndDateTime } = calculateDateRange(
      inDateType,
      inCallStartDate,
      inCallEndDate
    );

    // Query data from database
    const callReports = await calls.getCallReports(
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
      inTagName
    );

    // Log audit trail
    audit.auditTrailFunction(
      inUserId,
      "CALL REPORT",
      "READ",
      "CALL REPORT accessed",
      "dgRecordingCallLog",
      0,
      null,
      null,
      null
    );

    // Respond with data
    if (callReports && callReports.length > 0) {

      res.status(200).json({ status: true, callReports });
    } else {
      res.status(404).json({ status: false, statusText: "Data Not Found" });
    }
  } catch (error) {
    console.error("Error:", error);
    log.error(error);
    res.status(500).json({ status: false, statusText: "Internal Server Error" });
  }
};

// fetchcallReportsDetails
exports.fetchcallReportsDetails = async (req, res, next) => {

  try {

    const callReports = await calls.getCallReportsDetails();
    if (!callReports || callReports.length === 0) {
      res.status(404).json({ status: false, statusText: "Data Not Found" });
    } else {
      res.status(200).json({ status: true, callReports: callReports });
    }
  } catch (error) {
    console.log("error:", error);
    log.error(error);
    res
      .status(500)
      .json({ status: false, statusText: "Internal Server Error" });
  }
};

exports.reportfilter = async (req, res, next) => {

  try {

    const callReports = await calls.reportfilter();

    if (!callReports || callReports.length === 0) {
      res.status(404).json({ status: false, statusText: "Data Not Found" });
    } else {
      res.status(200).json({ status: true, callReports: callReports });
    }
  } catch (error) {
    console.log("error:", error);
    log.error(error);
    res
      .status(500)
      .json({ status: false, statusText: "Internal Server Error" });
  }
};

// Get the audio
exports.audioCallReports = async (req, res) => {
  try {
    // Extract parameters from the request body
    const { fileName, audioStatus,archiveAudio,mountedPoint } = req.body;
    const [result] = await calls.audioEncryptStatus()
    let isEncrypted;
    result.isActiveAudioEncryption == 1 ? isEncrypted = true : false
    // Parse the date from the file name
    const year = fileName.slice(0, 4);
    const month = fileName.slice(4, 6);
    const day = fileName.slice(6, 8);
    const basePath=archiveAudio?`${mountedPoint}/VOICE/${year}/${month}/${day}`:`../../../../opt/app/DATA/VOICE/${year}/${month}/${day}`
    console.log(basePath);
    
    // Define file paths for GSM, WAV, and encrypted GSM files
    // const basePath = `C:/Users/harik/Downloads/${year}/${month}/${day}`;
    const encryptedGsmFilePath = path.resolve(`${basePath}/${fileName}.enc`);
    const gsmWavFilePath = path.resolve(`${basePath}/${fileName}.wav`);

    let audioFilePath;

    // Check if any of the file formats exist and set the appropriate path
   if (isEncrypted && fs.existsSync(encryptedGsmFilePath)) {
      audioFilePath = encryptedGsmFilePath; // Use encrypted GSM file if it exists
    } else if (fs.existsSync(gsmWavFilePath)) {
      audioFilePath = gsmWavFilePath; // Use GSM file if WAV and encrypted GSM do not exist
    } else {
      console.error("Audio file not found")
      log.warn("Audio file not found", fileName)
      // If no file exists, return a 404 error
      return res.status(404).json({ message: "Audio file not found" });
    }

    // Step 1: Handle decryption if the GSM file is encrypted
    if (isEncrypted && audioFilePath === encryptedGsmFilePath) {
      const key = process.env.AES_256_KEY// Define the decryption key
      const keyBytes = crypto.createHash("sha256").update(key).digest(); // Generate a 256-bit key

      // Read the encrypted file content
      const encryptedContent = fs.readFileSync(encryptedGsmFilePath);

      // Extract IV (first 16 bytes) and ciphertext
      const iv = encryptedContent.slice(0, 16);
      const ciphertext = encryptedContent.slice(16);

      // Create a decipher instance
      const decipher = crypto.createDecipheriv("aes-256-cbc", keyBytes, iv);

      try {
        // Perform decryption
        let plaintext = decipher.update(ciphertext);
        plaintext = Buffer.concat([plaintext, decipher.final()]);

        // Step 2: Transcode decrypted GSM to WAV using FFmpeg
        const ffmpeg = spawn("ffmpeg", [
          "-i",
          "pipe:0", // Input from the decrypted GSM data
          "-f",
          "wav", // Output format
          "-acodec",
          "pcm_s16le", // Codec for WAV
          "pipe:1", // Output to a pipe for streaming
        ]);

        // Handle FFmpeg errors
        ffmpeg.stderr.on("data", (data) => {
          // console.error(`FFmpeg stderr: ${data}`);
        });

        // Stream the decrypted and transcoded audio to the frontend
        ffmpeg.stdout.pipe(res.setHeader("Content-Type", "audio/wav"));

        // Write the decrypted GSM data to FFmpeg stdin
        ffmpeg.stdin.write(plaintext);
        ffmpeg.stdin.end();

      } catch (error) {
        log.error("Decryption failed:", error);
        console.error("Decryption failed:", error.message);
        return res.status(500).json({ message: "Decryption failed" });
      }
      return; // Exit the function after handling decryption and transcoding
    }

    // Step 3: Handle direct GSM transcoding if not encrypted
    if (audioFilePath === gsmWavFilePath) {
      // Transcode GSM to WAV using FFmpeg and stream the output
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        gsmWavFilePath, // Input file path
        "-f",
        "wav", // Output format
        "-acodec",
        "pcm_s16le", // Codec for WAV
        "pipe:1", // Output to a pipe for streaming
      ]);

      // Log FFmpeg errors to the console
      ffmpeg.stderr.on("data", (data) => {
        // console.error(`FFmpeg stderr: ${data}`);
      });

      // Stream the transcoded audio to the response
      ffmpeg.stdout
        .on("data", () => {})
        .pipe(res.setHeader("Content-Type", "audio/wav"));
    }
  } catch (error) {
    // Handle unexpected errors
    log.error("Error in Audio play:", error);
    console.error("Error in audioCallReports:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// function for  get getColorCodeSummaryReport 
exports.getColorCodeSummaryReport = async (req, res) => {
  try {
    const {
      inExtensionNumber,
      inCallDirection,
      inAgentCode,
      inColorCodeId,
      inCallStartDateTime,
      inCallEndDateTime,
      inCallStartTime,
      inCallEndTime,
      inPageNumber,
      inRecordsPerPage,
      inUserId,
      inSortColumn,
      inSortOrder
    } = req.body;
    const adminUserId = req.body.adminUserId;

    const results = await colorCode.colorcodeReports(
      inExtensionNumber,
      inCallDirection,
      inAgentCode,
      inColorCodeId,
      inCallStartDateTime,
      inCallEndDateTime,
      inCallStartTime,
      inCallEndTime,
      inPageNumber,
      inRecordsPerPage,
      inUserId,
      inSortColumn,
      inSortOrder,
      adminUserId);
    if (!results.length) {
      res.status(404).json({ status: false, statusText: "No Data Found" });
    } else {
      res.status(200).json({ status: true, data: results });
    }
  } catch (error) {
    console.log("error:", error);
    log.error(error);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
};
exports.getColorCodeDetailExcelReport = async (req, res) => {
  try {
    const {
      inColorCodeId,
      inExtensionNumber,
      inCallDirection,
      inAgentCode,
      inCallStartDateTime,
      inCallEndDateTime,
      inCallStartTime,
      inCallEndTime,
      inPageNumber,
      inRecordsPerPage,
      inUserId,
      inSortColumn,
      inSortOrder
    } = req.body;

    const adminUserId = req.body.adminUserId;
    const results = await colorCode.ColorCodeDetailExcelReport(
      inColorCodeId,
      inExtensionNumber,
      inCallDirection,
      inAgentCode,
      inCallStartDateTime,
      inCallEndDateTime,
      inCallStartTime,
      inCallEndTime,
      inPageNumber,
      inRecordsPerPage,
      inUserId,
      inSortColumn,
      inSortOrder,
      adminUserId);
    if (!results.length) {
      res.status(404).json({ status: false, statusText: "No Data Found" });
    } else {
      res.status(200).json({ status: true, data: results });
    }
    // const agents = await reports.getAgents();
  } catch (error) {
    console.log("error:", error);
    log.error(error);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
};
exports.getAgentSummaryReport = async (req, res) => {
  try {
    // pass values with this keys if has inpiut,otherwise pass null
    const {
      inExtensionNumber,
      inCallDirection,
      inAgentCode,
      inCallStartDateTime,
      inCallEndDateTime,
      inCallStartTime,
      inCallEndTime,
      inPageNumber,
      inRecordsPerPage,
      inUserId,
      inSortColumn,
      inSortOrder
    } = req.body;

    const adminUserId = req.body.adminUserId;
    const results = await agents.agentReports(
      inExtensionNumber,
      inCallDirection,
      inAgentCode,
      inCallStartDateTime,
      inCallEndDateTime,
      inCallStartTime,
      inCallEndTime,
      inPageNumber,
      inRecordsPerPage,
      inUserId,
      inSortColumn,
      inSortOrder,
      adminUserId);
    if (!results.length) {
      res.status(404).json({ status: false, statusText: "No Data Found" });
    } else {
      res.status(200).json({ status: true, data: results });
    }
  } catch (error) {
    console.log("error:", error);
    log.error(error);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
};
exports.getFilters = async (req, res) => {
  try {
    const extensions = await extensionReport.getExtensions()
    const agentsList = await agents.getAgents();
    const getExtensionNumber = await deletedCallReport.getExtensionNumber();
    const dialedNumber = await deletedCallReport.getDialedNumber();
    const callerId = await deletedCallReport.getcallerId();

    if (extensions.length === 0 && agentsList.length === 0 && getExtensionNumber.length === 0 && dialedNumber.length === 0 && callerId.length === 0) {
      return res.status(404).json({ status: false, statusText: "No data found" });
    }
    res
      .status(200)
      .json({ status: true, extensions: extensions, agents: agentsList, getExtensionNumber: getExtensionNumber, dialedNumber: dialedNumber, callerId: callerId });
  } catch (error) {
    console.log("error:", error);
    log.error(error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }

};

exports.getDeletedUserDetails = async (req, res) => {
  try {
    // Fetch data from the model
    const users = await deletedCallReport.getUsers();
    const deletedUsers = await deletedCallReport.getDeletedUsers();
    const loginUsers = await deletedCallReport.getloginUsers();


    // Create a map of userId to user details for quick lookup
    const userMap = new Map();
    users.forEach(user => {
      const fullName = `${user.firstname || ''} ${user.middlename || ''} ${user.lastname || ''}`.trim();
      userMap.set(user.userId, fullName);
    });

    // Combine the data
    const combinedData = deletedUsers
      .filter(deletedUser => userMap.has(deletedUser.deletedUserID)) // Ensure the user exists in dgUser
      .map(deletedUser => ({
        name: userMap.get(deletedUser.deletedUserID),
        deletedUserID: deletedUser.deletedUserID
      }));

    // Check if there's data to return
    if (combinedData.length === 0) {
      return res.status(404).json({ status: false, statusText: 'No data found' });
    }
    // Send the response
    res.status(200).json({ status: true, data: combinedData });
  } catch (error) {
    console.error('Error fetching deleted user details:', error);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
};

exports.getloginUserDetails = async (req, res) => {
  try {

    const combinedData = await deletedCallReport.getUsers();  // Fetch all users from dgUser

    if (!combinedData || combinedData.length === 0) {
      res.status(404).json({ status: false, statusText: "Data Not Found" });
    } else {
      res.status(200).json({ status: true, data: combinedData });
    }
  } catch (error) {
    console.error('Error fetching deleted user details:', error);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
};

exports.agentNamefilter = async (req, res, next) => {

  try {

    const callReports = await calls.agentNamefilter();

    if (!callReports || callReports.length === 0) {
      res.status(404).json({ status: false, statusText: "Data Not Found" });
    } else {
      res.status(200).json({ status: true, callReports: callReports });
    }
  } catch (error) {
    console.log("error:", error);
    log.error(error);
    res
      .status(500)
      .json({ status: false, statusText: "Internal Server Error" });
  }
};

exports.getfrequentCallSummaryReport = async (req, res) => {
  try {
    // pass values with this keys if has inpiut,otherwise pass null
    const {
      inReportType,
      inExtensionNumber,
      inCallDirection,
      inAgentCode,
      inCallerId,
      inDialledNumber,
      inCallStartDateTime,
      inCallEndDateTime,
      inCallStartTime,
      inCallEndTime,
      inPageNumber,
      inRecordsPerPage,
      inUserId,
      inSortColumn,
      inSortOrder,
    } = req.body;
    const adminUserId = req.body.adminUserId;

    const results = await frequent.frequentCallReport(
      inReportType,
      inExtensionNumber,
      inCallDirection,
      inAgentCode,
      inCallerId,
      inDialledNumber,
      inCallStartDateTime,
      inCallEndDateTime,
      inCallStartTime,
      inCallEndTime,
      inPageNumber,
      inRecordsPerPage,
      inUserId,
      inSortColumn,
      inSortOrder,
      adminUserId
    );
    if (!results.length) {
      res.status(404).json({ status: false, statusText: "No Data Found" });
    } else {
      res.status(200).json({ status: true, data: results });
    }
  } catch (error) {
    console.log("error:", error);
    log.error(error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};

exports.loginTrackReports = async (req, res) => {
  try {
    // pass values with this keys if has inpiut,otherwise pass null
    const {
      inLoginStatus,
      inLoginTrackUserId,
      inCallStartDateTime,
      inCallEndDateTime,
      inPageNumber,
      inRecordsPerPage,
      inSortColumn,
      inSortOrder,
    } = req.body;

    const adminUserId = req.body.adminUserId;
    const results = await loginTrackReports.loginTrackReports(
      inLoginStatus,
      inLoginTrackUserId,
      inCallStartDateTime,
      inCallEndDateTime,
      inPageNumber,
      inRecordsPerPage,
      inSortColumn,
      inSortOrder,
      adminUserId);
    if (!results.length) {
      res.status(404).json({ status: false, statusText: "No Data Found" });
    } else {
      res.status(200).json({ status: true, data: results });
    }
  } catch (error) {
    console.log("error:", error);
    log.error(error);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
};


exports.getFiltersloginTrack = async (req, res) => {
  try {
    const authenticated = await loginTrackReports.authenticated();
    if (authenticated.length === 0) {
      return res
        .status(404)
        .json({ status: false, statusText: "No data found" });
    }
    res
      .status(200)
      .json({ status: true, authenticated: authenticated });
  } catch (err) {
    console.log(err);
    log.error(err);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};


// Lock the Recordings
exports.lockCallReports = async (req, res, next) => {
  try {

    const recordingCallLogIds = req.body.SelectedDatas;
    const loginId = req.body.loginId;
    if (!recordingCallLogIds) {
      res
        .status(401)
        .json({ status: false, statusText: "Invalid Recording Call Logid" });
      return;
    } else {
      const [LockStatus] = await calls.recordingCallLogId(
        recordingCallLogIds,
        loginId
      );
      if (LockStatus.affectedRows > 0) {
        // Extract only the IDs for easier SQL handling
        const idsToUpdate = recordingCallLogIds.map(item => item.recordingCallLogId);

        audit.auditTrailFunction(loginId, 'CALL REPORT', 'LOCK', 'Record locked', 'dgRecordingCallLog', idsToUpdate, null, null, null)

        res.status(200).json({ status: true, message: "Record(s) locked successfully" });
      }
    }
  } catch (error) {
    console.log(error);
    log.error(error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};
// Unlock Call Reports
exports.UnlockCallReports = async (req, res, next) => {
  try {

    const recordingCallLogIds = req.body.SelectedDatas;
    const loginId = req.body.loginId;
    if (!recordingCallLogIds) {
      res
        .status(401)
        .json({ status: false, statusText: "Invalid Recording Call Logid" });
      return;
    } else {
      const [UNlockStatus] = await calls.recordingunlockCallLogId(
        recordingCallLogIds,
        loginId
      );
      if (UNlockStatus.affectedRows > 0) {
        // Extract only the IDs for easier SQL handling
        const idsToUpdate = recordingCallLogIds.map(item => item.recordingCallLogId);

        audit.auditTrailFunction(loginId, 'CALL REPORT', 'UNLOCK', 'Record unlocked', 'dgRecordingCallLog', idsToUpdate, null, null, null)

        res.status(200).json({ status: true, message: "Record(s) unlocked successfully" });
      }
    }
  } catch (error) {
    console.log(error);
    log.error(error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};
// Lock Selected Call Reports
exports.lockSelectedCallReports = async (req, res, next) => {
  try {
    const recordingCallLogId = req.body.recordingCallLogId;
    if (!recordingCallLogId) {
      res
        .status(401)
        .json({ status: false, statusText: "Invalid Recording Call Logid" });
      return;
    } else {
      const [LockStatus] = await calls.recordinglockCallLogId(
        recordingCallLogId
      );
      if (LockStatus.affectedRows > 0) {
        res
          .status(200)
          .json({ status: true, message: "Record(s) unlocked successfully" });
      }
    }
  } catch (error) {
    console.log(error);
    log.error(error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};
// Delete Recordings
exports.deleteReports = async (req, res, next) => {
  try {
    const { SelectedDatas: deleterecordings, loginId } = req.body;
    if (
      !deleterecordings ||
      !Array.isArray(deleterecordings) ||
      deleterecordings.length === 0
    ) {
      res
        .status(400)
        .json({ status: false, message: "Invalid Recording Call Log IDs" });
      return;
    }

    const { updatedRecords, alreadyDeleted, lockedRecords } =
      await calls.deleteRecordings(deleterecordings, loginId);

    if (updatedRecords.length > 0) {
      oldValue = JSON.stringify(deleterecordings);
      // Extract only the IDs for easier SQL handling
      const idsToUpdate = deleterecordings.map(item => item.recordingCallLogId);
      audit.auditTrailFunction(loginId, 'CALL REPORT', 'DELETE', 'CALL REPORT DELETED', 'dgRecordingCallLog', idsToUpdate, oldValue, null, null)
      let message = "Record(s) deleted successfully";
      if (alreadyDeleted.length > 0) {
        message += `, ${alreadyDeleted.length} records were already deleted`;
      }
      if (lockedRecords.length > 0) {

        message += `, ${lockedRecords.length} locked record(s) are not deleted`;
      }
      res
        .status(200)
        .json({
          status: true,
          message,
          updatedRecords,
          alreadyDeleted,
          lockedRecords,
        });
    } else {
      if (lockedRecords.length > 0) {
        const message = `Locked record(s) are not deleted`;
        res
          .status(200)
          .json({
            status: true,
            message,
            updatedRecords,
            alreadyDeleted,
            lockedRecords,
          });
      } else {
        res
          .status(400)
          .json({ status: false, message: "No Records Were Updated" });
      }
    }
  } catch (error) {
    console.log(error);
    log.error(error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};
// Notes Recordings
exports.notesReports = async (req, res, next) => {
  try {
    const recordingCallLogId = req.body.recordingCallLogId;
    const notes = req.body.notes;
    const userId = req.body.userId
    if (!recordingCallLogId) {
      res
        .status(401)
        .json({ status: false, statusText: "Invalid Recording Call Logid" });
      return;
    } else {
      const [noteStatus] = await calls.notesRecording(
        notes,
        recordingCallLogId
      );
      if (noteStatus.affectedRows > 0) {
        audit.auditTrailFunction(userId, "CALL REPORT", "UPDATE", "Records Note Updated", "dgRecordingCallLog", 0, null, null, null);
        res.status(200).json({ status: true, message: "Note updated successfully" });
      }
    }
  } catch (error) {
    console.error(error);
    log.error(error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};
// Transcript CallReports
exports.transcriptCallReports = async (req, res, next) => {
  try {
    const { feedback, recordingCallLogId } = req.body.data;
    if (feedback) {
      log.info(
        `Add Feedback Method triggered by User ID ${recordingCallLogId}`
      );
      const [result] = await calls.addFeedback(recordingCallLogId, feedback);
      if (result.affectedRows > 0) {
        return res
          .status(200)
          .json({ status: true, message: "Feedback added" });
      } else {
        return res
          .status(404)
          .json({ status: false, message: "Feedback not added" });
      }
    } else {
      let feedback = "";
      const [result] = await calls.addFeedback(recordingCallLogId, feedback);
      return res
        .status(404)
        .json({ status: false, message: "Feedback Needed" });
    }
  } catch (error) {
    console.error(error);
    log.error(error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};
// Color code
exports.colorCode = async (req, res, next) => {
  try {
    const colorCode = await calls.getColorCode();
    if (!colorCode) {
      res.status(401).json({ status: false, statusText: "Invalid colorCodes" });
      return;
    } else {
      res.status(200).json({ status: true, colorCode: colorCode });
    }
  } catch (error) {
    console.log(error);
    log.error(error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};
// Update Color code
exports.updatecolorCode = async (req, res, next) => {
  try {
    const recordingCallLogId = req.body.recordingCallLogId;
    const colorCodeId = req.body.selectedColor;
    const colorCode = await calls.UpdatecolorCode(
      colorCodeId,
      recordingCallLogId
    );
    const userId = req.body.userId
    if (!colorCode) {
      res.status(404).json({ status: false, message: "Invalid colorCodes" });
      return;
    } else {
      audit.auditTrailFunction(userId, "CALL REPORT", "UPDATE", "Call record color code updated", "dgRecordingCallLog", 0, null, null, null);
      res.status(200).json({ status: true, message: "Color Code Updated" });
    }
  } catch (error) {
    console.log(error);
    log.error(error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};
//#endregion
//#region  extensionReports
exports.extensionReports = async (req, res, next) => {
  const {
    dateType,
    direction,
    pageNo,
    recordPage,
    inUserId,
    sortCol,
    sortOrder,
    customFromDate,
    customToDate,
    adminUserId
  } = req.body;
  let extension = req.body.extension;

  let inCallStartDateTime, inCallEndDateTime, inCallStartTime, inCallEndTime, inDirection;
  try {
    const dateRange = calculateDateRange(
      dateType,
      customFromDate,
      customToDate
    );
    inCallStartDateTime = dateRange.startDate;
    inCallEndDateTime = dateRange.endDate;
    inCallStartTime = "00:00:00";
    inCallEndTime = "23:59:59";
    if (direction == 'Incoming') {
      inDirection = "0";
    } else if (direction == 'Outgoing') {
      inDirection = "1";
    } else {
      inDirection = null;
    }
    const extensions = await extensionReport.getExtensions();
    const extReports = await extensionReport.getExtnesionReports(
      extension,
      inDirection,
      inCallStartDateTime,
      inCallEndDateTime,
      inCallStartTime,
      inCallEndTime,
      pageNo,
      recordPage,
      inUserId,
      sortCol,
      sortOrder
    );

    // let newValue = JSON.stringify(extReports[1]);
    audit.auditTrailFunction(adminUserId, 'EXTENSION REPORT', 'READ', 'EXTENSION REPORT accessed', 'dgExtension', 0, null, null, null)
    if (!extReports || extReports.length === 0) {
      res.status(404).json({ status: false, statusText: "Data Not Found" });
    } else {
      res
        .status(200)
        .json({ status: true, extReports: extReports, extensions: extensions });
    }
  } catch (error) {
    console.log("error:", error);
    log.error(error);
    res
      .status(500)
      .json({ status: false, statusText: "Internal Server Error" });
  }
};

exports.deletedCallReport = async (req, res) => {
  try {
    // pass values with this keys if has inpiut,otherwise pass null
    const {
      inDialledNumber,
      inCallerId,
      inExtensionNumber,
      inDeletedUserId,
      inCallStartDateTime,
      inCallEndDateTime,
      inCallStartTime,
      inCallEndTime,
      inPageNumber,
      inRecordsPerPage,
      inUserId,
      inSortColumn,
      inSortOrder
    } = req.body;
    const results = await deletedCallReport.deletedCallReport(
      inDialledNumber,
      inCallerId,
      inExtensionNumber,
      inDeletedUserId,
      inCallStartDateTime,
      inCallEndDateTime,
      inCallStartTime,
      inCallEndTime,
      inPageNumber,
      inRecordsPerPage,
      inUserId,
      inSortColumn,
      inSortOrder
    );
    if (!results.length) {
      res.status(404).json({ status: false, statusText: "No Data Found" });
    } else {
      res.status(200).json({ status: true, data: results });
    }
  } catch (error) {
    console.log("err:", error);
    log.error(error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};

//#endregion

//#region Timeline Reports
exports.timelineReports = async (req, res, next) => {
  const {
    inExtensionNumber,
    inAgentCode,
    inCallStartDateTime,
    inCallEndDateTime,
    inCallStartTime,
    inCallEndTime,
    inPageNumber,
    inRecordsPerPage,
    inUserId,
    inSortColumn,
    inSortOrder,
    inTimelineCriteria
  } = req.body;
  const adminUserId = req.body.adminUserId;

  try {


    const extensions = await extensionReport.getExtensions();
    const timelineReports = await timelineReport.getTimelineReport(
      inExtensionNumber,
      inAgentCode,
      inCallStartDateTime,
      inCallEndDateTime,
      inCallStartTime,
      inCallEndTime,
      inPageNumber,
      inRecordsPerPage,
      inUserId,
      inSortColumn,
      inSortOrder,
      inTimelineCriteria
    );
    audit.auditTrailFunction(adminUserId, 'TIMELINE REPORT', 'READ', 'Timeline report accessed', 'dgRecordingCallLog', 0, null, null, null)
    if (!timelineReports || timelineReports.length === 0) {
      res.status(404).json({ status: false, statusText: "Data Not Found" });
    } else {
      res
        .status(200)
        .json({ status: true, timelineReports: timelineReports[0], extensions: extensions, TotalRecords: timelineReports[1] });
    }
  } catch (error) {
    console.log("error:", error);
    log.error(error);
    res
      .status(500)
      .json({ status: false, statusText: "Internal Server Error" });
  }
};
//#endregion

//#region concurrent Reports
exports.concurrentReports = async (req, res, next) => {
  const {

    inCallStartDateTime,
    inCallEndDateTime,
    inPageNumber,
    inRecordsPerPage,
    inSortColumn,
    inSortOrder,
    inTimelineCriteria
  } = req.body;


  try {
    const dateRange = calculateDateRange(
      'Custom',
      inCallStartDateTime,
      inCallEndDateTime
    );
    const inCallStartDateTimeNew = dateRange.startDate;
    const inCallEndDateTimeNew = dateRange.endDate;

    const concurrentReports = await concurrentReport.getConcurrentReport(

      inCallStartDateTimeNew,
      inCallEndDateTimeNew,
      inSortColumn,
      inSortOrder,
      inTimelineCriteria,
      inPageNumber,
      inRecordsPerPage,

    );

    if (!concurrentReports || concurrentReports.length === 0) {
      res.status(404).json({ status: false, statusText: "Data Not Found" });
    } else {
      res
        .status(200)
        .json({ status: true, concurrentReports: concurrentReports[0], TotalRecords: concurrentReports[1] });
    }
  } catch (error) {
    console.log("error:", error);
    log.error(error);
    res
      .status(500)
      .json({ status: false, statusText: "Internal Server Error" });
  }
};
//#region getAuditTrailReport
exports.getAuditTrailReport = async (req, res, next) => {
  try {

    const {
      dateType,
      customFromDate,
      customToDate,
      userID,
      action,
      pageNo,
      recordPage,
      sortCol,
      sortOrder,
      adminUserId,
    } = req.body;

    let module = req.body.module;
    let inCallStartDateTime, inCallEndDateTime;
    const dateRange = calculateDateRange(
      dateType,
      customFromDate,
      customToDate
    );


    inCallStartDateTime = dateRange.startDate;
    inCallEndDateTime = dateRange.endDate;
    const modules = await auditTrail.getModules();
    const Users = await auditTrail.getUsers();
    const Actions = await auditTrail.getAction();
    const report = await auditTrail.getAuditTrailReport(module, action, userID, inCallStartDateTime, inCallEndDateTime, pageNo, recordPage, adminUserId, sortCol, sortOrder);
    audit.auditTrailFunction(adminUserId, 'AUDIT TRAIL REPORT', 'READ', `Audit trail report accessed`, 'dgAuditTrail', 0, null, null, null);
    res
      .status(200)
      .json({ status: true, module: modules, Users: Users, report: report, Actions: Actions });
  } catch (err) {
    console.log("error:", err);
    log.error(err);
    res
      .status(500)
      .json({ status: false, statusText: "Internal Server Error" });

  }
}
// auditTrailFunction
exports.updateAuditTrailFunction = async (req, res, next) => {
  try {

    const { adminUserId, moduleName, action, actionDescription,
            tableName, recordIds, oldValue, newValue, ipAddress
    } = req.body;
    audit.auditTrailFunction(
      adminUserId,
      moduleName,
      action,
      actionDescription,
      tableName,
      0,
      null,
      null,
      null
    );
  } catch (err) {
    console.log("error:", err);
    log.error(err);
    res
      .status(500)
      .json({ status: false, statusText: "Internal Server Error" });

  }
}
// fetch Call Tagging
exports.fetchCallTagging = async (req, res, next) => {
  try {
    const report = await auditTrail.getcallTagging();
    res.status(200).json({ status: true, callTagg: report });
  } catch (err) {
    console.log("error:", err);
    log.error(err);
    res
      .status(500)
      .json({ status: false, statusText: "Internal Server Error" });

  }
}
// fetch Call Tagging Details
exports.fetchCallTaggingDetails = async (req, res, next) => {
  try {
    const { recordingCallLogId } = req.body
    const report = await auditTrail.getcallTaggingDetails(recordingCallLogId);
    res.status(200).json({ status: true, callTagg: report });
  } catch (err) {
    console.log("error:", err);
    log.error(err);
    res
      .status(500)
      .json({ status: false, statusText: "Internal Server Error" });

  }
}
// Update Call Tagging
exports.updateCallTagging = async (req, res, next) => {
  try {
    const { customTag } = req.body
    const report = await auditTrail.updateCallTagging(customTag);
    if (report.affectedRows > 0) {
      res.status(200).json({ status: true });
    } else {
      res.status(400).json({ status: false });
    }

  } catch (err) {
    if (err.errno == 1062) {
      return res.status(409).json({ status: false, statusText: `Duplicate entry 'aaaaaaaaa' for key 'custom tag'` });
    }
    res.status(500).json({ status: false, statusText: "Internal Server Error", err });
  }
}
// Insert Call Tagging Details
exports.insertCallTaggingDetails = async (req, res, next) => {
  try {
    const { callTagDetails } = req.body
    const report = await auditTrail.insertCallTaggingDetails(callTagDetails);
    if (report.affectedRows > 0) {
      res.status(200).json({ status: true });
    } else {
      res.status(400).json({ status: false });
    }

  } catch (err) {
    if (err.errno == 1062) {
      return res.status(409).json({ status: false, statusText: `Duplicate entry 'aaaaaaaaa' for key 'custom tag'` });
    }
    res.status(500).json({ status: false, statusText: "Internal Server Error", err });
  }
}
// Delete Call Tagging Details
exports.deleteCallTaggingDetails = async (req, res, next) => {
  try {
    const { callTaggingDetailsID } = req.body
    const report = await auditTrail.deleteCallTaggingDetails(callTaggingDetailsID);
    if (report.affectedRows > 0) {
      res.status(200).json({ status: true });
    } else {
      res.status(400).json({ status: false });
    }

  } catch (err) {
    res.status(500).json({ status: false, statusText: "Internal Server Error", err });
  }
}
//#endregion
