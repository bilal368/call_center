const { auditTrailFunction } = require("../auditTrail");
const db = require("../utils/DAL");
let log = require("log4js").getLogger("User");
const audit = require("../auditTrail");

class calls {
  // Fetch call reports
  static async getCallReports(
    inDialledNumber,
    inExtensionNumbers,
    inCallDirection,
    inAgentCode,
    inColorCode,
    inChannelName,
    inAgentName,
    inCallStartDateTime,
    inCallEndDateTime,
    inCallStartTime,
    inCallEndTime,
    inPageNumber,
    inRecordsPerPage,
    inUserId,
    inSortColumn,
    inSortOrder,
    inSelectedTag
  ) {

    try {
      const query = `
        CALL spGetCallRecordingCallReport(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        inDialledNumber,
        inExtensionNumbers,
        inCallDirection,
        inAgentCode,
        inColorCode,
        inChannelName,
        inAgentName,
        inSelectedTag,
        inCallStartDateTime,
        inCallEndDateTime,
        inCallStartTime,
        inCallEndTime,
        inPageNumber,
        inRecordsPerPage,
        inUserId,
        inSortColumn,
        inSortOrder,
      ];


      const [response] = await db.query(query, params);
      return response;
    } catch (error) {
      console.error("Database Error:", error);
      log.error(error);
      throw error;
    }
  }
  // Fetch Call Reports Details
  static async getCallReportsDetails() {
    try {
      const [response] = await db.query(
        `SELECT DISTINCT dialledNumber AS uniqueValue, 'dialledNumber' AS valueType
          FROM dgRecordingCallLog
          UNION
          SELECT DISTINCT extensionNumber AS uniqueValue, 'extensionNumber' AS valueType
          FROM dgRecordingCallLog
          UNION
          SELECT DISTINCT agentCode AS uniqueValue, 'agentCode' AS valueType
          FROM dgRecordingCallLog
          UNION
          SELECT DISTINCT channelName AS uniqueValue, 'channelName' AS valueType
          FROM dgRecordingCallLog
          UNION
          SELECT DISTINCT agentName AS uniqueValue, 'agentName' AS valueType
          FROM dgRecordingCallLog
          UNION
          SELECT DISTINCT c.colorCode AS uniqueValue, 'colorCode' AS valueType
          FROM dgRecordingCallLog AS d
          JOIN dgColorCode AS c ON d.colorCodeId = c.colorCodeId
          UNION
          SELECT DISTINCT tags AS uniqueValue, 'tags' AS valueType
          FROM dgCallTagging;`
      );
      return response;
    } catch (err) {
      console.error(err);
      log.error(err);
      throw err;
    }
  }
  static async audioEncryptStatus() {
    try {
      const [response] = await db.query(`SELECT isActiveAudioEncryption FROM dgConfig WHERE status='true'`);
      return response;
    } catch (error) {
      console.error("Database Error:", error);
      log.error(error);
      throw error;
    }
  }

  static async agentNamefilter() {
    try {
      const [response] = await db.query(
        `SELECT agentCode AS uniqueValue, MIN(agentName) AS agentName, 'agentCode' AS valueType
        FROM dgRecordingCallLog
        GROUP BY agentName`
      );
      return response;
    } catch (err) {
      console.error(err);
      log.error(err);
      throw err;
    }
  }

  static async recordingCallLogId(recordingCallLogIds, loginId) {
    try {
      let response;
      for (const log of recordingCallLogIds) {
        response = await db.execute(
          `UPDATE dgRecordingCallLog SET isLocked = 1, lockedUserId = ? WHERE recordingCallLogId = ?`,
          [loginId, log.recordingCallLogId]
        );
      }
      return response;
    } catch (err) {
      log.error(err);
      throw err;
    }
  }
  static async recordingunlockCallLogId(recordingCallLogIds, loginId) {
    try {
      let response;
      for (const log of recordingCallLogIds) {
        response = await db.execute(
          `UPDATE dgRecordingCallLog SET isLocked = 0, lockedUserId = ? WHERE recordingCallLogId = ?`,
          [loginId, log.recordingCallLogId]
        );
      }
      return response;
    } catch (err) {
      log.error(err);
      throw err;
    }
  }
  static async recordinglockCallLogId(recordingCallLogId) {
    try {
      let response;
      response = await db.execute(
        `UPDATE dgRecordingCallLog SET isLocked = 0 WHERE recordingCallLogId = ?`,
        [recordingCallLogId]
      );
      return response;
    } catch (err) {
      log.error(err);
      throw err;
    }
  }
  // Notes updates
  static async notesRecording(notes, recordingCallLogId) {
    try {
      const response = await db.execute(
        `UPDATE dgRecordingCallLog SET notes = ? WHERE recordingCallLogId = ?`,
        [notes, recordingCallLogId]
      );

      return response;
    } catch (err) {
      log.error(err);
      throw err;
    }
  }
  // Delete Record
  static async deleteRecordings(delterecordings, loginId) {
    try {
      let response;
      const alreadyDeleted = [];
      const updatedRecords = [];
      const lockedRecords = [];

      for (const log of delterecordings) {
        const [rows] = await db.execute(
          `SELECT isDeleted, isLocked FROM dgRecordingCallLog WHERE recordingCallLogId = ?`,
          [log.recordingCallLogId]
        );

        if (rows.length > 0) {
          const record = rows[0];

          if (record.isDeleted === 1) {
            alreadyDeleted.push(log.recordingCallLogId);
          } else if (record.isLocked === 1) {
            lockedRecords.push(log.recordingCallLogId);
          } else {
            response = await db.execute(
              `UPDATE dgRecordingCallLog SET isDeleted = 1, deletedUserID = ? 
                   WHERE recordingCallLogId = ? AND isDeleted = 0`,
              [loginId, log.recordingCallLogId]
            );
            updatedRecords.push(log.recordingCallLogId);
          }
        }
      }
      return { updatedRecords, alreadyDeleted, lockedRecords };
    } catch (err) {
      log.error(err);
      throw err;
    }
  }
  // Add Feedback
  static async addFeedback(recordingCallLogId, feedback) {
    try {
      const response = await db.execute(
        `UPDATE dgRecordingCallLog SET supervisorFeedBack = ? WHERE recordingCallLogId = ?`,
        [feedback, recordingCallLogId]
      );
      return response;
    } catch (err) {
      log.error(err);
      throw err;
    }
  }
  // Color Code
  static async getColorCode() {
    try {
      const [response] = await db.execute(
        `SELECT colorCodeId, colorCode, active FROM dgColorCode where active = 1`
      );

      return response;
    } catch (err) {
      log.error(err);
      throw err;
    }
  }
  // Update Color CodeId
  static async UpdatecolorCode(colorCodeId, recordingCallLogId) {
    try {
      const response = await db.execute(
        `UPDATE dgRecordingCallLog SET colorCodeId = ? WHERE recordingCallLogId = ?`,
        [colorCodeId, recordingCallLogId]
      );
      return response;
    } catch (err) {
      log.error(err);
      throw err;
    }
  }
}
class colorCode {
  static async colorcodeReports(
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
    adminUserId
  ) {
    try {
      const [result] = await db.query(
        "CALL spGetCallRecordingColorCodeSummaryReport(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
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
        ]
      );
      let newValue = {};
      newValue = JSON.stringify(result);
      await audit.auditTrailFunction(
        adminUserId,
        "COLOR CODE REPORT",
        "READ",
        "Color code report accessed",
        "dgUser",
        "0",
        null,
        newValue,
        null
      );
      return result; // Return the results of the stored procedure
    } catch (error) {
      console.error("Error fetching color code summary report:", error);
      throw error;
    }
  }

  static async ColorCodeDetailExcelReport(
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
    adminUserId
  ) {
    try {
      const [result] = await db.query(
        "CALL spGetCallRecordingColorCodeDetailExcelReport(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          inColorCodeId || null,
          inExtensionNumber || null,
          inCallDirection || null,
          inAgentCode || null,
          inCallStartDateTime || null,
          inCallEndDateTime || null,
          inCallStartTime || null,
          inCallEndTime || null,
          inPageNumber || null,
          inRecordsPerPage || null,
          inUserId || null,
          inSortColumn || null,
          inSortOrder || null,
        ]
      );
      let newValue = {};
      newValue = JSON.stringify(result);
      await audit.auditTrailFunction(
        adminUserId,
        "COLOR CODE REPORT",
        "UPLOAD",
        "COLOR CODE REPORT EXCEL DOWNLOADED",
        "dgColorCode",
        "0",
        null,
        newValue,
        null
      );
      return result; // Return the results of the stored procedure
    } catch (error) {
      console.error("Error fetching color code summary report:", error);
      throw error;
    }
  }
}
class extension {
  static async getExtensions() {
    try {
      const [response] = await db.execute(
        "SELECT DISTINCT(extensionNumber) FROM dgExtension"
      );
      return response;
    } catch (err) {
      throw err;
    }
  }
  static async getExtnesionReports(
    inExtensionNumbers,
    inCallDirection,
    inCallStartDateTime,
    inCallEndDateTime,
    inCallStartTime,
    inCallEndTime,
    inPageNumber,
    inRecordsPerPage,
    inUserId,
    inSortColumn,
    inSortOrder
  ) {
    try {
      const [response] = await db.query(
        `CALL spGetExtensionSummaryReport(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          inExtensionNumbers,
          inCallDirection,
          inCallStartDateTime,
          inCallEndDateTime,
          inCallStartTime,
          inCallEndTime,
          inPageNumber,
          inRecordsPerPage,
          inUserId,
          inSortColumn,
          inSortOrder,
        ]
      );
      return response;
    } catch (err) {
      console.error(err);
      log.error(err);
      throw err;
    }
  }
}
class frequent {
  static async frequentCallReport(
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
  ) {
    try {
      const [result] = await db.query(
        "CALL spGetCallRecordingFrequentCallReport(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,? ,? ,?)",
        [
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
        ]
      );
      let newValue = {};
      newValue = JSON.stringify(result);
      await audit.auditTrailFunction(
        adminUserId,
        "FREQUENT CALL REPORT",
        "READ",
        "Frequent call report accessed",
        "dgRecordingCallLog",
        "0",
        null,
        newValue,
        null
      );
      return result;
    } catch (error) {
      console.error("Error fetching color code summary report:", error);
      throw error;
    }
  }
}
class agents {
  static async agentReports(
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
    adminUserId
  ) {
    try {
      const [result] = await db.query(
        "CALL spGetCallRecordingAgentSummaryReport(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
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
        ]
      );
      let newValue = {};
      newValue = JSON.stringify(result);
      await audit.auditTrailFunction(
        adminUserId,
        "AGENT REPORT",
        "READ",
        "AGENT REPORT accessed",
        "dgRecordingCallLog",
        "0",
        null,
        newValue,
        null
      );
      return result; // Return the results of the stored procedure
    } catch (error) {
      console.error("Error fetching color code summary report:", error);
      throw error;
    }
  }
  static async getAgents() {
    try {
      const [result] = await db.query(
        "SELECT  * FROM dgRecordingCallLog WHERE isDeleted=0 GROUP BY agentCode "
      );
      return result;
    } catch (error) {
      console.error("Error fetching extensions:", error);
      throw error;
    }
  }
}

