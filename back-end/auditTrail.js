const db = require("./utils/DAL");
var log = require('log4js').getLogger("ldap");


async function auditTrailFunction(userId, moduleName, action, actionDescription, tableName, recordIds, oldValue, newValue, ipAddress) {
   try {
      const description = actionDescription.toLowerCase();
      // Map actions to values
      const actionMap = {
         'CREATE': 1,
         'UPDATE': 2,
         'READ': 3,
         'DELETE': 4,
         'UPLOAD': 5,
         'LOCK': 6,
         'UNLOCK': 7,
         'MERGE': 8,
         'PLAY': 9
      };

      const actionValue = actionMap[action] || '';  // Get mapped value or empty if not found
      // Ensure recordIds is a single value
      const recordId = Array.isArray(recordIds) ? recordIds[0] : recordIds;
      // Pass recordId instead of recordIds
      const [res] = await db.execute(
         `INSERT INTO dgAuditTrail (userId, moduleName, action, actionDescription, tableName, recordId,oldValue,newValue,ipAddress)
       VALUES (?, ?, ?, ?, ?, ?,?,?,?)`,
         [userId, moduleName, actionValue, description, tableName, recordId,
            oldValue || null,                             // oldValue (JSON string or null)
            newValue || null,
            ipAddress || null]
      );
      return res;

   } catch (err) {
      console.error("Error creating audit trail entry:", err);
      log.error(err);  // Additional error logging, if applicable
   }
}

module.exports = { auditTrailFunction };