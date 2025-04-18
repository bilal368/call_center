const db = require("../utils/DAL");
let log = require("log4js").getLogger("User");


class alerts {
  static async getUsers(alertItemId,alertItemRecorderTypeId) {
  
    
    // get user list for add
    try {
      let query;
      if(!alertItemRecorderTypeId){
        query=`SELECT du.roleId,du.userId,du.username,du.firstname,du.lastname
                    FROM dgUser du
                    WHERE  du.roleId is NOT NULL 
                    AND NOT EXISTS (
                    SELECT 1 
                    FROM dgAlertItemUser da 
                    WHERE da.alertUserId = du.userId AND da.alertItemId=? AND da.active=1 )`
                 
      const [result] = await db.execute(query, [alertItemId])
      return result;
      }else{
      query=`SELECT du.roleId,du.userId,du.username,du.firstname,du.lastname
                    FROM dgUser du
                    WHERE  du.roleId is NOT NULL 
                    AND NOT EXISTS (
                    SELECT 1 
                    FROM dgAlertItemUser da 
                    WHERE da.alertUserId = du.userId AND da.alertItemId=? AND da.active=1 AND da.alertItemRecorderTypeId=?)`
        
                    const [result] = await db.execute(query, [alertItemId,alertItemRecorderTypeId])
                    return result;
                  
          }
      
    } catch (error) {
      log.error(error)
      console.error(error)
      throw error;
    }
  }
  static async getUserList(alertItemId,alertItemRecorderTypeId) {
    // get already added user list
    try {
      let query;
      if(!alertItemRecorderTypeId){
        query=`SELECT dAU.alertItemRecorderTypeId,du.roleId,du.username,du.firstname,du.lastname,
        dAU.alertItemUserId,dAU.alertUserId,dAU.isEmailAlert,dAU.isShowPopUpAlert FROM dgUser as du 
                RIGHT JOIN dgAlertItemUser as dAU ON du.userId=dAU.alertUserId WHERE dAU.alertItemId=? AND 
                dAU.active=? `

                const [result] = await db.execute(query, [alertItemId, 1])
                return result;
              }else{
      query=`SELECT du.roleId,du.username,du.firstname,du.lastname,
        dAU.alertItemUserId,dAU.alertUserId,dAU.isEmailAlert,dAU.isShowPopUpAlert FROM dgUser as du 
                RIGHT JOIN dgAlertItemUser as dAU ON du.userId=dAU.alertUserId WHERE dAU.alertItemId=? 
                AND dAU.active=? AND dAU.alertItemRecorderTypeId=?`

                const [result] = await db.execute(query, [alertItemId, 1,alertItemRecorderTypeId])
                return result;
              }
      

    
    } catch (error) {
      log.error(error);
      console.error(error)
      throw error;
    }
  }
  static async getTimeIntervalData(alertItemId,alertItemRecorderTypeId) {
    try {
      
      const [result] = await db.execute(`SELECT alertDayTimeIntervalId,alertDay,
        alertStartTime,alertEndTime,alertInterval FROM dgAlertDayTimeInterval  WHERE alertItemRecorderTypeId=?`, [alertItemRecorderTypeId])
        return result;
    } catch (error) {
      log.error(error);
      console.error(error)
      throw error;
    }
  }
  static async getDiskAlertValue(alertItemId){
    try {      
      const [result]=await db.execute(`SELECT archiveInitialValue from dgAlertItem WHERE alertItemId=?`,[alertItemId])
      return result;
    } catch (error) {
      log.error(error);
      console.error(error)
      throw error;
    }
  }

