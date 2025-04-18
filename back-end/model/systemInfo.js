const db = require("../utils/DAL");
let log = require("log4js").getLogger("User");
const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const redisClient = require('../redisconnection');
class systemInfo {
  static async updateLogoName(logoName) {
    try {
      const [result] = await db.query(`UPDATE dgOrganizationDetails SET logoImageFileName=?`, [logoName])
      return result;
    } catch (error) {
      throw error;
    }
  }
  static async getLogoName() {
    try {
      const [result] = await db.query(`SELECT logoImageFileName from dgOrganizationDetails WHERE 1=1`)
      return result;
    } catch (error) {
      throw error;
    }
  }
  static async getRegistrationDetails() {
    try {
      const [result] = await db.query(`SELECT * from dgOrganizationDetails`)
      return result;
    } catch (error) {
      throw error;
    }
  }
  static async getLicenseKey() {
    try {
      const [result] = await db.query(`SELECT serialKey,token from dgConfig WHERE status='true'`)
      return result;
    } catch (error) {
      throw error;
    }
  }
  static async saveRegistration(organizationName, address1, city, phone, email, address2, state, fax, website) {
    try {
      const existsQuery = "SELECT 1 FROM dgOrganizationDetails LIMIT 1";
      const [existsResult] = await db.query(existsQuery);

      if (existsResult.length > 0) {
        // Update the existing record
        const updateQuery = "UPDATE dgOrganizationDetails SET ? WHERE 1 = 1";
        const updateValues = {
          organizationName,
          address1,
          city,
          phone,
          email,
          address2,
          state,
          fax,
          website
        };
        const [result] = await db.query(updateQuery, updateValues);
        return result;
      } else {
        // Insert a new record
        const insertQuery = "INSERT INTO dgOrganizationDetails SET ?";
        const insertValues = {
          organizationName,
          address1,
          city,
          phone,
          email,
          address2,
          state,
          fax,
          website
        };
        const [result] = await db.query(insertQuery, insertValues);
        return result;
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

}
class archive {
  static async updateArchiveStatus(archiveFileName, archiveFilePath, archiveStatus, mountedPoint, archiveType) {
    try {
      // Check for existing record
      const [existingRecord] = await db.execute(
        'SELECT * FROM dgArchiveDataDetail WHERE archiveFileName = ?',
        [archiveFileName]
      );
      if (existingRecord.length > 0) {
        // Duplicate filename found - return an error object
        return { error: `Archive file with name '${archiveFileName}' already exists.` };
      } else {
        // Insert new record
        const insertQuery = "INSERT INTO dgArchiveDataDetail SET ?";
        const insertValues = {
          archiveFileName, archiveFilePath, archiveStatus, mountedPoint, archiveType
        };
        const [insertResult] = await db.query(insertQuery, insertValues);
        return { ...insertResult, action: 'inserted' };
      }
    } catch (error) {
      console.error("Error updating archive status:", error);
      throw error; // Re-throw for higher-level error handling
    }
  }
  static async getDefaultLocation() {
    try {
      const [result] = await db.query('SELECT archiveFilePath FROM dgArchiveDataDetail;')
      return result;
    } catch (error) {
      throw error
    }
  }
  static async resetDefaultLocation() {
    try {
      const [result] = await db.query('UPDATE  dgArchiveDataDetail SET isActivePath=0')
      return result;
    } catch (error) {
      throw error
    }
  }
  static async mountFileSystem(requestData) {
    try {
      const apiUrl = `${process.env.ARCHIVE_MOUNT_API}/mount`// Replace with your API URL
      // Send POST request with payload
      const response = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json', // Ensure the correct content type
          'Accept': 'application/json',       // Ensure the API accepts JSON
        }
      });

      return response.data; // Return the data received from the API
    } catch (error) {
      throw error
    }
  }
  static async unMountFileSystem(requestData) {
    try {
      const apiUrl = `${process.env.ARCHIVE_MOUNT_API}/unmount`; // Replace with your API URL
      // Send POST request with payload
      const queryParams = new URLSearchParams({ mount_point: requestData }).toString(); // Build query string

      const response = await axios.post(`${apiUrl}?${queryParams}`, requestData, {
        headers: {
          'Content-Type': 'application/json', // Ensure the correct content type
        }
      });

      return response.data; // Return the data received from the API
    } catch (error) {
      console.error("Error in un mount FileSystem:", error);
      throw error
    }
  }
  static async getArchiveList(pageNumber, recordsPerPage, searchFileName, selectedArchiveTypes) {
    try {
        const offset = (pageNumber - 1) * recordsPerPage;

        // Base condition (active=1)
        let conditions = [`active = 1`];
        let queryParams = [];

        // Add search condition if provided
        if (searchFileName) {
            conditions.push(`archiveFileName LIKE ?`);
            queryParams.push(`%${searchFileName}%`);
        }

        // Add archive type filter if selected
        if (selectedArchiveTypes && selectedArchiveTypes.length > 0) {
            conditions.push(`archiveType IN (?)`);
            queryParams.push(selectedArchiveTypes);
        }

        // Construct final WHERE clause
        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        // Query to fetch paginated records
        const [records] = await db.query(`
            SELECT * 
            FROM dgArchiveDataDetail 
            ${whereClause}
            LIMIT ? OFFSET ?`, 
            [...queryParams, recordsPerPage, offset]
        );

        // Query to count total records
        const totalQuery = `
            SELECT COUNT(*) as totalRecords 
            FROM dgArchiveDataDetail 
            ${whereClause}`;
        const [[{ totalRecords }]] = await db.query(totalQuery, queryParams);

        // Calculate total pages
        const totalPages = Math.ceil(totalRecords / recordsPerPage);

        return { records, totalRecords, totalPages };
    } catch (error) {
        throw error;
    }
}



