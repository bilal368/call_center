const mysql = require('mysql2/promise');
const db = require('../utils/DAL');
const log = require('log4js').getLogger("User");
const bcrypt = require("bcrypt");

class LicenceKey {
  // Fetch Licence key
  static async fetchLicenseKey() {
    try {
      return await db.execute("SELECT id, token, status FROM dgConfig");
    } catch (err) {
      log.error(err);
      throw err;
    }
  }
  static async fetchLicenseKeyActive() {
    try {
      return await db.execute("SELECT id, token, status FROM dgConfig where status='true'");
    } catch (err) {
      log.error(err);
      throw err;
    }
  }
  // Update Licence key
  static async updateLicenseKey(token, internalFeatures, serialKey, amc) {
    const connection = await db.getConnection(); // Use your connection pool
    try {
        let amc_status;
        let amc_startDate;
        let amc_endDate;

        // Extract AMC details if provided
        if (amc) {
            amc_status = amc.st; // amc_status
            amc_startDate = amc.sd; // amc_startDate
            amc_endDate = amc.ed; // amc_endDate
        }

        await connection.beginTransaction(); // Start the transaction

        // Set status to 'false' for all records in dgConfig
        const [updateStatusResult] = await connection.execute("UPDATE dgConfig SET status = 'false'");
        log.info("UpdateStatus:", updateStatusResult);
        console.log("UpdateStatus:", updateStatusResult);
        
        // Insert new token into dgConfig
        const [insertTokenResult] = await connection.execute(
            `INSERT INTO dgConfig (token, status, serialKey, amcStatus, startDate, endDate) 
             VALUES (?, 'true', ?, ?, ?, ?)`,
            [token, serialKey, amc_status ? 1 : 0, amc_startDate, amc_endDate]
        );
        console.log("InsertTokenResult:", insertTokenResult);

        log.info("InsertTokenResult:", insertTokenResult);
        const insertId = insertTokenResult.insertId;

        // Iterate over internalFeatures and insert/update basicFeatureName in the database
        for (const feature of internalFeatures) {
            const basicFeatureName = feature; // Simplified internalFeatures only contains basicFeatureName

            // Check if the basicFeatureName already exists in the database
            const [existingFeature] = await connection.execute(
                "SELECT * FROM dgModuleName WHERE moduleName = ?",
                [basicFeatureName]
            );

            if (existingFeature.length > 0) {
                // If the feature already exists, update it
                await connection.execute(
                    "UPDATE dgModuleName SET active = 1 WHERE moduleName = ?",
                    [basicFeatureName]
                );

                // Special handling for 'AUDIO ENCRYPTED'
                if (basicFeatureName === 'AUDIO ENCRYPTED' && existingFeature[0].active) {
                    setTimeout(async () => {
                        try {
                            await connection.execute("UPDATE dgConfig SET isActiveAudioEncryption = 1 WHERE id = ?", [insertId]);
                            console.log("Update successful after 5 seconds.");
                        } catch (error) {
                            console.error("Error updating dgConfig:", error);
                        }
                    }, 5000); // 5000 ms = 5 seconds
                }
            } else {
                // If the feature doesn't exist, insert it
                if (basicFeatureName !== 'AUDIO ENCRYPTED') {
                    await connection.execute(
                        "INSERT INTO dgModuleName (moduleName, active) VALUES (?, 1)",
                        [basicFeatureName]
                    );
                } else {
                    // Special handling for 'AUDIO ENCRYPTED'
                    setTimeout(async () => {
                        try {
                            await connection.execute("UPDATE dgConfig SET isActiveAudioEncryption = 1 WHERE id = ?", [insertId]);
                            console.log("Update successful after 5 seconds.");
                        } catch (error) {
                            console.error("Error updating dgConfig:", error);
                        }
                    }, 5000); // 5000 ms = 5 seconds
                }
            }
        }

        // Check if the default admin user exists, and create it if not
        const [existingSettingsUser] = await connection.execute(
            "SELECT * FROM dgUser WHERE userHierarchyId = 2"
        );

        if (existingSettingsUser.length === 0) {
            const username = 'Admin';
            const firstname = 'Master';
            const middlename = 'Admin';
            const lastname = 'DGvox';
            const primaryEmail = 'admin@gmail.com';
            const phone = '000000000000';
            const extension = '';
            const designation = '';
            const agentcode = '';
            const employeeID = '';
            const hashedPassword = '$2b$10$DVqQaK.EAQpW3eI368.CV.342hc9ucyrSaTv6WdjE9GDUyPYNJULK';
            const userHierarchyId = 2;
            const packageFeatureTabPermissionIds = '0,15,1,5,2,3,4,6,7,8,9,10,11,12,13,14,16,17,18,19,20,21,22,23,24,25';

            // Insert into dgRole and get the roleId
            const [roleResult] = await connection.execute(
                "INSERT INTO dgRole (status, roleName, packageFeatureTabPermissionIds) VALUES (1, 'Master', ?)",
                [packageFeatureTabPermissionIds]
            );

            const roleId = roleResult.insertId;

            // Insert the default admin user
            await connection.execute(
                "INSERT INTO dgUser (username, firstname, middlename, lastname, primaryEmail, phone, extension, roleId, designation, agentCode, employeeID, password, userHierarchyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    username,
                    firstname,
                    middlename,
                    lastname,
                    primaryEmail,
                    phone,
                    extension,
                    roleId,
                    designation,
                    agentcode,
                    employeeID,
                    hashedPassword,
                    userHierarchyId
                ]
            );
        }

        // Commit the transaction
        await connection.commit();

        return insertTokenResult;
    } catch (err) {
        // Rollback the transaction in case of an error
        await connection.rollback();
        log.error("Error:", err);
        throw err;
    } 
}
  // Validate Licence key
  static async validateLicenseKey() {
    try {
      return await db.execute("SELECT id, token, status FROM dgConfig");
    } catch (err) {
      log.error(err);
      throw err;
    }
  }
  static async getLicenseDate(){
    try{
      const [[result]] = await db.execute(`
      SELECT startDate, endDate 
      FROM dgConfig 
      WHERE amcStatus = 1 
      ORDER BY id DESC 
      LIMIT 1;
  `);
    return result;
    }catch(err){
      console.log(err);
      log.error(err)
    }
  }
}

module.exports = { LicenceKey };
