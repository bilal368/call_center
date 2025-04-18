const db = require("../utils/DAL");
const bcrypt = require("bcrypt");
const { json } = require("body-parser");
var log = require("log4js").getLogger("User");
const moment = require("moment");
const { settings } = require("./ldap");
const audit = require("../auditTrail");

class login {
  constructor(userName, password) {
    this.userName = userName;
    this.password = password;
  }
  static async getUserByID(id) {
    try {
      const [[response]] = await db.execute(
        "SELECT * FROM dgUser WHERE userId=?",
        [id]
      );
      return response;
    } catch (err) {
      console.log("Err::", err);
    }
  }
  static async findUserByLDAP(username) {
    try {
      const [response] = await db.execute(
        `SELECT * FROM dgUser WHERE username=?`,
        [username]
      );
      let status = true;
      response[0].isLDAPUser == 1 ? (status = true) : (status = false);
      return status;
    } catch (err) {
      console.log("Err::", err);
    }
  }
  static async getUserData(userName) {
    try {
      const [[response]] = await db.execute(
        `SELECT dU.languageId,dU.retryCount,dU.userId,dU.password as password,dU.username as username,
       dU.packageFeatureTabPermissionIds AS tabIdUser,
       dU.accessPermissionQueryFilter AS dataRestrictUser,
       dR.packageFeatureTabPermissionIds AS tabIdRole,
       dR.accessPermissionQueryFilter AS dataRestrictRole,
       dR.roleId,
       dU.userHierarchyId,
       dU.isLoggedIn
FROM dgUser AS dU JOIN dgRole AS dR
WHERE dU.roleId = dR.roleId AND dU.username =? AND dU.active=1`,
        [userName]
      );
      return response;
    } catch (err) {
      console.error(err);
      log.error(err);
      throw err;
    }
  }
  static async insertToken(token, userName) {
    try {
      await db.query("UPDATE dgUser SET token=? WHERE userName=?", [
        token,
        userName,
      ]);
    } catch (err) {
      console.log("err+", err);
      throw err;
    }
  }
  static async updateIsLoggedIn(userId, status) {
    // setting 1 for loggin 0 for logout
    try {
      const [result] = await db.query(
        `UPDATE dgUser SET isLoggedIn=? WHERE userId=?`,
        [status, userId]
      );
      return result;
    } catch (error) {
      console.error(error);
      log.error(error);
      throw err;
    }
  }
  static async unLockUser(userId) {
    try {
      const [result] = await db.query(
        `UPDATE dgUser SET retryCount=0 WHERE userId=?`,
        [userId]
      );
      return result;
    } catch (error) {
      console.error(error);
      log.error(error);
      throw err;
    }
  }
  static async setRetryCount(userId, action) {
    try {
      const updateQuery = `
      UPDATE dgUser
      SET retryCount = CASE
        WHEN ? THEN 0
        ELSE retryCount + 1
      END
      WHERE userId = ?
    `;

      await db.query(updateQuery, [action === "Reset", userId]);
    } catch (error) {
      console.error(error);
      log.error(error);
      throw err;
    }
  }
  static async insertLoginTrackDetails(
    userId,
    loginStatus,
    loginTime,
    logoutTime,
    ipAddress
  ) {
    try {
      // Log input parameters

      const [loginDetail] = await db.query(
        "INSERT INTO dgUserLoginDetail (userId, loginStatus, loginTime, logoutTime, ipAddress) VALUES (?,?,?,?,?)",
        [userId, loginStatus, loginTime, logoutTime, ipAddress]
      );
      return loginDetail;
    } catch (error) {
      throw error; // Re-throwing the error
    }
  }
  static async updateLoginTrackDetails(userId, currentTime) {
    try {
      const [loginDetail] = await db.query(
        `UPDATE  dgUserLoginDetail SET  logoutTime=? WHERE userId=?`,
        [currentTime, userId]
      );
      return loginDetail;
    } catch (error) {
      throw error;
    }
  }
  static async getLanguageFileNameById(languageId) {
    try {
      const [rows] = await db.execute(
        `SELECT languageFileName 
             FROM dgLanguage 
             WHERE languageId=?`,
        [languageId]
      );

      return rows[0]?.languageFileName;
    } catch (err) {
      console.log("Error fetching languageFileName:", err);
      throw err;
    }
  }

  static async fecthuserlanguages() {
    try {
      const [user] = await db.execute(`
      SELECT
        languageName,
        languageLabel,
        languageId,
        languageFileName,
        active
      FROM dgLanguage
    `);
      return user;
    } catch (err) {
      console.error("Database error:", err);
      throw new Error("Failed to fetch user languages");
    }
  }

