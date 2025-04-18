const db = require("../utils/DAL");
let log = require("log4js").getLogger("User");

class rolesAndPrivileges {
    static async addFeatureByRole(roleID, feature) {
      try {
        await db.execute("UPDATE dgRole SET packageFeatureIds=? WHERE roleId=?", [feature, roleID]);
      } catch (err) {
        console.log(err);
        log.error(err);
        throw err;
      }
    }
    static async getPrivileages(langID) {
      try {
        const [[result]] = await db.execute('CALL spGetPackageFeatureTabPermission(?)', [langID]);
        return result;
      } catch (error) {
        console.log(error);
        throw error; // Propagate the error to be caught in the controller
  
      }
    }
    static async getUsersByRole() {
      try {
        // selecting users group by Roles by descending order only shows active status =1
        const [users] = await db.query(
          `SELECT 
            dU.userId, 
            dU.username, 
            dU.firstname, 
            dU.lastname, 
            dR.roleName, 
            dR.roleId, 
            dU.dgUserAccess,
            dU.packageFeatureTabPermissionIds as featuresUser ,
            dR.packageFeatureTabPermissionIds as featuresRole,
            dU.accessPermissionQueryFilter as accessPermissionQueryFilterUser ,
            dR.accessPermissionQueryFilter as accessPermissionQueryFilterRole  
          FROM 
            dgRole AS dR 
          LEFT JOIN 
            dgUser  AS dU ON dU.roleId = dR.roleId AND dU.active = 1 
          WHERE 
  dR.status = 1;`
        );
        return users;
      } catch (error) {
        throw error; //throw error to controller
      }
    }
    static async getUsergroups(adminUserId) {
      let newValue
      try {
        const [userGroups] = await db.query('SELECT * FROM dgRole WHERE  status = ?', [1]);
        newValue = JSON.stringify(userGroups[0])
  
        await audit.auditTrailFunction(adminUserId, 'USER MANAGEMENT', 'READ', 'User groups accessed', 'dgRole', '0', null, newValue, null);
        return userGroups;
      } catch (error) {
        throw err;
  
      }
    }
    static async getDataforDataRestrictions() {
      try {
        // Fetch data
        const [locations] = await db.execute('SELECT * FROM dgLocation WHERE active=1');
        const [departments] = await db.execute('SELECT * FROM dgDepartment WHERE active=1');
        const [divisions] = await db.execute('SELECT * FROM dgDivision WHERE active=1');
        const [extension] = await db.execute('SELECT * FROM dgExtension WHERE active=1');
        // Return an object containing all data
        return {
          locations,
          departments,
          divisions,
          extension
        };
      } catch (err) {
        console.log("err:", err);
        throw err;
      }
    }
    static async findByUserId(userId) {
      try {
        const [result] = await db.execute('SELECT * FROM dgUser where userId=?', [userId]);
        return result
      } catch (error) {
        throw error
      }
    }
    static async findBygroupName(group) {
      try {
        const [result] = await db.execute('SELECT * FROM dgRole where roleName=?', [group]);
        return result
      } catch (error) {
        throw error
      }
    }
    static async updateUserPrivileges(userId, packageFeatureTabPermissionId, hierarchy) {
  
      try {
        const [result] = await db.execute('update dgUser set  packageFeatureTabPermissionIds=?,accessPermissionQueryFilter=? where userId=?', [packageFeatureTabPermissionId, hierarchy, userId]);
        return result;
      } catch (error) {
        throw error;
      }
    }
    static async updateRolePrivileges(groupName, packageFeatureTabPermissionId, hierarchy) {
  
      try {
  
        const [result] = await db.execute('update dgRole set  packageFeatureTabPermissionIds=?,accessPermissionQueryFilter=? where roleName=?', [packageFeatureTabPermissionId, hierarchy, groupName]);
        return result;
      } catch (error) {
        throw error;
      }
    }
    static async insertLivestatus(values) {
      try {
        const [result] = await db.query(
          'INSERT INTO temp_liveStatus(ChannelID, Extension, ExtensionName, Agent, AgentID, ChannelStatus, UserID, CallerID, StartTime, CallDirection, DialDigits, RecorderID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          values
        );
        console.log("Insert ", result);
        return result;
      } catch (error) {
  
      }
    }
    static async fecthuserDeatils() {
      try {
        const user = await db.execute("select * from temp_liveStatus",);
        // console.log(user[0],'user');
        return user[0];
      } catch (err) {
        console.log("err:", err);
        throw err;
      }
    }
  }
  
module.exports={rolesAndPrivileges}