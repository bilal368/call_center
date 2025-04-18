const { response } = require('express');
const db = require('../utils/DAL');
const bcrypt = require('bcrypt');
const audit = require("../auditTrail");
var log = require('log4js').getLogger("ldap");


class ldap {
    ldap() {
    }
    static async insertLDAPDetails(systemIP, domain, username, bindCredentials, systemName, currentDate) {
        try {
            let status = "failed";
            const [response] = await db.query("INSERT INTO dgLDAPSetting (serverIP, domainName, LDAPUsername, LDAPPassword, systemName,createdDate) \
            VALUES (?,?,?,?,?,?);", [systemIP, domain, username, bindCredentials, systemName, currentDate]);
            if (response.affectedRows == 1) {
                status = "success";
            }
            return status;
        } catch (err) {
            console.error('Error inserting LDAP details:', err);
            log.error(err);
        }
    }
    static async getLdapCredential() {
        try {
            return await db.query("SELECT systemName,LDAPUsername,LDAPPassword,domainName,serverIP FROM dgLDAPSetting");
        } catch (err) {
            console.log(err);
            log.error(err);
        }
    }
    static async insertLDAPproperty(column, propertyName) {
        try {
            let response = await db.query("INSERT INTO LDAPPropertyMapping(dgUsercolumnName, LDAPPropertyName) VALUES (?, ?)", [column, propertyName]);
        } catch (err) {
            console.log(err);
        }
    }
    static async saveUserRolesToDB(role, date) {
        try {
            let [[isExist]] = await db.query("SELECT COUNT(*) as count FROM  dgRole WHERE roleName=?", [role]);
            if (isExist.count == 0) {
                let response = await db.query("INSERT INTO dgRole(roleName,createdDate) VALUES(?,?);", [role, date]);
            }

        } catch (err) {
            console.log(err);
        }
    }
    static async getLDAPlocation() {
        try {
            const [[location]] = await db.query("SELECT * FROM dgLocation");
            const [path] = await db.query("SELECT LDAPPropertyValue FROM dgDepartment WHERE locationId=?", [location.locationId])
        } catch (err) {
            console.log(err);
        }
    }
    static async getLDAPlocationPath() {
        try {
            return await db.query("SELECT * FROM dgLocation where active=1");
        } catch (err) {
            console.log("err" + err);
        }
    }
    static async getDepartmentListByLid(id) {
        try {
            return await db.query("SELECT departmentName FROM dgDepartment WHERE locationId=?;", [id]);
        } catch (err) {
            console.log(err);
        }
    }
    static async getRolesAndPrivilege() {
        try {
            const [res] = await db.execute("SELECT U.username,U.userId,R.roleName FROM dgUser U INNER JOIN dgRole R \
   ON U.roleId = R.roleId GROUP BY U.username;");
            return res;
        } catch (err) {
            console.log(err);
        }
    }
    static async addAllUsersToTempTable(data) {
        try {
            // Check if the table already exists
            const tableExistsQuery = `
            SELECT TABLE_NAME
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dgTempTable'
        `;
            const tableExists = await db.execute(tableExistsQuery);

            if (tableExists[0].length > 0) {
                console.log('Table dgTempTable already exists.');
            } else {
                // If the table doesn't exist, create it
                const createTableQuery = `
                CREATE TABLE dgTempTable (
                  id INT(11) NOT NULL AUTO_INCREMENT,
                  user VARCHAR(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
                  distinguishedName JSON,
                  PRIMARY KEY (id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `;
                await db.execute(createTableQuery);
                console.log('Table dgTempTable created.');
            }

            // Now, proceed to insert data into the table...
            for (let i = 0; i < data.length; i++) {
                let jsonData;
                try {
                    jsonData = JSON.stringify(data[i]); // Ensure the data is a valid JSON string
                    await db.execute("INSERT INTO dgTempTable(distinguishedName) VALUES(?);", [jsonData]);
                } catch (err) {
                    console.error(`Failed to insert data at index ${i}:`, data[i], err.message);
                }
            }
        } catch (err) {
            console.log("Error:", err);
        }
    }
    static async saveHierarchy(data) {
        try {
            let status = "FAILED";
            for (let i = 0; i < data.length; i++) {
                if (!data[i]) {
                    continue; // Skip this iteration if data[i] is null or undefined
                }
                const hierarchyParts = data[i].hierarchy.split(',');
                const departmentIndex = hierarchyParts.indexOf(data[i].DEPARTMENT);
                const departmentHierarchy = hierarchyParts.slice(0, departmentIndex + 1).join(',');
                const divisionHierarchy = data[i].hierarchy;
                const locationWithoutOU = data[i].LOCATION.substring(3);
                const departmentWithoutOU = data[i].DEPARTMENT.substring(3);
                const divisionWithoutOU = data[i].DIVISION.substring(3);
                let locationId = "";
                let location = "";
                let department = "";
                let departmentId = "";
                const [[checkLocation]] = await db.execute("SELECT COUNT(*) AS count,locationId FROM dgLocation WHERE locationName=?;", [locationWithoutOU]);
                const [[checkDepartment]] = await db.execute("SELECT COUNT(*) AS count,departmentId FROM dgDepartment WHERE departmentName=?;", [departmentWithoutOU]);
                if (checkLocation.count > 0) {
                    locationId = checkLocation.locationId;
                } else {
                    [location] = await db.execute("INSERT INTO dgLocation(locationName,LDAPPropertyValue) VALUES(?,?);", [locationWithoutOU, data[i].LOCATION,]);
                    locationId = location.insertId
                }
                if (checkDepartment.count > 0) {
                    departmentId = checkDepartment.departmentId;
                } else {
                    [department] = await db.execute("INSERT INTO dgDepartment(locationId,departmentName,LDAPPropertyValue) VALUES(?,?,?);", [locationId, departmentWithoutOU, departmentHierarchy]);
                    departmentId = department.insertId
                }
                const [division] = await db.execute("INSERT INTO dgDivision(departmentId,divisionName,LDAPPropertyValue) VALUES(?,?,?);", [departmentId, divisionWithoutOU, divisionHierarchy]);
                status = "Success";
            }
            return status;
        } catch (err) {
            console.log("err::", err);
            throw err;
        }
    }
    static async getAllLdapLocation() {
        try {
            const [location] = await db.execute("SELECT LDAPPropertyValue FROM dgDivision");
            return location;
        } catch (err) {
            console.log("Err:", err);
        }
    }
    static async getAllLdapDivision() {
        try {
            const [division] = await db.execute("SELECT LDAPPropertyValue,divisionId,divisionName FROM dgDivision");
            return division;
        } catch (err) {
            console.log("err:", err);
        }
    }
    static async getAllLDAPEmployees() {
        try {
            const [data] = await db.execute("SELECT distinguishedName FROM dgTempTable;");
            return data;
        } catch (err) {
            console.log("err:", err);
            log.error(err);
        }
    }
    static async createStaticUser() {
        try {
            [[resultz]] = await db.execute(
                "CALL spGetPackageFeatureTabPermission(?)",
                [1]
            );
            const permissionIds = resultz.map(item => item.packageFeatureTabPermissionId);
            const filteredIds = permissionIds.filter(id => id !== null && id !== undefined); // Filter out any undefined or null values (optional)  
            const commaSeparatedIds = filteredIds.join(','); // Join the permission IDs with commas
            const [response] = await db.execute("INSERT INTO dgUser(username,userHierarchyId,packageFeatureTabPermissionIds) VALUES(?,?,?)", ['powerUser', 2, commaSeparatedIds]);
            return response;
        } catch (err) {
            console.log(err);
            log.error(err);
        }
    }
}
class settings {
    static async getExtensionMapping(pageNumber, recordsPerPage, selExtensions, setAgents, status, userId) {
        try {
            let str1 = "";
            let str2 = "";
            let newValue = {};
            let startIndex = (pageNumber - 1) * recordsPerPage;
            let arr = [startIndex, recordsPerPage];
            if (selExtensions.length > 0) {
                str1 = `AND DE.extensionId IN(${selExtensions.map(() => '?').join(',')})`;
                arr = [...selExtensions, ...arr];
            }
            if (setAgents.length > 0) {
                str2 = `AND DE.userId IN(${setAgents.map(() => '?').join(',')})`;
                arr = [...setAgents, ...arr];
            }
            let queryString = `SELECT DL.locationId, DL.locationName, DD.departmentId, DT.departmentName, 
                            DE.divisionId, DD.divisionName, DE.extensionId, DE.extensionNumber,DU.employeeID ,
                            DE.userId, DU.firstname, DU.lastname, DE.active,DU.username
                            FROM dgExtension DE
                            JOIN dgDivision DD ON DE.divisionId = DD.divisionId
                            JOIN dgDepartment DT ON DD.departmentId = DT.departmentId
                            JOIN dgLocation DL ON DT.locationId = DL.locationId
                            LEFT JOIN dgUser DU ON DE.userId = DU.userId AND DE.active = ${status} 
                            WHERE DE.active =  ${status}
                            ${str1} 
                            ${str2} 
                            LIMIT ?, ?`;

            const [response] = await db.execute(queryString, arr);
            newValue = JSON.stringify(response);
            const [[totalLength]] = await db.execute(`
                SELECT COUNT(DE.extensionId) AS count
                FROM dgExtension DE
                JOIN dgDivision DD ON DE.divisionId = DD.divisionId
                JOIN dgDepartment DT ON DD.departmentId = DT.departmentId
                JOIN dgLocation DL ON DT.locationId = DL.locationId
                LEFT JOIN dgUser DU ON DE.userId = DU.userId AND DE.active = ${status} 
                WHERE DE.active = ${status} `);
            const count = totalLength.count;

            await audit.auditTrailFunction(userId, 'EXTENSION MAPPING', 'READ', 'Extension mapping accessed', 'dgExtension', '0', null, newValue, null);
            return { response, count };

        } catch (err) {
            console.log(err);
            log.error(err);
            throw err;
        }
    }
    static async extMapp(pageNumber, recordsPerPage, selExtensions, setAgents, status, userId, sortCol, sortOrder, employeeID) {
        try {
            let newValue = {};
            const [result] = await db.execute('CALL  spGetExtensionMappingData(?,?,?,?,?,?,?,?)',
                [selExtensions, setAgents, status, pageNumber, recordsPerPage, employeeID, sortCol, sortOrder]);
            newValue = JSON.stringify(result);
            await audit.auditTrailFunction(userId, 'EXTENSION MAPPING', 'READ', 'Extension mapping viewed', 'dgExtension', '0', null, newValue, null);

            return result;
        } catch (err) {
            console.log(err);
        }
    }
    static async getExtensionDetailsByID(extensionId) {
        try {
            const [response] = await db.execute(`SELECT DL.locationId, DL.locationName, DD.departmentId, DT.departmentName, DE.divisionId, DD.divisionName,
             extensionId, extensionNumber, DE.userId, DU.firstname, DU.lastname,DU.username,DU.employeeID 
            FROM dgExtension DE
            JOIN dgDivision DD ON DE.divisionId = DD.divisionId
            JOIN dgDepartment DT ON DD.departmentId = DT.departmentId
            JOIN dgLocation DL ON DT.locationId = DL.locationId
            LEFT JOIN dgUser DU ON DE.userId = DU.userId AND DE.active = 1 WHERE=DE.extensionId=?`, [extensionId]);

            return response;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
    static async getExtension(divisionId) {
        try {
            const [extensions] = await db.execute("Select * from dgExtension  where active !=0 and divisionId =? and employeeId is null;", [divisionId]);
            return extensions;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
    static async getAllExtension() {
        try {
            const [extensions] = await db.execute("Select * from dgExtension  where active !=0;");
            return extensions;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
    static async isExtensionExist(extensionId) {
        try {
            const [[result]] = await db.execute("SELECT COUNT(*) as count FROM dgExtension WHERE extensionNumber=? AND active !=0", [extensionId])
            return result.count
        } catch (err) {
            console.log(err);
        }
    }
    static async isEmployeeID(employeeId) {
        try {
            const [[result]] = await db.execute("SELECT COUNT(*) AS count FROM dgUser WHERE employeeID=?", [employeeId]);
            return result.count
        } catch (err) {
            console.log(err);
            log.error(err);
        }
    }
    static async addExtensionMapping(extensionId, divisionId, userId, searchText, ID, status) {
        let result = "";
        let insertId = 0;
        let oldValue = "";
        let newValue = "";
        try {
            if (extensionId == 0) {
                [result] = await db.execute("INSERT INTO dgExtension (divisionId, extensionNumber, employeeId, active)\
                VALUES (?,?,?,?);", [divisionId, searchText, userId, status]);
                insertId = searchText;
                let newData = await settings.getExtensionDet(insertId);
                newValue = JSON.stringify(newData);
                await audit.auditTrailFunction(ID, 'EXTENSION MAPPING', 'CREATE', 'Extension Created', 'dgExtension', result.insertId, oldValue, newValue, null);
            }
            else {
                let oldData = await settings.getExtensionDet(extensionId);
                oldValue = JSON.stringify(oldData);
                [result] = await db.execute(
                    "UPDATE dgExtension SET divisionId = ?, employeeId = ?, active = ? WHERE extensionNumber = ?;",
                    [divisionId, userId, status, extensionId]
                  );
                let newData = await settings.getExtensionDet(extensionId);
                newValue = JSON.stringify(newData);
                insertId = extensionId;
                await audit.auditTrailFunction(ID, 'EXTENSION MAPPING', 'UPDATE', 'Extension updated', 'dgExtension', insertId, oldValue, newValue, null);
            }
            if (result.affectedRows == 1) {
                return await settings.getExtensionDet(insertId);
            }

        } catch (err) {
            console.log(err);
            throw err;
        }
    }
    static async updateExtension(userId, extension) {
        try {
            let status = "failed";
            const [result] = await db.execute("UPDATE dgExtension SET employeeId = ? WHERE extensionNumber = ?;", [userId, extension]);
            if (result.affectedRows == 1) {
                status = "success";
            }
            return status;
        } catch (err) {
            log.error(err);
        }
    }
    static async MappExtension(extensionId, divisionId, ID) {
        try {
            let result = "";
            let insertId;
            let oldValue = {};
            let newValue = {};
            let oldData = await settings.getExtensionDet(extensionId);
            oldValue = JSON.stringify(oldData);
            [result] = await db.execute("UPDATE dgExtension SET divisionId = ?, \
             active  = ? WHERE extensionId = ?;", [divisionId, 1, extensionId]);
            let newData = await settings.getExtensionDet(extensionId);
            newValue = JSON.stringify(newData);
            insertId = extensionId;
            await audit.auditTrailFunction(ID, 'EXTENSION MAPPING', 'UPDATE', 'EXTENSION UPDATED', 'dgExtension', insertId, oldValue, newValue, null);
            if (result.affectedRows == 1) {
                return await settings.getExtensionDet(insertId);
            }
        } catch (err) {
            console.log(err);
        }
    }
    static async deleteExtensionMapping(extensionIds, userId) {
        try {
            let status = "Failed"; // Default status
            let [[oldData]] = await settings.getExtensionDet(extensionIds);
            let oldValue = JSON.stringify(oldData);
            const [result] = await db.execute("UPDATE dgExtension SET active = 0 WHERE extensionId IN (?);", [extensionIds]);
            let [[newData]] = await settings.getExtensionDet(extensionIds);
            let newValue = JSON.stringify(newData);
            await audit.auditTrailFunction(userId, 'EXTENSION MAPPING', 'DELETE', 'EXTENSION DELETED', 'dgExtension', extensionIds, oldValue, newValue, null);
            status = "Success";
            return status;
        } catch (err) {
            console.error("Error in deleteExtensionMapping:", err); // Log the error for debugging
            throw err; // Rethrow the error to be handled by the caller
        }
    }
    static async deleteExtensionMapping(extension) {
        try {
            const placeholders = extension.map(() => '?').join(','); // Create placeholders for each extension ID
            const query = `UPDATE dgExtension SET active = 0 WHERE extensionId IN (${placeholders});`;            // Construct the query with placeholders
            const [result] = await db.execute(query, [...extension]);  // Execute the query with the extension array spread as individual arguments
        } catch (Err) {
            throw Err;
        }
    }
    static async hierarchyDetails(location, department, division) {
        try {

            if (division == null || department == null || location == null) {
                const [divisionResult] = await db.execute("SELECT divisionId FROM dgDivision WHERE divisionName = ?", ['unassigned']);
                const divisionId = divisionResult[0]?.divisionId || null;
                return divisionId;
            } else {
                // Fetch locationId based on location name
                const [locationResult] = await db.execute("SELECT locationId FROM dgLocation WHERE locationName = ?", [location]);
                const locationId = locationResult[0]?.locationId || null;
                // Fetch departmentId based on department name and locationId
                const [departmentResult] = await db.execute("SELECT departmentId FROM dgDepartment WHERE departmentName = ? AND locationId = ?", [department, locationId]);
                const departmentId = departmentResult[0]?.departmentId || null;
                // Fetch divisionId based on division name and departmentId
                const [divisionResult] = await db.execute("SELECT divisionId FROM dgDivision WHERE divisionName = ? AND departmentId = ?", [division, departmentId]);
                const divisionId = divisionResult[0]?.divisionId || null;
                return divisionId;
            }

        } catch (err) {
            console.log(err);
            throw err;
        }
    }
    static async UnassignedHeirarchy() {
        try {
            const [[result]] = await db.execute("SELECT * FROM dgLocation L INNER JOIN dgDepartment DP ON L.locationId = DP.locationId \
        INNER JOIN dgDivision DV ON DP.departmentId = DV.departmentId WHERE L.locationName='Unassigned';");
            return result;
        } catch (err) {
            log.error(err);
        }
    }
    static async addHeirarchyForEmployee(divisionId,employeeID){
        try{ 
            employeeID = String(employeeID);
         const [result]= await db.execute("UPDATE dgUser SET divisionId=? WHERE employeeID=?",[divisionId,employeeID]);  
        }catch(err){
            console.log(err);
            throw err;
        }
    }
    static async hierarchy(employeeID) {
        try {
            const [[result]] = await db.execute(
                "SELECT * FROM dgUser WHERE employeeID = ? AND divisionId != 0 AND divisionId IS NOT NULL",
                [employeeID]
            );
            return result;
        } catch (error) {
            console.error("Error fetching hierarchy data:", error);
            throw error; // Re-throw for higher-level error handling
        }
    }
    
    static async getExtensionDet(extensionId) {
        try {
            let [[data]] = await db.execute("SELECT * FROM dgExtension WHERE extensionNumber=?", [extensionId]);
            return data;
        } catch (err) {
            console.log(err);
            log.error(err);
        }
    }
}
module.exports = { ldap, settings };  