class deletedCallReport {
  static async deletedCallReport(
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
  ) {
    try {
      const [result] = await db.query(
        "CALL spGetCallRecordingDeletedCallReport(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?)",
        [
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
          inSortOrder,
        ]
      );
      return result; // Return the results of the stored procedure
    } catch (error) {
      console.error("Error fetching Deleted call report:", error);
      throw error;
    }
  }

  static async getExtensionNumber() {
    try {
      const [result] = await db.query(
        "SELECT * FROM dgRecordingCallLog GROUP BY extensionNumber"
      );
      return result;
    } catch (error) {
      console.error("Error fetching extensions:", error);
      throw error;
    }
  }
  static async getDialedNumber() {
    try {
      const [result] = await db.query(
        "SELECT dialledNumber FROM dgRecordingCallLog GROUP BY dialledNumber"
      );
      return result;
    } catch (error) {
      console.error("Error fetching extensions:", error);
      throw error;
    }
  }
  static async getcallerId() {
    try {
      const [result] = await db.query(
        "SELECT callerId FROM dgRecordingCallLog GROUP BY callerId"
      );
      return result;
    } catch (error) {
      console.error("Error fetching extensions:", error);
      throw error;
    }
  }


  static async getUsers() {
    try {
      const [result] = await db.query(`
        SELECT userId,firstname, middlename, lastname, username
        FROM dgUser
        WHERE username IS NOT NULL AND username != ''
    `);
    
      return result;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  // Fetch deletedUserID from dgRecordingCallLog where deletedUserID matches userId
  static async getDeletedUsers() {
    try {
      const [result] = await db.query(`
          SELECT DISTINCT deletedUserID
          FROM dgRecordingCallLog
        `);
      return result;
    } catch (error) {
      console.error("Error fetching deleted users:", error);
      throw error;
    }
  }

  static async getloginUsers() {
    try {
      const [result] = await db.query(`
          SELECT DISTINCT userId
          FROM dgUserLoginDetail
        `);
      return result;
    } catch (error) {
      console.error("Error fetching deleted users:", error);
      throw error;
    }
  }
}
class concurrentReport {
  static async getConcurrentReport(
    inCallStartDateTime,
    inCallEndDateTime,
    inSortColumn,
    inSortOrder,
    inTimelineCriteria,
    inPageNumber,
    inRecordsPerPage
  ) {
    try {
      const [result] = await db.query(
        "CALL spGetCallRecordingMaxConcurrentCallReport(?, ?, ?, ?, ?, ?, ?)",
        [
          inCallStartDateTime,
          inCallEndDateTime,
          inSortColumn,
          inSortOrder,
          inTimelineCriteria,
          inPageNumber,
          inRecordsPerPage,
        ]
      );
      return result; // Return the results of the stored procedure
    } catch (error) {
      console.error("Error fetching max concurrent call report:", error);
      throw error;
    }
  }
}
class timelineReport {
  static async getTimelineReport(
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
  ) {
    try {
      const [result] = await db.query(
        "CALL spGetCallRecordingTimelineReport(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)",
        [
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
          inTimelineCriteria,
        ]
      );
      return result; // Return the results of the stored procedure
    } catch (error) {
      console.error("Error fetching timeline report:", error);
      throw error;
    }
  }
}
class loginTrackReports {
  static async loginTrackReports(
    inLoginStatus,
    inLoginTrackUserId,
    inCallStartDateTime,
    inCallEndDateTime,
    inPageNumber,
    inRecordsPerPage,
    inSortColumn,
    inSortOrder,
    adminUserId
  ) {
    try {
      const [result] = await db.query(
        "CALL spGetLoginTrackReport(?, ?, ?, ?, ?, ?, ?, ?)",
        [
          inLoginStatus,
          inLoginTrackUserId,
          inCallStartDateTime,
          inCallEndDateTime,
          inPageNumber,
          inRecordsPerPage,
          inSortColumn,
          inSortOrder,
        ]
      );

      // Convert the result to JSON format
      let newValue = {};
      newValue = JSON.stringify(result);

      // Log the audit trail with proper string interpolation for the adminUserId
      await audit.auditTrailFunction(
        adminUserId,
        "LOGIN TRACK REPORT",
        "READ",
        `LOGIN TRACK REPORT accessed`, // Corrected string interpolation
        "dgUserLoginDetail",
        "0",
        null,
        newValue,
        null
      );

      return result; // Return the results of the stored procedure
    } catch (error) {
      console.error("Error fetching login track report:", error);
      throw error;
    }
  }

  static async authenticated() {
    try {
      const [result] = await db.query(
        "SELECT * FROM dgUserLoginDetail GROUP BY loginStatus"
      );
      return result;
    } catch (error) {
      console.error("Error fetching extensions:", error);
      throw error;
    }
  }
}
class auditTrail {
  static async getModules() {
    try {
      const [res] = await db.execute("SELECT * FROM dgModuleName");
      return res;
    } catch (err) {
      log.error(err);
      console.log(err);
    }
  }
  static async getUsers() {
    try {
      const [user] = await db.execute("SELECT * FROM dgUser");
      return user;
    } catch (err) {
      console.log(err);
      log.error(err);
    }
  }
  static async getAction() {
    try {
      const [actions] = await db.execute(
        "SELECT actionName,moduleActionId FROM dgModuleAction where active=1;"
      );
      return actions;
    } catch (err) {
      console.log("err:", err);
      log.error(err);
    }
  }
  static async getAuditTrailReport(
    module,
    action,
    user,
    sDate,
    eDate,
    pageNo,
    recordPerPage,
    adminUserId,
    sortColumn,
    sortOrder
  ) {
    try {
      const [res] = await db.query(
        "CALL spGetCallRecordingAuditTrialReport(?,?,?,?,?,?,?,?,?,?)",
        [
          module,
          action,
          user,
          sDate,
          eDate,
          pageNo,
          recordPerPage,
          adminUserId,
          sortColumn,
          sortOrder,
        ]
      );
      return res;
    } catch (err) {
      console.log(err);
      log.error(err);
    }
  }
  static async getcallTagging() {
    try {
      const [actions] = await db.execute(
        "SELECT * FROM dgCallTagging where isActive=1;"
      );
      return actions;
    } catch (err) {
      console.log("err:", err);
      log.error(err);
    }
  }

  static async getcallTaggingDetails(recordingCallLogId) {
    try {
      const [actions] = await db.execute(
        `SELECT * FROM dgCallTaggingDetails where isActive = 1 AND recordingCallLogId = ${recordingCallLogId}`
      );
      return actions;
    } catch (err) {
      console.log("err:", err);
      log.error(err);
    }
  }
  static async updateCallTagging(customTag) {
    try {
      const query = "INSERT INTO dgCallTagging (tags) VALUES (?)";
      const values = [customTag];

      const [actions] = await db.execute(query, values);
      return actions;
    } catch (err) {
      console.log("err:", err);
      log.error(err);
      if (err.errno == 1062) {
        throw err;
      }
    }
  }
  // Insert Call Tagging Details
  static async insertCallTaggingDetails(callTagDetails) {
    try {
      const {
        recordingCallLogId,
        startPoint,
        endPoint,
        description,
        selectedTag,
      } = callTagDetails;

      const query = `INSERT INTO dgCallTaggingDetails
        (recordingCallLogId, startPoint, endPoint, description, selectedTag) VALUES (?, ?, ?, ?, ?)`;
      const values = [recordingCallLogId, startPoint, endPoint, description, selectedTag];

      const [actions] = await db.execute(query, values);

      if (actions.insertId) {
        console.log("Inserted Call Tagging ID:", actions.insertId);
        const callTaggingDetailsID = actions.insertId.toString(); // Convert to string for consistency

        // Fetch existing callTaggingDetailsID and its data
        const selectQuery = `SELECT callTaggingDetailsID FROM dgRecordingCallLog WHERE recordingCallLogId = ?`;
        const [rows] = await db.execute(selectQuery, [recordingCallLogId]);

        let existingIds = rows[0]?.callTaggingDetailsID ? JSON.parse(rows[0].callTaggingDetailsID) : [];

        // Add new entry with details
        const newEntry = {
          id: callTaggingDetailsID,
          recordingCallLogId,
          startPoint,
          endPoint,
          description,
          selectedTag,
        };

        // Merge existing IDs with the new one, avoiding duplicates
        existingIds.push(newEntry);

        // Update the column with JSON data
        const updateQuery = `UPDATE dgRecordingCallLog SET callTaggingDetailsID = ? WHERE recordingCallLogId = ?`;
        await db.execute(updateQuery, [JSON.stringify(existingIds), recordingCallLogId]);
      }

      return actions;
    } catch (err) {
      console.log("Error:", err);
      log.error(err);
    }
  }

  // Delete callTaggingDetailsID
  static async deleteCallTaggingDetails(callTaggingDetailsID) {
    try {
      const query = `update dgCallTaggingDetails set isActive = 0 where callTaggingDetailsID = ?;`;
      const values = [callTaggingDetailsID];

      const [actions] = await db.execute(query, values);
      return actions;
    } catch (err) {
      console.log("err:", err);
      log.error(err);
    }
  }
}

module.exports = {
  calls,
  extensionReport: extension,
  frequent,
  colorCode,
  agents,
  auditTrail,
  timelineReport,
  concurrentReport,
  deletedCallReport,
  loginTrackReports,
};