  static async getAutoArchiveList() {
    try {
      const [result] = await db.execute("SELECT * FROM dgAutoArchiveScheduleData \
          WHERE `timePeriod` IN ('Auto Monthly', 'Auto Weekly', 'Auto Daily') AND active=1;");
      return result;
    } catch (err) {
      throw err;
    }
  }
  // select last five data for show manual archived list in archive settings page
  static async getManualArchivedList(){
    try {
        const [result] = await db.execute(`SELECT *  
                          FROM dgArchiveDataDetail  
                          WHERE archiveType = 'Manual' AND active = 1  
                          ORDER BY archiveDataDetailId DESC  
                          LIMIT 5;`);
      return result;
    } catch (err) {
      throw err;
    }
  }
  static async readJSONFromRedis(redisKey) {
    try {
      return new Promise((resolve, reject) => {
        redisClient.get(redisKey, (err, data) => {
          if (err) {
            console.error('Error fetching data from Redis:', err.message);
            return reject(new Error('Failed to fetch data from Redis'));
          }
          if (!data) {
            console.error(`No data found for key: ${redisKey}`);
            return reject(new Error(`No data found in Redis for key: ${redisKey}`));
          }

          try {
            // Parse the data as JSON
            const jsonData = JSON.parse(data);

            resolve(jsonData);
          } catch (parseError) {
            console.error('Error parsing JSON from Redis:', parseError.message);
            reject(new Error('Failed to parse JSON data from Redis'));
          }
        });
      });
    } catch (error) {
      console.error('Unexpected error while accessing Redis:', error.message);
      throw new Error('Unexpected error occurred while accessing Redis');
    }
  }
  static async deleteArchiveReport(archiveDataDetailId) {
    try {
      const [result] = await db.query(`UPDATE dgArchiveDataDetail SET active=0 
      WHERE archiveDataDetailId=?`, archiveDataDetailId);
      return result
    } catch (error) {
      console.error('Error deleting archive report:', error);
      throw error;
    }
  }
  static async findUserById(adminUserId) {
    try {
      const [rows] = await db.query(`SELECT password FROM dgUser WHERE userId=?`, [adminUserId]);
      // Check if the user exists
      if (rows.length === 0) {
        return null; // No user found
      }
      // Return the first row (user)
      return rows[0];
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }
  static async saveAutoSchedules(path, mountPoint, timePeriod,day,time, adminUserId) {
    try {
        // Step 1: Check if data exists for the given timePeriod
        const [existingRecords] = await db.execute(
            `SELECT COUNT(*) AS count FROM dgAutoArchiveScheduleData WHERE timePeriod = ? AND active = 1`,
            [timePeriod]
        );

        if (existingRecords[0].count > 0) {
            // Step 2: If data exists, deactivate the existing records
            await db.execute(
                `UPDATE dgAutoArchiveScheduleData 
                 SET active = 0 
                 WHERE timePeriod = ?;`,
                [timePeriod]
            );
        }

        // Step 3: Insert new record with activeStatus = 1
        const [result] = await db.execute(
            `INSERT INTO dgAutoArchiveScheduleData 
             (archivePath, mountPoint, timePeriod, adminUserId, active,archiveDay,archiveTime) 
             VALUES (?, ?, ?, ?, 1,?,?)`,
            [path, mountPoint, timePeriod, adminUserId,day,time]
        );

        return result;
    } catch (err) {
        console.log(err);
    }
}

  static async getSchedules(timePeriod){
    try{
      const [rows] = await db.execute(
        `SELECT archivePath AS path, mountPoint, timePeriod, adminUserId,archiveDay as day,archiveTime as time 
         FROM dgAutoArchiveScheduleData WHERE timePeriod = ? AND active = 1`,
        [timePeriod]
    );
 return rows;

    }catch(err){
      console.log("err:",err);
      log.error(err);
    }
  }
}

class autoDelete {
  static async saveAutoDelete(autoDeleteType, thresholdMin, thresholdMax, retentionDays) {
    try {
      const [rows] = await db.query(
        `SELECT autoDeleteSettingsId FROM dgAutoDeleteSettings LIMIT 1`
      );

      if (rows.length > 0) {
        // Update existing record
        await db.query(
          `UPDATE dgAutoDeleteSettings 
                 SET autoDeleteType = ?, thresholdMinPercentage = ?, thresholdMaxPercentage = ?, 
                     retentionDays = ?, modifiedDate = NOW() 
                 WHERE autoDeleteSettingsId = ?`,
          [autoDeleteType, thresholdMin, thresholdMax, retentionDays, rows[0].autoDeleteSettingsId]
        );
      } else {
        // Insert new record
        await db.query(
          `INSERT INTO dgAutoDeleteSettings (autoDeleteType, thresholdMinPercentage, thresholdMaxPercentage, retentionDays) 
                 VALUES (?, ?, ?, ?)`,
          [autoDeleteType, thresholdMin, thresholdMax, retentionDays]
        );
      }

      return true;

    } catch (error) {
      console.error('Error saving auto-delete settings:', error);
      throw error;
    }
  }
  static async getAutoDelete() {
    try {
      const [rows] = await db.query(
        `SELECT autoDeleteType, thresholdMinPercentage AS thresholdMin, 
                  thresholdMaxPercentage AS thresholdMax, retentionDays 
           FROM dgAutoDeleteSettings 
           LIMIT 1`
      );

      if (rows.length > 0) {
        return rows[0]; // Return the first record
      } else {
        return null; // No settings found
      }

    } catch (error) {
      console.error('Error fetching auto-delete settings:', error);
      throw error;
    }
  }


}
class mailer {
  static async saveMailSettings(SMTPServer, username, SMTPPort, password, senderEmail, isSslEnabled) {
    try {
        const [rows] = await db.query(
            `SELECT SMTPSettingId FROM dgSMTPSetting LIMIT 1`
        );

        if (rows.length > 0) {
            // Update existing record
            await db.query(
                `UPDATE dgSMTPSetting 
                 SET SMTPServer = ?, username = ?, SMTPPort = ?, password = ?, 
                     senderEmail = ?, isSslEnabled = ?, modifiedDate = NOW() 
                 WHERE SMTPSettingId = ?`,
                [SMTPServer, username, SMTPPort, password, senderEmail, isSslEnabled, rows[0].SMTPSettingId]
            );
        } else {
            // Insert new record
            await db.query(
                `INSERT INTO dgSMTPSetting (SMTPServer, username, SMTPPort, password, senderEmail, isSslEnabled) 
                 VALUES (?, ?, ?, ?, ?, ?)` ,
                [SMTPServer, username, SMTPPort, password, senderEmail, isSslEnabled]
            );
        }

        return true;

    } catch (error) {
        console.error('Error saving SMTP settings:', error);
        throw error;
    }
}
static async getSMTPSettings() {
  try {
      const [rows] = await db.query(
          `SELECT SMTPServer, SMTPPort, username, password, senderEmail, isSslEnabled 
           FROM dgSMTPSetting 
           LIMIT 1`
      );

      if (rows.length > 0) {
          return rows[0]; // Return the first record
      } else {
          return null; // No settings found
      }

  } catch (error) {
      console.error('Error fetching SMTP settings:', error);
      throw error;
  }
}



}

module.exports = { systemInfo, archive, autoDelete ,mailer}