  static async addUserToAlerts(alertItemId, userList, alertItemRecorderTypeId) {
    const BATCH_SIZE = 50; // Adjust based on your database and system capacity
    
    try {
      const INSERT_QUERY = `
        INSERT INTO dgAlertItemUser (alertUserId, alertItemId, active, alertItemRecorderTypeId)
        VALUES ?
      `;
      const UPDATE_QUERY_WITH_RECORDER_TYPE = `
        UPDATE dgAlertItemUser
        SET active = 1
        WHERE alertUserId IN (?) AND alertItemId = ? AND alertItemRecorderTypeId = ?
      `;
      const UPDATE_QUERY_WITHOUT_RECORDER_TYPE = `
        UPDATE dgAlertItemUser
        SET active = 1
        WHERE alertUserId IN (?) AND alertItemId = ? AND alertItemRecorderTypeId IS NULL
      `;
  
      for (let i = 0; i < userList.length; i += BATCH_SIZE) {
        const batch = userList.slice(i, i + BATCH_SIZE);
  
        const inserts = [];
        const updates = [];
  
        for (const element of batch) {
          const queryCondition = alertItemRecorderTypeId !== null
            ? `alertItemRecorderTypeId = ?`
            : `alertItemRecorderTypeId IS NULL`;
  
          const queryParams = alertItemRecorderTypeId !== null
            ? [element, alertItemId, alertItemRecorderTypeId]
            : [element, alertItemId];
  
          const [existingRecord] = await db.execute(
            `SELECT * FROM dgAlertItemUser WHERE alertUserId = ? AND alertItemId = ? AND ${queryCondition}`,
            queryParams
          );
  
          if (existingRecord.length === 0) {
            inserts.push([element, alertItemId, 1, alertItemRecorderTypeId]);
          } else {
            updates.push(element);
          }
        }
  
        // Perform bulk insert
        if (inserts.length > 0) {
          await db.query(INSERT_QUERY, [inserts]);
        }
  
        // Perform bulk update
        if (updates.length > 0) {
          if (alertItemRecorderTypeId !== null) {
            await db.query(UPDATE_QUERY_WITH_RECORDER_TYPE, [updates, alertItemId, alertItemRecorderTypeId]);
          } else {
            await db.query(UPDATE_QUERY_WITHOUT_RECORDER_TYPE, [updates, alertItemId]);
          }
        }
      }
  
      return true;
    } catch (error) {
      console.error("Error in addUserToAlerts:", error.message);
      log.error(error);
      console.error(error)
      throw error;
    }
  }
  


  static async setAlertForUsers(userListwithAlerts, alertItemRecorderTypeId) {
    try {
      const results = await Promise.all(
        userListwithAlerts.map(async (element) => {
          const [result] = await db.execute(
            `UPDATE dgAlertItemUser 
             SET isEmailAlert = ?, 
                 isShowPopUpAlert = ?, 
                 alertItemRecorderTypeId = ?
             WHERE alertItemUserId = ?`,
            [element.isEmailAlert, element.isShowPopUpAlert, alertItemRecorderTypeId, element.alertItemUserId]
          );
          return result;
        })
      );
      return results;
    } catch (error) {
      log.error(error);
      console.error(error)
      throw error;
    }
  }
  
  static async setTimeInterval(timeInterval,alertItemId,alertItemRecorderTypeId) {
    try {
      const [isExist] = await db.execute(`SELECT * FROM dgAlertDayTimeInterval WHERE alertItemRecorderTypeId=? `,[alertItemRecorderTypeId])
      if(isExist.length != 0){
        // update existing
            // Update existing records
          for (const element of timeInterval) {
            await db.execute(
              `UPDATE dgAlertDayTimeInterval 
              SET alertStartTime=?, alertEndTime=?, alertInterval=? 
              WHERE alertItemRecorderTypeId=? AND alertDay=?`,
              [element.alertStartTime, element.alertEndTime, element.alertInterval, alertItemRecorderTypeId, element.alertDay]
            );
          }
        return true;
      }else{
        // add new
        const results = await Promise.all(timeInterval.map(async element => {
        const [result] = await db.execute(`INSERT INTO  dgAlertDayTimeInterval 
          (alertDay,alertStartTime,alertEndTime,alertInterval,alertItemRecorderTypeId) 
          VALUES(?,?,?,?,?)`, 
          [element.alertDay, element.alertStartTime, element.alertEndTime,element.alertInterval,alertItemRecorderTypeId])
          return result;
        }));   
        return results;   
      }
    } catch (error) {
      log.error(error);
      console.error(error)
      throw error;
    }
  }  
  static async removeUserFromAlerts(alertItemId, alertUserId) {
    try {
      // set active =0 and revoke all alert options
      const [result] = await db.execute(`UPDATE dgAlertItemUser SET active =0,isEmailAlert=0,
        isShowPopUpAlert=0 WHERE alertUserId = ? AND alertItemId = ?`, [alertUserId, alertItemId])
      return result
    } catch (error) {
      log.error(error);
      console.error(error)
      throw error;
    }
  }
  static async setPercentageForDiskFull(alertItemId, archiveInitialValue){
    try {
      const [result]=await db.execute(`UPDATE dgAlertItem set archiveInitialValue=?
         WHERE alertItemId=?`,[archiveInitialValue,alertItemId]);
      return result
    } catch (error) {
      log.error(error);
      console.error(error)
      throw error;
    }
  }
  static async getRecorderTypes(){
    try {
      const [result]=await db.execute(`SELECT * from dgRecorderType`)
      return result;
    } catch (error) {
      log.error(error);
      console.error(error)
      throw error;
    }
  }
}
module.exports = { alerts }