  static async Updateuserlanguage(userId, languageId) {
    try {
      const [user] = await db.execute(
        `
      UPDATE dgUser
      SET languageId = ?
      WHERE  userId = ?;
    `,
        [languageId, userId]
      );

      return user;
    } catch (err) {
      console.error("Database error:", err);
      throw new Error("Failed to fetch user languages");
    }
  }
  static async ldapUserCreation(coulmns, datas, name) {
    try {
      let res = "";
      let status = "";
      const [[count]] = await db.query(
        "SELECT COUNT(*) AS count FROM dgUser WHERE username =?",
        [name]
      );
      if (count.count == 0) {
        const placeholders = datas.map(() => "?").join(", ");
        let str =
          `INSERT INTO dgUser(` + coulmns + `) VALUES(` + placeholders + `)`;
        res = await db.query(str, datas);
        status = "Success";
      } else {
        status = "Failed";
      }
      return status;
    } catch (err) {
      console.log(err);
      log.error(err);
    }
  }
  static async getUserByEmail(primaryEmail) {
    try {
      const [userData] = await db.query(
        "SELECT * FROM dgUser WHERE primaryEmail = ?",
        [primaryEmail]
      );
      if (userData && userData.length > 0) {
        return userData[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      log.error(err);
    }
  }
  static async getUserRoleByName(name) {
    try {
      const [[res]] = await db.execute(
        "SELECT * FROM dgRole WHERE roleName=?",
        [name]
      );
      return res;
    } catch (err) {
      console.log(err);
      log.error(err);
    }
  }
  static async updateUserToken(primaryEmail, token) {
    try {
      await db.query(
        "UPDATE dgUser SET forget_token = ? WHERE primaryEmail = ?",
        [token, primaryEmail]
      );
    } catch (error) {
      console.error("Error in updateUserToken:", error);
    }
  }
  static async getUserByToken(token) {
    try {
      const [user] = await db.query(
        "SELECT * FROM dgUser WHERE forget_token = ?",
        [token]
      );
      return user && user.length > 0 ? user[0] : null;
    } catch (error) {
      console.error("Error in getUserByToken:", error);
    }
  }
  static async updatePasswordAndToken(primaryEmail, newPassword, newToken) {
    try {
      const [user] = await db.query(
        "UPDATE dgUser SET password = ? , token=?  WHERE primaryEmail = ?",
        [newPassword, newToken, primaryEmail]
      );
      if (user.affectedRows != 0) {
        return [user];
      }
    } catch (err) {
      console.log(err);
    }
  }
  static async roleExist() {
    try {
      const [result] = await db.query(
        "select roleName from dgRole where status=1"
      );
      // console.log(result);
      return result;
    } catch (error) {
      console.error("Error in err:", error);
      throw error;
    }
  }
  static async insertUserGroup(roleName, adminUserId) {
    try {
      let newValue;
      let user = "";
      const [[isExist]] = await db.execute(
        "SELECT COUNT(*) as count FROM dgRole WHERE roleName=? AND status=1;",
        [roleName]
      );
      if (isExist.count == 0) {
        user = await db.query(
          "INSERT INTO dgRole (roleName,status) VALUES (?,1)",
          [roleName]
        );
        if (user[0].affectedRows > 0) {
          let newvalueview = await login.getUserByID(adminUserId);
          newValue = JSON.stringify(newvalueview);

          await audit.auditTrailFunction(
            adminUserId,
            "USER MANAGEMENT",
            "CREATE",
            "USER GROUP CREATED",
            "dgRole",
            user[0].insertId,
            null,
            newValue,
            null
          );
        }
      }

      return user;
    } catch (error) {
      console.error("Error in updatePasswordAndToken:", error);
      throw error;
    }
  }
  static getUserGroupId = async (userId) => {
    try {
      const [[result]] = await db.query(
        "SELECT userId, userHierarchyId, roleId, packageFeatureTabPermissionIds, languageId, divisionId, isLDAPUser, username, firstname, lastname, primaryEmail, secondaryEmail, primaryMobileNo, secondaryMobileNo, phone, extension, token, forget_token, designation, employeeID, middlename, dgUserAccess, accessPermission, accessPermissionQueryFilter, agentCode, isLoggedIn FROM dgUser WHERE active = 1 AND userId = ?",
        [userId]
      );
      return result;
    } catch (err) {
      console.error("err", err);
    }
  };
  static getUserlistId = async (roleId) => {
    // Ensure it's an array
    const query = `SELECT 
    dgUser.userId, dgUser.retryCount, dgUser.userHierarchyId, dgUser.roleId, 
    dgUser.packageFeatureTabPermissionIds, dgUser.languageId, dgUser.divisionId, dgUser.isLDAPUser, 
    dgUser.username, dgUser.firstname, dgUser.lastname, dgUser.primaryEmail, dgUser.secondaryEmail, 
    dgUser.primaryMobileNo, dgUser.secondaryMobileNo, dgUser.phone, dgUser.designation, 
    dgUser.employeeID, dgUser.middlename, dgUser.dgUserAccess, dgUser.accessPermission, 
    dgUser.accessPermissionQueryFilter, dgUser.agentCode, dgUser.isLoggedIn, dgRole.roleName, 
    COALESCE(GROUP_CONCAT(DISTINCT dgExtension.extensionNumber ORDER BY dgExtension.extensionNumber ASC SEPARATOR ', '), 'No data') AS extension
FROM dgUser 
JOIN dgRole ON dgUser.roleId = dgRole.roleId 
LEFT JOIN dgExtension ON dgUser.employeeID = dgExtension.employeeId AND dgExtension.active = 1 
WHERE dgUser.active = 1 
  AND dgUser.roleId IN (?) AND userHierarchyId=1
GROUP BY dgUser.userId, dgUser.retryCount, dgUser.userHierarchyId, dgUser.roleId, 
    dgUser.packageFeatureTabPermissionIds, dgUser.languageId, dgUser.divisionId, dgUser.isLDAPUser, 
    dgUser.username, dgUser.firstname, dgUser.lastname, dgUser.primaryEmail, dgUser.secondaryEmail, 
    dgUser.primaryMobileNo, dgUser.secondaryMobileNo, dgUser.phone, dgUser.designation, 
    dgUser.employeeID, dgUser.middlename, dgUser.dgUserAccess, dgUser.accessPermission, 
    dgUser.accessPermissionQueryFilter, dgUser.agentCode, dgUser.isLoggedIn, dgRole.roleName;`;
    try {
      const [result] = await db.query(
        query, [roleId],
      );
      return result;

    } catch (err) {
      console.error("err", err);
    }
  };
  static getuserListIdcount = async (roleId) => {
    try {
      const [result] = await db.query(
        "SELECT COUNT(*) as count FROM dgUser WHERE roleId=? AND active=1 AND userHierarchyId = 1;",
        [roleId]
      );
      return result;
    } catch (err) {
      console.error("err", err);
    }
  };
  static async getUsergroups(adminUserId) {
    let newValue;
    try {
      const [userGroups] = await db.query(
        "SELECT * FROM dgRole WHERE  status = ?",
        [1]
      );
      newValue = JSON.stringify(userGroups[0]);

      await audit.auditTrailFunction(
        adminUserId,
        "USER MANAGEMENT",
        "READ",
        "USER GROUP accessed",
        "dgRole",
        "0",
        null,
        newValue,
        null
      );
      // console.log(userGroups, 'usergroup');
      return userGroups;
    } catch (error) {
      throw err;
    }
  }
  static async getUsergroupsAlert(adminUserId) {
    let newValue;
    try {
      const [userGroups] = await db.query(
        "SELECT * FROM dgRole WHERE  status = ?",
        [1]
      );
      newValue = JSON.stringify(userGroups[0]);

      // await audit.auditTrailFunction(adminUserId, 'USER MANAGEMENT', 'READ', 'USER GROUP accessed', 'dgRole', '0', null, newValue, null);
      // console.log(userGroups, 'usergroup');
      return userGroups;
    } catch (error) {
      throw err;
    }
  }
  static async getUserRolesByStatus() {
    try {
      const [userGroups] = await db.query(
        "SELECT roleId,roleName,status FROM dgRole group by roleId; "
      );
      return userGroups;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  static async userRoleUpdation(selected, nonSelected) {
    try {
      let status = false;
      // Update the selected roles
      if (selected.length > 0) {
        await db.execute(
          `UPDATE dgRole SET status=1 WHERE roleId IN (${selected.join(",")});`
        );
      }
      // Update the non-selected roles
      if (nonSelected.length > 0) {
        await db.execute(
          `UPDATE dgRole SET status=0 WHERE roleId IN (${nonSelected.join(
            ","
          )});`
        );
      }
      status = true;
      return status;
    } catch (err) {
      console.log("err:", err);
      throw err;
    }
  }
  static async addFeatureByRole(roleID, feature) {
    try {
      await db.execute("UPDATE dgRole SET packageFeatureIds=? WHERE roleId=?", [
        feature,
        roleID,
      ]);
    } catch (err) {
      console.log(err);
      log.error(err);
    }
  }
  static async updateUsergroup(roleId, roleName, adminUserId) {
    let oldvalue;
    let newValue;
    try {
      oldvalue = await login.getUserByID(adminUserId);
      oldvalue = JSON.stringify(oldvalue);
      const [result] = await db.query(
        "UPDATE dgRole SET roleName = ? WHERE roleId = ?",
        [roleName, roleId]
      );
      // console.log(result,'result');
      if (result.affectedRows > 0) {
        const updatedUserGroup = await db.query(
          "SELECT * FROM dgRole WHERE roleId = ?",
          [roleId]
        );
        let newvalueview = await login.getUserByID(adminUserId);
        newValue = JSON.stringify(newvalueview);

        await audit.auditTrailFunction(
          adminUserId,
          "USER MANAGEMENT",
          "UPDATE",
          "USER GROUP UPDATE",
          "dgRole",
          roleId,
          oldvalue,
          newValue,
          null
        );
        return updatedUserGroup;
      } else {
        console.error("User group not found or not updated.");
      }
    } catch (error) {
      console.error("Error updating user group:", error);
    }
  }
  static async userFound(roleId) {
    try {
      const [result] = await db.query(
        "SELECT COUNT(*) as count FROM dgUser WHERE roleId = ?  AND active = 1",
        [roleId]
      );

      return result[0].count > 0; // Return true if count is greater than 0, indicating existence
    } catch (error) {
      console.error("Error in checking:", error);
      throw error;
    }
  }
  static async deleteUsergroup(roleId, adminUserId) {
    let oldvalue = await login.getUserByID(adminUserId);
    oldvalue = JSON.stringify(oldvalue);

    try {
      const result = await db.query(
        "UPDATE dgRole SET status = 0 WHERE roleId = ?",
        [roleId]
      );
      if (result[0].changedRows > 0) {
        await audit.auditTrailFunction(
          adminUserId,
          "USER MANAGEMENT",
          "DELETE",
          "USER GROUP DELETE",
          "dgRole",
          roleId,
          oldvalue,
          null,
          null
        );

        return true;
      } else {
        return false;
      }
    } catch (error) {
      log.error(error);
      console.error("Error deleting user group:", error);
    }
  }
  static async isUserExist(primaryEmail) {
    try {
      const [[res]] = await db.execute(
        "SELECT COUNT(*) AS count FROM dgUser WHERE primaryEmail=? AND active=1",
        [primaryEmail]
      );
      if (res.count > 0) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      log.error(err);
      console.log(err);
    }
  }
  static async isUserNameExist(username) {
    try {
      const [[res]] = await db.execute(
        "SELECT COUNT(*) AS count FROM dgUser WHERE username=?",
        [username]
      );
      if (res.count > 0) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      log.error(err);
      console.log(err);
    }
  }
  static async isEmployeIdExist(employeeId) {
    try {
      const [[res]] = await db.execute(
        "SELECT employeeID, COUNT(*) AS count FROM dgUser WHERE employeeID = ? GROUP BY employeeID",
        [employeeId]
      );
    
  
      if (res.count > 0) {
        return { exists: true, employeeID: res.employeeID };
      } else {
        return false;
      }
    } catch (err) {
      log.error(err);
      console.log(err);
    }
  }
  static async isPhoneExist(phone) {
    try {
      const [[res]] = await db.execute(
        "SELECT COUNT(*) AS count FROM dgUser WHERE phone=?",
        [phone]
      );
      if (res.count > 0) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      log.error(err);
      console.log(err);
    }
  }
  // static async insertUsers(
  //   username,
  //   firstname,
  //   middlename,
  //   lastname,
  //   primaryEmail,
  //   phone,
  //   extension,
  //   roleId,
  //   designation,
  //   // agentcode,
  //   employeeID,
  //   password,
  //   adminUserId,

  // ) {
  //   try {
  //     console.log('logedconsoleeedata');

  //     let newValue;
  //     let res = "FAILED";
  //     const [user] = await db.query(
  //       "INSERT INTO dgUser (username,firstname,middlename,lastname,primaryEmail,phone,extension,roleId,designation,employeeID,password) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
  //       [
  //         username,
  //         firstname,
  //         middlename,
  //         lastname,
  //         primaryEmail,
  //         phone,
  //         extension,
  //         roleId,
  //         designation,
  //         employeeID,
  //         password,
  //       ]
  //     );
  //     res = "Success";
  //     // console.log(user.affectedRows,'afterer');
  //     let newvalueview = await login.getUserByID(user.insertId);
  //     newValue = JSON.stringify(newvalueview);

  //     await audit.auditTrailFunction(
  //       adminUserId,
  //       "USER MANAGEMENT",
  //       "CREATE",
  //       "User(s) added",
  //       "dgUser",
  //       user.insertId,
  //       null,
  //       newValue,
  //       null
  //     );
  //     return res;
  //   } catch (error) {
  //     console.error("Error in insertUsers:", error);
  //   }
  // }
  static async insertUsers(
    firstname,
    middlename,
    lastname,
    primaryEmail,
    phone,
    roleId,
    designation,
    agentcode,
    employeeID,
    password,
    adminUserId,
    username
  ) {
    try {
      let newValue;
      let res = "FAILED";
      const [user] = await db.query(
        "INSERT INTO dgUser (username,firstname,middlename,lastname,primaryEmail,phone,roleId,designation,agentCode,employeeID,password) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [
          username,
          firstname,
          middlename,
          lastname,
          primaryEmail,
          phone,
          roleId,
          designation,
          null,
          employeeID,
          password,
        ]
      );
      res = "Success";
      // console.log(user.affectedRows,'afterer');
      let newvalueview = await login.getUserByID(user.insertId);
      newValue = JSON.stringify(newvalueview);
      console.log(newValue, 'user');


      await audit.auditTrailFunction(
        adminUserId,
        "USER MANAGEMENT",
        "CREATE",
        "User(s) added",
        "dgUser",
        user.insertId,
        null,
        newValue,
        null
      );
      return res;
    } catch (error) {
      console.error("Error in insertUsers:", error);
    }
  }

  static async addEmployees(
    firstname,
    middlename,
    lastname,
    primaryEmail,
    phone,
    designation,
    agentcode,
    employeeID,
    divisionId,
    adminUserId
  ) {
    try {
      // Step 1: Insert new employee into the database
      const [result] = await db.query(
        "INSERT INTO dgUser (firstname, middlename, lastname, primaryEmail, phone, designation,agentCode, employeeID, divisionId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          firstname,
          middlename,
          lastname,
          primaryEmail,
          phone,
          designation,
          agentcode,
          employeeID,
          divisionId,
        ]
      );

      // Step 2: Check if the insert was successful
      if (result.insertId) {
        // Step 3: Prepare the new value for audit trail
        const newData = {
          firstname,
          middlename,
          lastname,
          primaryEmail,
          phone,
          designation,
          agentcode,
          employeeID,
          divisionId,
        };
        // const newValue = JSON.stringify(newData);
        const newValue = await new Promise((resolve, reject) => {
          try {
            resolve(JSON.stringify(newData));
          } catch (error) {
            reject(error);
          }
        });

        // Step 4: Log the insertion to the audit trail
        await audit.auditTrailFunction(
          adminUserId,
          "EMPLOYEE MANAGER",
          "CREATE",
          "EMPLOYEE INSERTED",
          "dgUser",
          result.insertId,
          null,
          newValue,
          null
        );

        // Step 5: Return the result
        return result;
      } else {
        return "Failed";
      }
    } catch (error) {
      console.error("Error in InsertUpdateEmployees:", error);
      return "Failed";
    }
  }

  static async ImportEmployees(
    firstname,
    middlename,
    lastname,
    primaryEmail,
    phone,
    designation,
    employeeID,
    agentcode,
    divisionId,
    adminUserId
  ) {
    try {
      // Step 1: Insert new employee into the database
      const [result] = await db.query(
        "INSERT INTO dgUser (firstname, middlename, lastname, primaryEmail, phone, designation,employeeID,agentCode,divisionId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          firstname,
          middlename,
          lastname,
          primaryEmail,
          phone,
          designation,
          employeeID,
          agentcode,
          divisionId,
        ]
      );

      // Step 2: Check if the insert was successful
      if (result.insertId) {
        // Step 3: Prepare the new value for audit trail
        const newData = {
          firstname,
          middlename,
          lastname,
          primaryEmail,
          phone,
          designation,
          employeeID,
          agentcode,
          divisionId,
        };
        // const newValue = JSON.stringify(newData);
        const newValue = await new Promise((resolve, reject) => {
          try {
            resolve(JSON.stringify(newData));
          } catch (error) {
            reject(error);
          }
        });

        // Step 4: Log the insertion to the audit trail
        await audit.auditTrailFunction(
          adminUserId,
          "EMPLOYEE MANAGEMENT",
          "CREATE",
          "EMPLOYEE INSERTED",
          "dgUser",
          result.insertId,
          null,
          newValue,
          null
        );

        // Step 5: Return the result
        return result;
      } else {
        return "Failed";
      }
    } catch (error) {
      console.error("Error in InsertUpdateEmployees:", error);
      return "Failed";
    }
  }

  static async UpdateEmployees(
    userId,
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
    divisionId,
    adminUserId
  ) {
    try {
      // Step 1: Get old data for audit trail using the getEmployeeDetails function
      const oldData = await login.getEmployeeDetails(userId);
      if (!oldData) {
        return "Failed"; // If the user doesn't exist, return "Failed"
      }

      const oldValue = await new Promise((resolve, reject) => {
        try {
          resolve(JSON.stringify(oldData));
        } catch (error) {
          reject(error);
        }
      });

      // Step 2: Perform the update
      const [user] = await db.query(
        "UPDATE dgUser SET  firstname = ?, middlename = ?, lastname = ?, primaryEmail = ?, phone = ?, extension = ?, roleId = ?, designation = ?, agentCode = ? , employeeID = ?, divisionId = ? WHERE primaryEmail = ?",
        [
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
          divisionId,
          primaryEmail,
        ]
      );

      if (user.affectedRows == 1) {
        // Step 3: Get new data for audit trail after the update
        const newData = await login.getEmployeeDetails(userId);
        const newValue = await new Promise((resolve, reject) => {
          try {
            resolve(JSON.stringify(newData));
          } catch (error) {
            reject(error);
          }
        });

        // Step 4: Log the changes to the audit trail
        await audit.auditTrailFunction(
          adminUserId,
          "EMPLOYEE MANAGEMENT",
          "UPDATE",
          "EMPLOYEE UPDATED",
          "dgUser",
          userId,
          oldValue,
          newValue,
          null
        );

        return "Success";
      } else {
        return "Failed";
      }
    } catch (err) {
      console.log("Error in UpdateEmployees:", err);
      throw err;
    }
  }

  static async checkEmployeeIDExists(employeeID, userId) {
    try {
      // Query to check if the employeeID exists for a different user
      const [rows] = await db.query(
        "SELECT 1 FROM dgUser WHERE employeeID = ? AND userId != ?",
        [employeeID, userId]
      );
      // If a row is found, that means the employee ID already exists for a different user
      return rows.length > 0;
    } catch (error) {
      console.log("Error checking Employee ID:", error);
      throw error;
    }
  }

  static async getUsers(roleID, limit, offset) {
    try {
      const [users] = await db.query(
        "SELECT userId,retryCount, userHierarchyId, roleId, packageFeatureTabPermissionIds, languageId, divisionId, isLDAPUser, username, firstname, lastname, primaryEmail, secondaryEmail, primaryMobileNo, secondaryMobileNo, phone, extension, designation, employeeID, middlename, dgUserAccess, accessPermission, accessPermissionQueryFilter, agentCode, isLoggedIn  from dgUser WHERE active = ? AND roleId = ? LIMIT ? OFFSET ?;",
        [1, roleID, limit, offset]
      );
      return users;
    } catch (error) {
      console.error("Error fetching user groups:", error);
    }
  }
  static async getUsersTotal(limit, offset) {
    try {
      const [users] = await db.query(
        "SELECT dgUser.userId, dgUser.retryCount, dgUser.userHierarchyId, dgUser.roleId, dgUser.packageFeatureTabPermissionIds, dgUser.languageId, dgUser.divisionId, dgUser.isLDAPUser, dgUser.username, dgUser.firstname, dgUser.lastname, dgUser.primaryEmail, dgUser.secondaryEmail, dgUser.primaryMobileNo, dgUser.secondaryMobileNo, dgUser.phone, dgUser.extension, dgUser.designation, dgUser.employeeID, dgUser.middlename, dgUser.dgUserAccess, dgUser.accessPermission, dgUser.accessPermissionQueryFilter, dgUser.agentCode, dgUser.isLoggedIn, dgRole.roleName FROM dgUser JOIN dgRole ON dgUser.roleId = dgRole.roleId WHERE dgUser.active = ? LIMIT ? OFFSET ?;",
        [1, limit, offset]
      );
      return users;
    } catch (error) {
      console.error("Error fetching user groups:", error);
    }
  }
  static async getUsersCount(roleID) {
    try {
      const [users] = await db.query(
        "SELECT COUNT(*) as totalRecords FROM dgUser WHERE active = ? AND roleId = ?;",
        [1, roleID]
      );
      return users;
    } catch (error) {
      console.error("Error fetching user groups:", error);
    }
  }
  static async getUsersCountWithouRoleId() {
    try {
      const [users] = await db.query(
        "SELECT COUNT(*) as totalRecords FROM dgUser WHERE active = ? ;",
        [1]
      );
      return users;
    } catch (error) {
      console.error("Error fetching user groups:", error);
      log.error(error);
    }
  }
  static async getSearchResult(searchData) {
    try {
      const query = `%${searchData}%`;
      const newQuery = `SELECT 
    u.userId, u.retryCount, u.userHierarchyId, u.roleId, 
    u.packageFeatureTabPermissionIds, u.languageId, u.divisionId, u.isLDAPUser, 
    u.username, u.firstname, u.lastname, u.primaryEmail, u.secondaryEmail, 
    u.primaryMobileNo, u.secondaryMobileNo, u.phone, u.designation, 
    u.employeeID, u.middlename, u.dgUserAccess, u.accessPermission, 
    u.accessPermissionQueryFilter, u.agentCode, u.isLoggedIn, r.roleName, 
    COALESCE(GROUP_CONCAT(DISTINCT e.extensionNumber ORDER BY e.extensionNumber ASC SEPARATOR ', '), 'No data') AS extension
FROM dgUser u
LEFT JOIN dgRole r ON u.roleId = r.roleId
LEFT JOIN dgExtension e ON u.employeeID = e.employeeId AND e.active = 1
WHERE 
    (CONCAT(u.firstname, ' ', u.middlename, ' ', u.lastname) LIKE ? OR 
     CONCAT(u.firstname, ' ', u.lastname) LIKE ? OR
     u.username LIKE ? OR 
     u.employeeID LIKE ? OR 
     COALESCE(e.extensionNumber, '') LIKE ? OR
     u.phone LIKE ? OR 
     u.primaryEmail LIKE ? OR 
     r.roleName LIKE ?) 
    AND u.active = 1 
    AND (r.active = 1 OR r.active IS NULL)
    AND u.userHierarchyId = 1
GROUP BY u.userId, u.retryCount, u.userHierarchyId, u.roleId, 
    u.packageFeatureTabPermissionIds, u.languageId, u.divisionId, u.isLDAPUser, 
    u.username, u.firstname, u.lastname, u.primaryEmail, u.secondaryEmail, 
    u.primaryMobileNo, u.secondaryMobileNo, u.phone, u.designation, 
    u.employeeID, u.middlename, u.dgUserAccess, u.accessPermission, 
    u.accessPermissionQueryFilter, u.agentCode, u.isLoggedIn, r.roleName;`;

      // Corrected query execution
      const [users] = await db.query(newQuery, [query, query, query, query, query, query, query, query]);
      return users;
    } catch (error) {
      console.error('Error fetching search results:', error);
      throw error;
    }
  }

  static async getEmployeesByUserID(id) {
    try {
      const [users] = await db.query(
        "SELECT * FROM dgUser WHERE  active = 1 AND  employeeID=?",
        [id],
        [1]
      );
      return users;
    } catch (error) {
      console.error("Error fetching user groups:", error);
    }
  }
  static async getAllEmployee() {
    try {
      const [result] = await db.execute(
        "SELECT userId,username,firstname,lastname,employeeID FROM dgUser WHERE active = 1 ;"
      );
      return result;
    } catch (err) {
      console.log("err:", err);
    }
  }
  static async getAllEmployeeByLocation() {
    try {
      const [result] = await db.execute(
        "SELECT username,userId,firstname,lastname,employeeID FROM dgUser US \
     INNER JOIN dgDivision DV ON US.divisionId = DV.divisionId INNER JOIN dgDepartment DP ON DV.departmentId = DP.departmentId \
     INNER JOIN dgLocation LC ON DP.locationId = LC.locationId;"
      );
      return result;
    } catch (err) {
      console.log("err:", err);
      log.error(err);
    }
  }
  static async getAllEmployeeByLocationID(locationId) {
    try {
      const [result] = await db.execute(
        "SELECT username,userId,firstname,lastname,employeeID FROM dgUser US \
     INNER JOIN dgDivision DV ON US.divisionId = DV.divisionId INNER JOIN dgDepartment DP ON DV.departmentId = DP.departmentId \
     INNER JOIN dgLocation LC ON DP.locationId = LC.locationId WHERE LC.locationId=? AND US.active = 1;",
        [locationId]
      );
      return result;
    } catch (err) {
      console.log("err:", err);
      log.error(err);
    }
  }
  static async getEmployees(
    inLocationId,
    inDepartmentId,
    inDivisionId,
    inPageNumber,
    inRecordsPerPage,
    inUserId,
    inSortColumn,
    inSortOrder,
    adminUserId
  ) {
    try {
      // Convert arrays to comma-separated strings, but if empty or null, pass null
      const locationIds =
        Array.isArray(inLocationId) && inLocationId.length > 0
          ? inLocationId.join(",")
          : null;
      const departmentIds =
        Array.isArray(inDepartmentId) && inDepartmentId.length > 0
          ? inDepartmentId.join(",")
          : null;
      const divisionIds =
        Array.isArray(inDivisionId) && inDivisionId.length > 0
          ? inDivisionId.join(",")
          : null;

      // Pass CSV values or null to the stored procedure
      const [result] = await db.query(
        "CALL spGetUserRecord(?, ?, ?, ?, ?, ?, ?, ?)",
        [
          locationIds,
          departmentIds,
          divisionIds,
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
        "EMPLOYEE MANAGEMENT",
        "READ",
        "Employee management accessed",
        "dgUser",
        "0",
        null,
        newValue,
        null
      );
      return result;
    } catch (error) {
      console.error("Error fetching employee data:", error);
      throw error;
    }
  }
  static async updateUsers(
    firstname,
    middlename,
    lastname,
    primaryEmail,
    phone,
    extension,
    roleId,
    designation,
    employeeID,
    confirmPassword,
    userId,
    adminUserId,
    username
  ) {
    // console.log(firstname, middlename, lastname, primaryEmail, phone, extension, roleId, roleName, designation, userId, 'dataaaa');
    try {
      let oldvalue;
      let newValue;
      oldvalue = await login.getUserByID(adminUserId);
      const [result] = await db.query(
        "UPDATE dgUser SET firstname = ?, lastname = ?,middlename=?, primaryEmail = ?, phone = ?, extension = ?, roleId = ?, designation = ?,employeeID=?,password=?,username=? WHERE userId = ?",
        [
          firstname,
          lastname,
          middlename,
          primaryEmail,
          phone,
          extension,
          roleId,
          designation,
          employeeID,
          confirmPassword,
          username,
          userId,
        ]
      );
      let newvalueview = await login.getUserByID(adminUserId);
      newValue = JSON.stringify(newvalueview);

      // await audit.auditTrailFunction(adminUserId, 'USER MANAGEMENT', 'UPDATE', 'USERS UPDATE', 'dgUser', roleId, oldvalue, newValue, null);
      return result;
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }
  static async updateUsersWithoutpassword(
    firstname,
    middlename,
    lastname,
    primaryEmail,
    phone,
    extension,
    roleId,
    designation,
    employeeID,
    userId,
    adminUserId,
    username
  ) {
    // console.log(firstname, middlename, lastname, primaryEmail, phone, extension, roleId, roleName, designation, userId, 'dataaaa');
    try {
      let oldvalue;
      let newValue;
      oldvalue = await login.getUserByID(adminUserId);
      oldvalue = JSON.stringify(oldvalue);
      const [result] = await db.query(
        "UPDATE dgUser SET firstname = ?, lastname = ?,middlename=?, primaryEmail = ?, phone = ?, extension = ?, roleId = ?, designation = ?,employeeID=?,username=? WHERE userId = ?",
        [
          firstname,
          lastname,
          middlename,
          primaryEmail,
          phone,
          extension,
          roleId,
          designation,
          employeeID,
          username,
          userId,
        ]
      );
      let newvalueview = await login.getUserByID(adminUserId);
      newValue = JSON.stringify(newvalueview);
      // console.log(adminUserId, roleId, oldvalue, newValue, 'datatatat');
      await audit.auditTrailFunction(
        adminUserId,
        "USER MANAGEMENT",
        "UPDATE",
        "USER UPDATED",
        "dgUser",
        roleId,
        oldvalue,
        newValue,
        null
      );

      // awai
      // console.log(oldvalue, newValue, adminUserId);

      return result;
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }
  static async deleteUsers(userIdDetails, adminUserId) {
    // Fetch the old values for audit purposes
    let oldValue = await login.getUserByID(adminUserId);
    oldValue = JSON.stringify(oldValue);

    let successfulUpdates = 0; // Track successful updates

    try {
      for (const userId of userIdDetails) {
        try {
          // Update user to inactive
          const result = await db.query(
            "UPDATE dgUser SET active = 0 WHERE userId = ? AND isLDAPUser = 0 AND userId != ?",
            [userId, adminUserId]
          );

          if (result[0].changedRows > 0) {
            console.log(`Successfully deactivated userId ${userId}`);
            successfulUpdates++;
          } else {
            console.warn(`No rows affected for userId ${userId}`);
          }

          // Add individual audit log
          await audit.auditTrailFunction(
            adminUserId,
            "USER MANAGEMENT",
            "DELETE",
            "USER DEACTIVATED",
            "dgUser",
            userId,
            oldValue,
            null,
            null
          );
        } catch (error) {
          console.error(`Error deactivating userId ${userId}:`, error.message);
          // Optionally log or notify about the specific failure
        }
      }

      // Return true if at least one user was successfully updated
      return successfulUpdates > 0;
    } catch (error) {
      console.error("Error during bulk deactivation of users:", error);
      throw error; // Rethrow error for proper handling in the controller
    }
  }

  static async UnassignedHeirarchy() {
    try {
      const [[result]] = await db.execute(
        "SELECT * FROM dgLocation L INNER JOIN dgDepartment DP ON L.locationId = DP.locationId \
        INNER JOIN dgDivision DV ON DP.departmentId = DV.departmentId WHERE L.locationName='Unassigned';"
      );
      return result;
    } catch (err) {
      log.error(err);
    }
  }
  static async getUserId(divisionId) {
    try {
      const [extensions] = await db.execute("Select userId from dgUser where  divisionId =?;", [divisionId]);
      return extensions;
    } catch (err) {
      console.log(err);
      log.error(err);
      throw err;
    }
  }
  // Static method to deactivate the employee and update the audit trail
  static async deleteEmployeeManager(userId, adminUserId) {
    try {
      // Step 1: Fetch old data for audit trail purposes before deactivating
      const oldData = await login.getEmployeeDetails(userId);
      if (!oldData) {
        return false;
      }

      // Step 2: Make JSON.stringify asynchronous by wrapping it in a Promise
      const oldValue = await new Promise((resolve, reject) => {
        try {
          resolve(JSON.stringify(oldData));
        } catch (error) {
          reject(error);
        }
      });

      // Step 3: Perform the deactivation (set active to 0)
      const [result] = await db.query(
        "UPDATE dgUser SET active = 0 WHERE userId = ?",
        [userId]
      );

      if (result.changedRows > 0) {
        const newData = await login.getEmployeeDetails(userId);
        const newValue = await new Promise((resolve, reject) => {
          try {
            resolve(JSON.stringify(newData));
          } catch (error) {
            reject(error);
          }
        });
        // Step 4: Log the changes to the audit trail
        await audit.auditTrailFunction(
          adminUserId,
          "EMPLOYEE MANAGEMENT",
          "DELETE",
          "EMPLOYEE DELETED",
          "dgUser",
          userId,
          oldValue,
          newValue,
          null
        );
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
  static async getEmployeeDetails(userId) {
    try {
      const [[data]] = await db.query("SELECT * FROM dgUser WHERE userId = ?", [
        userId,
      ]);
      return data;
    } catch (error) {
      console.error("Error fetching employee details:", error);
      log.error(error);
      throw error;
    }
  }
  static async getLocationByName(locationName) {
    try {
      const [result] = await db.query(
        "SELECT COUNT(*) as count FROM dgLocation WHERE locationName = ? AND active = 1",
        [locationName]
      );

      // Return the count directly
      return result[0].count;
    } catch (error) {
      console.error("Error fetching location by name:", error);
      throw error; // Propagate error for the controller to handle
    }
  }

  static async getDepartmentByName(departmentName) {
    try {
      const [result] = await db.query(
        "SELECT COUNT(*) as count FROM dgDepartment WHERE departmentName = ? AND active = 1",
        [departmentName]
      );

      return result[0]?.count || 0; // Return the count, default to 0 if no result
    } catch (error) {
      console.error("Error fetching department by name:", error);
      throw error; // Propagate the error to the caller
    }
  }

  static async getDivisionByName(divisionName) {
    try {
      const [result] = await db.query(
        "SELECT COUNT(*) as count FROM dgDivision WHERE divisionName = ? AND active = 1",

        [divisionName]
      );
      return result[0]?.count || 0;
    } catch (error) {
      console.error("Error fetching location by name:", error);
      throw error;
    }
  }
  static async getDepartmentByLdapName(departmentName) {
    try {
      const [result] = await db.query(
        `SELECT * 
         FROM dgDepartment 
         WHERE departmentName = ? AND LDAPPropertyValue = TRUE`,
        [departmentName]
      );
      return result;
    } catch (error) {
      console.error(
        "Error fetching department by name and checking LDAPPropertyValue:",
        error
      );
      throw error;
    }
  }

  static async getDivisionByName(divisionName) {
    try {
      const [result] = await db.query(
        "SELECT * FROM dgDivision WHERE divisionName = ?",
        [divisionName]
      );
      return result;
    } catch (error) {
      console.error("Error fetching location by name:", error);
      throw error;
    }
  }
  static async getDivisionByName(divisionName) {
    try {
      const [result] = await db.query(
        "SELECT * FROM dgDivision WHERE divisionName = ?",
        [divisionName]
      );
      return result;
    } catch (error) {
      console.error("Error fetching location by name:", error);
      throw error; // Propagate the error to be caught in the controller
    }
  }
  static async getdepartment() {
    try {
      return await db.query("SELECT * FROM dgDepartment where active=1");
    } catch (err) {
      console.log("err" + err);
    }
  }
  static async MappExtension(userId, Division, adminUserId) {
    try {
      let result = "";
      let newValue = {};
      let oldValue = null; // Assuming there is no old value for a new mapping

      [result] = await db.query(
        "UPDATE dgUser SET divisionId = ? WHERE userId = ?",
        [Division, userId]
      );

      if (result.affectedRows === 1) {
        const newData = {
          userId: userId,
          division: Division,
        };

        newValue = JSON.stringify(newData);

        await audit.auditTrailFunction(
          adminUserId,
          "EMPLOYEE HIERARCHY MAPPING", "UPDATE", "EMPLOYEE HIERARCHY UPDATED", "hierarchy_mapping", userId, oldValue, newValue, null
        );

        return "Success";
      } else {
        return "Failed";
      }
    } catch (err) {
      console.error("Error in MappExtension:", err);
      return "Failed";
    }
  }



  // static async getLocationDepartmentDivision(adminUserId) {
  //   try {
  //     const [result] = await db.query(
  //       // "SELECT * FROM dgLocation WHERE active = 1 AND LDAPPropertyValue IS NULL"
  //       "SELECT * FROM dgLocation WHERE active = 1"
  //     );
  //     const [result1] = await db.query(
  //       "SELECT * FROM dgDepartment WHERE active = 1"
  //     );
  //     const [result2] = await db.query(
  //       "SELECT * FROM dgDivision WHERE active = 1"
  //     );
  //     let newValue = {};
  //     newValue = JSON.stringify(result);
  //     await audit.auditTrailFunction(adminUserId, 'HIERARCHY', 'READ', 'VIEWED Location', 'dgLocation', '0', null, newValue, null);
  //     return { Location: result, Department: result1, Division: result2 };
  //   } catch (error) {
  //     console.error("Error fetching location by name:", error);
  //     throw error;
  //   }
  // }

  static async hierarchyNames(adminUserId) {
    try {
      // Fetch data for Locations
      const [locations] = await db.query(
        "SELECT locationId, locationName FROM dgLocation WHERE active = 1"
      );

      // Fetch data for Departments
      const [departments] = await db.query(
        "SELECT departmentId, departmentName, locationId FROM dgDepartment WHERE active = 1"
      );

      // Fetch data for Divisions
      const [divisions] = await db.query(
        "SELECT divisionId, divisionName, departmentId FROM dgDivision WHERE active = 1"
      );

      // Add "Unassigned" entries to each dataset
      locations.unshift({ locationId: null, locationName: "Unassigned" });
      departments.unshift({
        departmentId: null,
        departmentName: "Unassigned",
        locationId: null,
      });
      divisions.unshift({
        divisionId: null,
        divisionName: "Unassigned",
        departmentId: null,
      });

      // Prepare JSON for auditing
      const newValue = JSON.stringify({ locations, departments, divisions });

      // Log audit trail
      await audit.auditTrailFunction(
        adminUserId,
        "EMPLOYEE MANAGEMENT",
        "READ",
        "ADD EMPLOYEE MANAGEMENT accessed",
        "dgHierarchy",
        "0",
        null,
        newValue,
        null
      );

      return {
        Location: locations,
        Department: departments,
        Division: divisions,
      };
    } catch (error) {
      console.error(
        "Error fetching location, department, division data:",
        error
      );
      throw error;
    }
  }

  static async getLocationDepartmentDivision(adminUserId) {
    try {
      const [result] = await db.query(
        "SELECT * FROM dgLocation WHERE active = 1"
      );
      const [result1] = await db.query(
        "SELECT * FROM dgDepartment WHERE active = 1"
      );
      const [result2] = await db.query(
        "SELECT * FROM dgDivision WHERE active = 1"
      );

      // Add "Unassigned" entries to each array
      // result.unshift({ locationId: null, locationName: 'Unassigned' });
      // result1.unshift({ departmentId: null, departmentName: 'Unassigned' });
      // result2.unshift({ divisionId: 0, divisionName: 'Unassigned' });

      let newValue = {};
      newValue = JSON.stringify(result);
      await audit.auditTrailFunction(
        adminUserId,
        "HIERARCHY",
        "READ",
        "Hierarchy location accessed",
        "dgLocation",
        "0",
        null,
        newValue,
        null
      );

      return { Location: result, Department: result1, Division: result2 };
    } catch (error) {
      console.error("Error fetching location by name:", error);
      throw error;
    }
  }

  static async getDepartmentByLocation(locationId, adminUserId) {
    try {
      const [departmentList] = await db.execute(
        "SELECT * FROM dgDepartment WHERE locationId=? AND active=1",
        [locationId]
      );
      let newValue = {};
      newValue = JSON.stringify(departmentList);
      //  await audit.auditTrailFunction(adminUserId, 'HIERARCHY', 'READ', 'Hierarchy department accessed', 'dgDepartment', '0', null, newValue, null);
      return departmentList;
    } catch (err) {
      console.error("Error fetching department by name and location:", err);
      throw err;
    }
  }
  static async getDivisionByDept(departmentId, adminUserId) {
    try {
      console.log("departmentId:", departmentId);
      const [divionList] = await db.execute(
        "SELECT * FROM dgDivision WHERE departmentId=? AND active=1",
        [departmentId]
      );
      let newValue = [];
      newValue = JSON.stringify(divionList);
      // await audit.auditTrailFunction(adminUserId, 'HIERARCHY', 'READ', 'Hierarchy division accessed', 'dgDivision', '0', null, newValue, null);
      return divionList;
    } catch (err) {
      console.error("Error fetching department by name and location:", err);
      throw err;
    }
  }
  static async getDivisionBylocation(locationID, adminUserId) {
    try {
      const [divisionList] = await db.execute(
        `
        SELECT 
          d.departmentId, 
          dv.divisionId ,
           dv.divisionName 
        FROM 
          dgDepartment d
        JOIN 
          dgDivision dv ON d.departmentId = dv.departmentId
        WHERE 
          d.locationId = ? 
          AND d.active = 1 
          AND dv.active = 1
        `,
        [locationID]
      );
      let newValue = [];
      newValue = JSON.stringify(divisionList);
      await audit.auditTrailFunction(
        adminUserId,
        "HIERARCHY",
        "READ",
        "Hierarchy division accessed",
        "dgDivision",
        "0",
        null,
        newValue,
        null
      );
      return divisionList;
    } catch (err) {
      console.error("Error fetching department by name and location:", err);
      throw err;
    }
  }

  static async getDepartmentBydivision(departmentId) {
    try {
      const [result] = await db.query(
        "SELECT COUNT(*) as count FROM dgDivision WHERE departmentId = ? and active=1 ",
        [departmentId]
      );
      return result[0]; // return the count
    } catch (error) {
      console.error("Error fetching department by name and division:", error);
      throw error;
    }
  }

  static async getExtension() {
    try {
      const [result] = await db.query("SELECT * FROM dgExtension");
      return result;
    } catch (error) {
      console.error("Error fetching extensions:", error);
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
  static async getAgents() {
    try {
      const [result] = await db.query(
        "SELECT  * FROM dgRecordingCallLog WHERE isDeleted=0 GROUP BY agentCode  "
      );
      return result;
    } catch (error) {
      console.error("Error fetching extensions:", error);
      throw error;
    }
  }
  static async getColorcode() {
    try {
      const [result] = await db.query(
        "SELECT * FROM dgColorCode GROUP BY colorCodeId"
      );
      return result;
    } catch (error) {
      console.error("Error fetching extensions:", error);
      throw error;
    }
  }
  static async getPhoneNumber() {
    try {
      const [result] = await db.query(
        "SELECT callerId,dialledNumber FROM dgRecordingCallLog"
      );
      return result;
    } catch (error) {
      console.error("Error fetching extensions:", error);
      throw error;
    }
  }

  static async getDivision(divisionId) {
    try {
      const [result] = await db.query(
        "SELECT * FROM dgUser WHERE divisionId = ? AND active = 1 AND isLDAPUser = 1",
        [divisionId]
      );
      return result;
    } catch (error) {
      console.error("Error fetching division:", error);
      throw error;
    }
  }

  static async deleteDepartment(departmentId, adminUserId) {
    try {
      // Step 1: Fetch the old data for audit trail purposes
      const oldDataResult = await login.getDepartmentById(departmentId); // Assuming you have this method to fetch department details by ID.

      // Check if the department exists, if not throw an error
      if (!oldDataResult) {
        throw new Error(`Department with ID ${departmentId} not found.`);
      }

      // Step 2: Make JSON.stringify asynchronous by wrapping it in a Promise for the old value
      const oldValue = await new Promise((resolve, reject) => {
        try {
          resolve(JSON.stringify(oldDataResult));
        } catch (error) {
          reject(error);
        }
      });

      // Step 3: Perform the logical deletion (set active to 0)
      const [result] = await db.query(
        "UPDATE dgDepartment SET active = 0 WHERE departmentId = ? AND active = 1",
        [departmentId]
      );

      // Check if the record was actually updated
      if (result.affectedRows === 1) {
        // Step 4: Prepare the new value for the audit trail
        const newValue = await new Promise((resolve, reject) => {
          try {
            resolve(JSON.stringify({ ...oldDataResult, active: 0 }));
          } catch (error) {
            reject(error);
          }
        });

        // Step 5: Log the changes to the audit trail
        await audit.auditTrailFunction(
          adminUserId,
          "HIERARCHY",
          "DELETE",
          "DEPARTMENT DELETED",
          "dgDepartment",
          departmentId,
          oldValue,
          newValue,
          null
        );
      }

      return result;
    } catch (error) {
      console.error("Error deleting department:", error);
      throw error; // Propagate the error to be caught in the controller
    }
  }

  static async deleteDivision(divisionId, adminUserId) {
    try {
      // Step 1: Fetch the old data for audit trail purposes
      const oldDataResult = await login.getDivisionById(divisionId); // Assuming you have this method to fetch division details by ID.

      // Check if the division exists, if not throw an error
      if (!oldDataResult) {
        throw new Error(`Division with ID ${divisionId} not found.`);
      }

      // Step 2: Make JSON.stringify asynchronous by wrapping it in a Promise for the old value
      const oldValue = await new Promise((resolve, reject) => {
        try {
          resolve(JSON.stringify(oldDataResult));
        } catch (error) {
          reject(error);
        }
      });

      // Step 3: Perform the logical deletion (set active to 0)
      const [result] = await db.query(
        "UPDATE dgDivision SET active = 0 WHERE divisionId = ? AND active = 1",
        [divisionId]
      );

      // Check if the record was actually updated
      if (result.affectedRows === 1) {
        // Step 4: Prepare the new value for the audit trail
        const newValue = await new Promise((resolve, reject) => {
          try {
            resolve(JSON.stringify({ ...oldDataResult, active: 0 }));
          } catch (error) {
            reject(error);
          }
        });

        // Step 5: Log the changes to the audit trail
        await audit.auditTrailFunction(
          adminUserId,
          "HIERARCHY",
          "DELETE",
          "DIVISION DELETED",
          "dgDivision",
          divisionId,
          oldValue,
          newValue,
          null
        );
      }

      return result;
    } catch (error) {
      console.error("Error deleting division:", error);
      throw error; // Propagate the error to be caught in the controller
    }
  }

  static async checkLocationInDepartment(locationId) {
    try {
      const [result] = await db.query(
        "SELECT COUNT(*) as count FROM dgDepartment WHERE locationId = ? and active=1",
        `SELECT COUNT(*) as count 
         FROM dgDepartment d
         JOIN dgLocation l ON d.locationId = l.locationId
         WHERE d.locationId = ? AND d.active = 1 AND l.locationName != 'Unassigned'`,
        [locationId]
      );
      return result[0].count > 0; // Return true if count is greater than 0, indicating existence
    } catch (error) {
      console.error("Error checking location in department:", error);
      throw error;
    }
  }

  static async deleteLocation(locationId, adminUserId) {
    try {
      // Step 1: Fetch the old data for audit trail purposes
      const oldDataResult = await login.getLocationById(locationId);

      // Check if the location exists, if not throw an error
      if (!oldDataResult) {
        throw new Error(`Location with ID ${locationId} not found.`);
      }

      // Step 2: Make JSON.stringify asynchronous by wrapping it in a Promise for the old value
      const oldValue = await new Promise((resolve, reject) => {
        try {
          resolve(JSON.stringify(oldDataResult));
        } catch (error) {
          reject(error);
        }
      });

      // Step 3: Perform the logical deletion (set active to 0)
      const [result] = await db.query(
        "UPDATE dgLocation SET active = 0 WHERE locationId = ?",
        [locationId]
      );

      // Check if the record was actually updated
      if (result.affectedRows === 1) {
        // Step 4: Prepare the new value for the audit trail
        const newValue = await new Promise((resolve, reject) => {
          try {
            resolve(JSON.stringify({ ...oldDataResult, active: 0 }));
          } catch (error) {
            reject(error);
          }
        });

        // Step 5: Log the changes to the audit trail
        await audit.auditTrailFunction(
          adminUserId,
          "HIERARCHY",
          "DELETE",
          "LOCATION DELETED",
          "dgLocation",
          locationId,
          oldValue,
          newValue,
          null
        );
      }

      return result;
    } catch (error) {
      console.error("Error deleting location:", error);
      throw error; // Propagate the error to be caught in the controller
    }
  }

  static async updateLocation(locationId, locationName, adminUserId) {
    try {
      // Step 1: Fetch old location data for audit purposes
      const oldLocationData = await this.getLocationById(locationId);
      if (!oldLocationData) {
        throw new Error("Location not found for updating");
      }
      const oldValue = JSON.stringify(oldLocationData); // Prepare old value for audit trail

      // Step 2: Update the location name in the database
      const [result] = await db.query(
        "UPDATE dgLocation SET locationName = ? WHERE locationId = ?",
        [locationName, locationId]
      );

      // Step 3: If update was successful, fetch new location data
      if (result.affectedRows === 1) {
        const newLocationData = await this.getLocationById(locationId); // Fetch updated data
        const newValue = JSON.stringify(newLocationData); // Prepare new value for audit trail

        // Step 4: Log the changes to the audit trail
        await audit.auditTrailFunction(
          adminUserId,
          "HIERARCHY",
          "UPDATE",
          "LOCATION UPDATED",
          "dgLocation",
          locationId,
          oldValue,
          newValue,
          null
        );
      }

      return result; // Return the result for further handling in the controller
    } catch (error) {
      console.error("Error updating location:", error);
      throw error; // Propagate the error to the caller
    }
  }

  static async getLocationById(locationId) {
    try {
      const [[data]] = await db.query(
        "SELECT * FROM dgLocation WHERE locationId = ?",
        [locationId]
      );
      return data; // Returns location details if found
    } catch (error) {
      console.error("Error fetching location details:", error);
      throw error; // Propagate the error to the caller
    }
  }

  static async updateDepartment(departmentId, departmentName, adminUserId) {
    try {
      const oldDepartmentData = await this.getDepartmentById(departmentId);
      if (!oldDepartmentData) {
        throw new Error("Department not found for updating");
      }
      const oldValue = JSON.stringify(oldDepartmentData);

      const [result] = await db.query(
        "UPDATE dgDepartment SET departmentName = ? WHERE departmentId = ?",
        [departmentName, departmentId]
      );

      if (result.affectedRows === 1) {
        const oldDepartmentData = await this.getDepartmentById(departmentId);
        const newValue = JSON.stringify(oldDepartmentData);

        await audit.auditTrailFunction(
          adminUserId,
          "HIERARCHY",
          "UPDATE",
          "DEPARTMENT UPDATED",
          "dgDepartment",
          departmentId,
          oldValue,
          newValue,
          null
        );
      }

      return result;
    } catch (error) {
      console.error("Error updating Department:", error);
      throw error;
    }
  }

  static async getDepartmentById(departmentId) {
    try {
      const [[data]] = await db.query(
        "SELECT * FROM dgDepartment WHERE departmentId = ?",
        [departmentId]
      );
      return data;
    } catch (error) {
      console.error("Error fetching location details:", error);
      throw error;
    }
  }

  static async updateDivision(divisionId, divisionName, adminUserId) {
    try {
      const oldDivisionnData = await this.getDivisionById(divisionId);
      if (!oldDivisionnData) {
        throw new Error("Location not found for updating");
      }
      const oldValue = JSON.stringify(oldDivisionnData);

      const [result] = await db.query(
        "UPDATE dgDivision SET divisionName = ? WHERE divisionId = ?",
        [divisionName, divisionId]
      );
      if (result.affectedRows === 1) {
        const newDivisionData = await this.getDivisionById(divisionId); // Fetch updated data
        const newValue = JSON.stringify(newDivisionData); // Prepare new value for audit trail

        // Step 4: Log the changes to the audit trail
        await audit.auditTrailFunction(
          adminUserId,
          "HIERARCHY",
          "UPDATE",
          "DIVISION UPDATED",
          "dgDivision",
          divisionId,
          oldValue,
          newValue,
          null
        );
      }
      return result;
    } catch (error) {
      console.error("Error updating location:", error);
      throw error;
    }
  }

  static async getDivisionById(divisionId) {
    try {
      const [[data]] = await db.query(
        "SELECT * FROM dgDivision WHERE divisionId = ?",
        [divisionId]
      );
      return data; // Returns location details if found
    } catch (error) {
      console.error("Error fetching location details:", error);
      throw error; // Propagate the error to the caller
    }
  }


  static async addLocation(locationName, adminUserId) {
    try {
      // Step 1: Insert locationName into dgLocation
      const [locationResult] = await db.query(
        "INSERT INTO dgLocation (locationName) VALUES (?)",
        [locationName.trim()]
      );

      // Check if the location insertion was successful
      if (locationResult.affectedRows === 1) {
        const locationId = locationResult.insertId; // Get the inserted locationId

        // Step 2: Insert "Unassigned" into dgDepartment for the new locationId
        const [departmentResult] = await db.query(
          "INSERT INTO dgDepartment (departmentName, locationId) VALUES ('Unassigned', ?)",
          [locationId]
        );

        const departmentId = departmentResult.insertId;

        const [divisionResult] = await db.query(
          "INSERT INTO dgDivision (divisionName, departmentId) VALUES ('Unassigned', ?)",
          [departmentId]
        );

        // Check if the division insertion was successful
        if (divisionResult.affectedRows === 1) {
          // Prepare the new value for the audit trail
          const newValue = JSON.stringify({ locationName: locationName.trim() });

          // Step 4: Log the changes to the audit trail
          await audit.auditTrailFunction(
            adminUserId,
            'HIERARCHY',
            'CREATE',
            'LOCATION ADDED',
            'dgLocation',
            locationId,
            null,
            newValue,
            null
          );

          // Return all IDs for reference
          return { affectedRows: 1, locationId, departmentId };
        }
      }
    } catch (error) {
      console.error("Error adding location:", error);
      throw error; // Propagate the error to the calling function
    }
  }

  static async addDepartment(departmentName, locationId, adminUserId) {
    try {
      // Step 1: Insert department into dgDepartment
      const [departmentResult] = await db.query(
        "INSERT INTO dgDepartment (departmentName, locationId) VALUES (?, ?)",
        [departmentName.trim(), locationId]
      );

      // Check if the department insertion was successful
      if (departmentResult.affectedRows === 1) {
        const departmentId = departmentResult.insertId;

        // Step 2: Insert "Unassigned" into dgDivision for the new departmentId
        const [divisionResult] = await db.query(
          "INSERT INTO dgDivision (divisionName, departmentId) VALUES ('Unassigned', ?)",
          [departmentId]
        );

        // Prepare the new value for the audit trail
        const newValue = JSON.stringify({ departmentName: departmentName.trim(), locationId });

        // Step 3: Log the changes to the audit trail
        await audit.auditTrailFunction(
          adminUserId,
          'HIERARCHY',
          'CREATE',
          'DEPARTMENT ADDED',
          'dgDepartment',
          departmentId,
          null,
          newValue,
          null
        );

        return { affectedRows: 1, departmentId, divisionId: divisionResult.insertId };
      }
    } catch (error) {
      console.error("Error adding department:", error);
      throw error; // Propagate the error to the calling function
    }
  }

  static async addDivision(divisionName, departmentId, adminUserId) {
    try {
      // Step 1: Insert the new division into the dgDivision table
      const [result] = await db.query(
        "INSERT INTO dgDivision (divisionName, departmentId) VALUES (?, ?)",
        [divisionName, departmentId]
      );

      // Step 2: Check if the insertion was successful
      if (result.affectedRows === 1) {
        // Step 3: Prepare the new value for the audit trail
        const newValue = await new Promise((resolve, reject) => {
          try {
            resolve(
              JSON.stringify({
                divisionName: divisionName.trim(),
                departmentId,
              })
            );
          } catch (error) {
            reject(error);
          }
        });

        // Step 4: Log the changes to the audit trail
        await audit.auditTrailFunction(
          adminUserId,
          "HIERARCHY",
          "CREATE",
          "DIVISION ADDED",
          "dgDivision",
          result.insertId,
          null,
          newValue,
          null
        );

        return result;
      }

      return { affectedRows: 0 };
    } catch (error) {
      console.error("Error adding division:", error);
      throw error; // Propagate the error to be caught in the controller
    }
  }

  static async getPrivileages(langID) {
    try {
      const [[result]] = await db.execute(
        "CALL spGetPackageFeatureTabPermission(?)",
        [langID]
      );
      return result;
    } catch (error) {
      console.log(error);
      throw error; // Propagate the error to be caught in the controller
    }
  }
  static async getUsergroups(adminUserId) {
    let newValue;
    try {
      const [userGroups] = await db.query(
        "SELECT * FROM dgRole WHERE  status = ?",
        [1]
      );
      newValue = JSON.stringify(userGroups[0]);

      await audit.auditTrailFunction(
        adminUserId,
        "USER MANAGEMENT",
        "READ",
        "User groups accessed",
        "dgRole",
        "0",
        null,
        newValue,
        null
      );
      return userGroups;
    } catch (error) {
      console.error("Error fetching user groups:", error);
      throw error; // Propagate the error to be caught in the controller
    }
  }
  static async getUsersById(roleId) {
    try {
      const [users] = await db.query(
        "SELECT username,userId FROM dgUser WHERE  active = ? AND roleId=?",
        [1, roleId]
      );
      return users;
    } catch (error) {
      console.log("err:", error);
      log.error(error);
      throw error; // Propagate the error to be caught in the controller
    }
  }
  static async employeeIDisExist(employyeeID) {
    try {
      let status = false;
      const [[isExist]] = await db.execute(
        "SELECT COUNT(*) AS count FROM dgUser WHERE employeeID=?",
        [employyeeID]
      );
      if (isExist.count == 0) {
        status = true;
      }
      return status;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  static async selectingEmployeeID(roleId) {
    try {
      const user = await db.execute(
        "SELECT employeeID FROM dgUser WHERE roleId = ? AND active= 1",
        [roleId]
      );
      return user[0];
    } catch (err) {
      console.log("err:", err);
      throw err;
    }
  }
  static async selectingEmployee(parsedEmployeeID) {
    try {
      const user = await db.execute(
        "SELECT employeeID FROM dgUser WHERE employeeID = ? AND active= 1",
        [parsedEmployeeID]
      );
      return user[0];
    } catch (err) {
      console.log("err:", err);
      throw err;
    }
  }
  static async selectingEmail(primaryEmail) {
    try {
      const user = await db.execute(
        "SELECT primaryEmail FROM dgUser WHERE primaryEmail = ? AND active= 1",
        [primaryEmail]
      );
      return user[0];
    } catch (err) {
      console.log("err:", err);
      throw err;
    }
  }
}

module.exports = { login };
