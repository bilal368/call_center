const ldap = require('ldapjs'); //ldap object to access all the functionality provided by the ldapjs library.
const ldapObj = require("../model/ldap");
var log = require('log4js').getLogger("Ldap");
const ldapModel = ldapObj.ldap;
const user = require("../model/user");
const userModel = user.login;
const config = ldapObj.settings;
const moment = require("moment");
const bcrypt = require("bcrypt");
const ldapUtils = require("../ldapConfiguration");
const saltRounds = 10;


async function ldapSearch(type, retries = 3) {
    const [[ldapDet]] = await ldapModel.getLdapCredential(); //fetch ldap Details in db
    const domainName = ldapDet.domainName;
    const serverIP = ldapDet.serverIP;
    const ldapFormat = domainName.split('.').map(component => `dc=${component}`).join(',');
    const url = "LDAP://" + serverIP;
    const ldapOptions = {
        url: url,
        bindDN: `${ldapDet.LDAPUsername}@${ldapDet.domainName}`,
        bindCredentials: ldapDet.LDAPPassword,
        reconnect: true,
        timeout: 10000, // Set timeout to 10 seconds
        connectTimeout: 10000 // Set connection timeout to 10 seconds
    };
    const client = await ldapUtils.initializeClient(ldapOptions);
    client.on('error', (err) => {
        console.error('LDAP client error:{ldapSearch}', err);
    });
    const searchOptions = {
        scope: 'sub', // Search scope: base, one, or sub 
        attributes: [], // Include desired attributes here
    };
    try {
        const ldapUserDetails = await ldapUtils.searchLDAP(ldapFormat, searchOptions, type, client);
        return ldapUserDetails;
    } catch (err) {
        if (retries > 0 && err.code === 'ECONNRESET') {
            console.warn(`Retrying LDAP search due to ECONNRESET. Attempts left: ${retries}`);
            return await ldapSearch(type, retries - 1);
        } else {
            throw err;
        }
    }
}
async function getLdapCredential() {
    const [[ldapDet]] = await ldapModel.getLdapCredential(); //fetch ldap Details in db
    const domainName = ldapDet.domainName;
    const ldapFormat = domainName.split('.').map(component => `dc=${component}`).join(',');
    const url = ldapDet.serverIP + ldapDet.systemName;
    const ldapOptions = {
        url: " LDAP://" + ldapDet.serverIP,
        bindDN: `${ldapDet.LDAPUsername}@${ldapDet.domainName}`,
        bindCredentials: ldapDet.LDAPPassword,
        reconnect: true,
        timeout: 10000, // Set timeout to 10 seconds
        connectTimeout: 10000 // Set connection timeout to 10 seconds
    };
    return { ldapFormat, ldapOptions };
}
async function handleError(res, err) {
    console.log("Error:", err);
    log.error(err);
    let statusCode = 500;
    let errorMessage = "Internal server error";

    if (err.message.includes("Not Found")) {
        statusCode = 404;
        errorMessage = "Data not found";
    } else if (err.message.includes("Validation")) {
        statusCode = 400;
        errorMessage = "Invalid data provided";
    }
    return res.status(statusCode).json({ status: false, err: errorMessage });
}
async function Hierarchypath(division, searchOpt) {
    const { ldapOptions, ldapFormat } = await getLdapCredential();
    const client = await ldapUtils.initializeClient(ldapOptions);
    let employeeData = [];
    let path = "";
    for (let i = 0; i < division.length; i++) {
        if (division[i].LDAPPropertyValue != null) {
            if (division[i].divisionName != 'UNASSIGNED' && division[i].divisionName != '') {
                path = division[i].LDAPPropertyValue + ",OU=" + division[i].divisionName;
            } else {
                path = division[i].LDAPPropertyValue;
            }
            let divisionID = division[i].divisionId;
            if (!path) {
                console.error(`Invalid LDAPPropertyValue at index ${i}: ${path}`);
                continue; // Skip this iteration and move to the next one
            }
            path = path.split(',').reverse().join();
            let FormatPath = path + "," + ldapFormat;

            //FormatPath = 'OU=Employees,OU=CEO Office,OU=Headquarters,OU=ES-Users,OU=Emirates Steel,DC=eisf,DC=co,DC=ae';
            //'OU=Developers,OU=SpeechLogix,dc=eisf,dc=co,dc=ae'
            const data = await ldapUtils.listLdapStructure(FormatPath, searchOpt, client);
            employeeData.push(data);
        }

    }
    return employeeData;
}
async function saveUserGroups() {
    let client;
    try {
        const { ldapOptions, ldapFormat } = await getLdapCredential(); //ldap credential 
        client = await ldapUtils.initializeClient(ldapOptions); //ldap client connect
        const ldapStructure = await ldapUtils.searchLDAP(ldapFormat, {
            scope: 'sub',
            filter: '(&(objectClass=*))',
            attributes: []
        }, 'hierarchy', client);
        const result = ldapStructure.map(row => {
            const parts = row.split(',');
            for (let i = parts.length - 1; i >= 0; i--) {
                if (parts[i].includes('OU=DGVox Privilege')) { // Filter the result based on User Groups in LDAP
                    return i > 0 ? parts[i - 1] : null;
                }
            }
        });

        const uniqueArray = [...new Set(result.filter(value => value !== null && value !== undefined))];
        const modifiedArray = uniqueArray.map(item => item.replace(/^CN=/, '')); // Fetch only User Groups 
        for (let i = 0; i < modifiedArray.length; i++) {
            // Uncomment if you want to save groups to the database
            const result = await userModel.insertUserGroup(
                modifiedArray[i],
                0
            );
        }
        return true;
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        return handleError(res, err);

    } finally {
        if (client) {
            try {
                client.unbind((err) => {
                    if (err) {
                        console.error('LDAP unbind error:', err);
                    } else {
                        console.log('Successfully unbound from LDAP server');
                    }
                });
            } catch (unbindError) {
                console.error('Error during unbind:', unbindError);
            }
        }
    }
}
exports.ldapAuthentication = async (req, res, next) => {
    try {
        console.log("ldapAuthentication:", req.body);
        // Validate required fields
        const requiredFields = ['password', 'systemName', 'systemIP', 'userName', 'domain'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).send({ statusText: `${field} is required` });
            }
        }
        const { password, systemName, systemIP, userName, domain } = req.body;
        const bindDN = userName + "@" + domain;
        const url = "LDAP://" + systemIP;
        const obj = {
            "url": url,
            "bindDN": bindDN,
            "bindCredentials": password,
            connectTimeout: 10000, // Connection timeout in milliseconds (adjust as needed) 
            idleTimeout: 60000, // Idle timeout in milliseconds (adjust as needed),
            reconnect: true
        };

        let client;
        try {
            client = ldap.createClient(obj);
            client.on('error', function (err) {
                err?.lde_message ? console.log('LDAP client error:', err?.lde_message) :
                    console.log('LDAP client error:', err)
                if (!res.headersSent) { // Check if response has already been sent
                    res.status(500).send({ status: false, statusText: "Internal server error" });

                }
            });
            client.bind(bindDN, password, async function (err) { // LDAP Authentication
                let response;
                if (err) {
                    console.log('LDAP bind error:', err);
                    if (!res.headersSent) { // Check if response has already been sent                    
                        res.status(500).send({ status: false, statusText: "LDAP bind failed" });

                    }
                    return; // Exit from the function
                } else {
                    const currentDate = moment().format("YYYY/MM/DD HH:mm:ss");
                    response = await ldapModel.insertLDAPDetails(
                        systemIP,
                        domain,
                        userName,
                        password,
                        systemName,
                        currentDate,
                        '',
                        ''
                    );
                }

                if (response !== "failed") { // Check if LDAP details insertion was successful
                    const resp = await exports.fetchLDAPUsers();
                    console.log("LDAP Authentication is successfully completed::", resp);
                    res.status(200).send({ status: true, statusText: "LDAP Authentication is successfully completed" });
                } else {
                    res.status(500).send({ status: false, statusText: "Failed to insert LDAP details" });
                }
            });

        } catch (err) {
            console.log("Error:", err);
            res.status(500).send({ status: false, statusText: "Internal server error" });
        }

    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        res.status(500).send({ status: false, statusText: "Internal server error" });
    }
};
exports.fetchLDAPUsers = async (req, res, next) => {
    try {
        const ldapUserArray = [];
        const { ldapOptions, ldapFormat } = await getLdapCredential();
        const client = await ldapUtils.initializeClient(ldapOptions);
        try {
            const data = await ldapUtils.listLdapStructure(ldapFormat, {
                filter: '(objectClass=person)',
                scope: 'sub', // Search scope: base, one, or sub 
                attributes: [], // Include desired attributes here
            },
                client);
            for (let i = 0; i < data.length; i++) {
                ldapUserArray.push(data[i].distinguishedName);
            }
            const response = await ldapModel.addAllUsersToTempTable(ldapUserArray); //store the epmloyees in temporly
            const resp = await saveUserGroups();
            return true
        }
        finally {
            client.unbind((err) => {
                if (err) {
                    console.error('LDAP unbind error:', err);
                } else {
                    console.log('Successfully unbound from LDAP server');
                }
            });
        }
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
    }
}
exports.getHierarchy = async (req, res, next) => {
    try {
        const ldapStructure = await ldapSearch('hierarchy');
        const parentDNs = ldapStructure.map(dn => {
            const parts = dn.split(',');
            parts.shift();
            return parts.join(',');
        });
        const data = Array.from(new Set(parentDNs));
        const pattern = /(?:OU|CN)=([^,]+),DC=eisf,DC=co,DC=ae/; //Extract the OU FROM the ldap List 
        const extractedValues = [];
        let cn = 1;
        data.forEach(entry => {
            const matches = entry.match(pattern);
            cn = cn + 1;
            if (matches && matches.length === 2) {
                extractedValues.push({
                    name: matches[1], context: "NOT SELECTED",
                    selection: "block"
                });
            }
        });
        const hierarchy = [...new Set(extractedValues.map(JSON.stringify))].map(JSON.parse);

        hierarchy.forEach((obj, index) => {
            obj.id = index + 1;
        });
        return res.status(200).json({ hierarchy: hierarchy });

    }
    catch (err) {
        console.log('Error fetching hierarchy:', err);
        log.error(err);
        return res.status(500).send("An error occurred while fetching hierarchy");
    }
};
exports.getHierarchySearch = async (req, res, next) => {
    try {
        const OU = req.body.ou;
        const ldapStructure = await ldapSearch('hierarchy');
        const result = ldapStructure.map(row => {
            const parts = row.split(',');
            let str = "";
            for (let i = parts.length - 1; i >= 0; i--) {
                if (parts[i].includes(OU)) {
                    return i > 0 ? {
                        name: parts[i - 1], context: "NOT SELECTED",
                        selection: "block"
                    } : null;
                }
            }
        }).filter(value => value !== null && value !== undefined);
        const uniqueArray = [...new Set(result.map(JSON.stringify))].map(JSON.parse);
        uniqueArray.forEach((obj, index) => {
            obj.id = index + 1;
        });
        return res.status(200).json({ status: true, hierarchy: uniqueArray });
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        return res.status(500).send("An error occurred while fetching hierarchy");
    }
}
exports.saveHierarchy = async (req, res, next) => {
    try {
        const data = req.body;
        const response = ldapModel.saveHierarchy(data);
        return res.status(200).json({ status: true, message: "Fetching successfully completed..!!" });
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        return handleError(res, err);
    }
}
exports.getEmployeeDataMapping = async (req, res, next) => {
    try {
        const userAttributes = await ldapSearch('login');
        const keysOnly = Object.keys(userAttributes);
        res.send(keysOnly.sort());
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        return res.status(500).send("An error occurred while fetching hierarchy");
    }
};
exports.LDAPuserDataSaving = async (req, res, next) => {

    try {
        let employeeData = [];
        const dataArray = [];
        let finalResponse = "";
        dataArray.push(req.body);

        const division = await ldapModel.getAllLdapDivision(); //fetch all hierarchy path
        const { ldapOptions, ldapFormat } = await getLdapCredential(); //ldap credential 
        const client = await ldapUtils.initializeClient(ldapOptions); //ldap client connect
        // Error handling for client connection issues
        client.on('error++', (err) => {
            console.error('LDAP client error:', err);
            return res.status(500).json({ status: false, message: 'LDAP client error', error: err.message });
        });
        // Error handling for unbinding
        client.on('unbind', (err) => {
            if (err) {
                console.error('LDAP client unbind error:', err);
            } else {
                console.log('LDAP client unbind successful');
            }
        });

        employeeData = await Hierarchypath(division, {
            filter: '(objectClass=person)',
            scope: 'sub', // Search scope: base, one, or sub 
            attributes: [], // Include desired attributes here
        }, client, ldapFormat);
        console.log("employeeData:", employeeData);
        for (const key in dataArray[0]) {
            if (dataArray[0].hasOwnProperty(key)) {
                await ldapModel.insertLDAPproperty(key, dataArray[0][key]); // Property Field
            }
        }
        if (employeeData.length) {
            for (let i = 0; i < employeeData[0].length; i++) {
                const keysArray = [];
                const valuesArray = [];
                for (const key in dataArray[0]) {
                    if (dataArray[0].hasOwnProperty(key)) {
                        if (employeeData[0][i][dataArray[0][key]] != undefined) {
                            keysArray.push(employeeData[0][i][dataArray[0][key]]);
                            valuesArray.push(key);
                        }
                    }
                }

                // Check if the user is a member of OU=DGVox Privilege
                if (employeeData[0][i].memberOf && employeeData[0][i].memberOf.includes('OU=DGVox Privilege')) {
                    // Extract and display the CN
                    const match = employeeData[0][i].memberOf.match(/CN=([^,]+)/);
                    if (match) {
                        const role = await userModel.getUserRoleByName(match[1]);
                        valuesArray.push('roleId');
                        keysArray.push(role.roleId);
                    }
                }
                // Encrypt the password
                const hashedPassword = await bcrypt.hash('Admin@123', 10);
                valuesArray.push('password');
                keysArray.push(hashedPassword);
                valuesArray.push('isLDAPUser');
                keysArray.push(1);
                valuesArray.push('username');
                keysArray.push(employeeData[0][i]['sAMAccountName']);
                keysArray.push(employeeData[0][i]['divisionID']);
                valuesArray.push('divisionId');
                const response = await userModel.ldapUserCreation(valuesArray.join(',\n'), keysArray, employeeData[0][i]['sAMAccountName']);
                finalResponse = response;
            }
        }

        console.log("finalResponse:", finalResponse);
        if (finalResponse != "" && finalResponse != undefined) {
            return res.status(200).json({ status: true, message: "Successfully completed" });
        } else {
            return res.status(400).json({ status: true, message: "Failed" });
        }
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        return handleError(res, err);
    }
}
exports.getUserGroups = async (req, res, next) => {
    try {
        const roles = await userModel.getUserRolesByStatus();
        return res.status(200).json({ groups: roles, message: "Fetching successfully completed..!!" });
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        return handleError(res, err);
    }
}
exports.getUserRoles = async (req, res, next) => {
    try {
        const roles = await userModel.getUserRolesByStatus();
        return res.status(200).json({ groups: roles, message: "Fetching successfully completed..!!" });
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
    }
}
exports.saveUserRoles = async (req, res, next) => {
    try {
        const selectedData = req.body.selected;
        const nonselectedData = req.body.nonselected;
        const response = await userModel.userRoleUpdation(selectedData, nonselectedData);
        return res.status(200).json({ status: true, message: "Fetching successfully completed..!!" });
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        return handleError(res, err);
    }

}
exports.getExtensionMapping = async (req, res, next) => {
    try {
        const { pageNumber, recordsPerPage, selExtensions, setAgents, status, sortCol, sortOrder } = req.body;
        const userId = req.body.adminUserId;
        const employeeID =null;
        const Test = await config.extMapp(pageNumber, recordsPerPage, selExtensions, setAgents, status, userId, sortCol, sortOrder,employeeID);
        const extensions = await config.getAllExtension();
        const getEmployees = await userModel.getAllEmployee();
        return res.status(200).json({ status: true, response: Test, extensions: extensions, employees: getEmployees, message: "Fetching successfully completed..!!" });
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        return handleError(res, err);
    }
}
exports.getMappingDetails = async (req, res, next) => {
    try {
        let heirarchy = await config.UnassignedHeirarchy();
        const extensions = await config.getExtension(heirarchy.divisionId);
        const [location] = await ldapModel.getLDAPlocationPath();
        const getEmployees = await userModel.getAllEmployee();
        return res.status(200).json({ status: true, location: location, extensions: extensions, getEmployees: getEmployees })
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        return handleError(res, err);
    }
}
exports.getDepartmentsByLocation = async (req, res, next) => {
    try {
        const locationId = req.body.locationId;
        const [departments] = await userModel.getDepartmentByLocation(locationId);
        return departments;
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        return handleError(res, err);
    }
}
exports.getDivisionsByDepartment = async (req, res, next) => {
    try {
        const departmentId = req.body.departmentId;
        const [division] = await userModel.getDivisionByDept(departmentId);
        return division;
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        return handleError(res, err);
    }
}
exports.getExtensionDetailsByID = async (req, res, next) => {
    try {
        const extensionId = req.body.extensionId;
        const [response] = await config.getExtensionDetailsByID(extensionId);
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        return handleError(res, err);
    }
}
exports.getEmployeesByUserID = async (req, res, next) => {
    try {
        const employeeID = req.body.userID;
        const data = await userModel.getEmployeesByUserID(employeeID);
        if (data != undefined && data != "") {
            res.status(200).json({ status: true, Data: data });
        }
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        return handleError(res, err);
    }
}
exports.addExtensionMapping = async (req, res, next) => {
    try {
        const { extension, division, searchText } = req.body;
        const userId = req.body.adminUserId;
        let heirarchy = await config.UnassignedHeirarchy();
        let status = "";
        if (heirarchy.divisionId == division) {
            status = 2;
        } else {
            status = 1;
        }
        let employeeID = req.body.employeeID;
        if (employeeID == null) {
            employeeID = 0;
        }
        const response = await config.addExtensionMapping(extension, division, employeeID, searchText, userId, status);
        if (response != undefined && response != "") {
            res.status(200).json({ status: true, Data: response });
        }
    } catch (err) {
        console.log("Error:", err);
        log.error(err);
        return handleError(res, err);
    }
}
exports.MappingHeirarchy = async (req, res, next) => {
    try {
        const { Extension, Location, Department, Division, adminUserId } = req.body;
        let result = "";
        for (let i = 0; i < Extension.length; i++) {
            result = await config.MappExtension(Extension[i], Division, adminUserId);
        }
        if (result != "" && result != undefined) {
            res.status(200).json({ status: true, message: "Successfully Mapped!!" });
        } else {
            res.status(400).json({ status: true, message: "Failed!!" });
        }

    } catch (err) {
        console.log(err);
        log.error(err);
    }
}
exports.deleteExtensionMapping = async (req, res, next) => {
    try {
        const extensionIds = req.body.extensionIds; // Extract extension IDs from request body
        const userId = req.body.adminUserId;
        const response = await config.deleteExtensionMapping(extensionIds, userId);
        res.status(200).json({ status: true, data: response, message: "Successfully Deleted!!" });
    } catch (err) {
        console.log("Error:", err); // Log the error for debugging
        log.error("Error in deleteExtensionMapping controller:", err);
        return handleError(res, err); // Call the error handler function with the error
    }
}

exports.ExtensionfileUpload = async (req, res, next) => {
    try {
        const { datas, adminUserId, action } = req.body;
        let status = "";
        let hierarchy ="";
        let divisionId ="";
        let Data="";
        // Step 1: Validate employeeID
        const invalidEmployeeIDs = [];
        for (const data of datas) {
            const employeeID = data.employeeID || null;
            if (employeeID) {
                const isEmployeeValid = await config.isEmployeeID(employeeID);
                if (isEmployeeValid==0) invalidEmployeeIDs.push(data);
            }
        }
        if (invalidEmployeeIDs.length > 0) {
            return res.status(201).json({
                status: false,
                message: "Invalid Employee IDs",
                invalidEmployeeIDs,
            });
        }
        // Step 2: Validate extensions
        const existingExtensions = [];
        for (const data of datas) {
            const extension = data.extension || null;
            if (extension) {
                const isExtensionValid = await config.isExtensionExist(extension);
                if (isExtensionValid>=1) existingExtensions.push(data);
            }
        }
        if (existingExtensions.length > 0 && action !== "overwrite") {
            return res.status(200).json({
                status: "exists",
                message: "Extensions already exist",
                existingExtensions,
            });
        }
        // Step 3: Insert valid data
        for (const data of datas) {
            const extensionId = 0;
            const employeeID = data.employeeID || null;
            const searchText = data.extension || null;
     
            if (employeeID != null) {
                hierarchy = await config.hierarchy(employeeID);
                status = 1;
            
                let unassignedHierarchy = await config.UnassignedHeirarchy(); // Fetch unassigned hierarchy
            
                if (!hierarchy || hierarchy.divisionId === unassignedHierarchy.divisionId) {
                    hierarchy = unassignedHierarchy;
                    divisionId = hierarchy.divisionId;
                    await config.addHeirarchyForEmployee(divisionId, employeeID);
                    status = 2;
                } else {
                    divisionId = hierarchy.divisionId;
                }
            } else {
                hierarchy = await config.UnassignedHeirarchy();
                divisionId = hierarchy.divisionId;
                status = 2;
            }
            
            Data = await config.addExtensionMapping(extensionId, divisionId, employeeID, searchText, adminUserId, status);
        }
        res.status(200).json({ status: true, message: "success",Data });
    } catch (err) {
        console.error("Error in ExtensionfileUpload:", err);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};
exports.IsExtensionExists = async(req,res,next)=>{
    try{
        const extension = req.body.extensionNumber;
        const isExtensionValid = await config.isExtensionExist(extension);
        if (isExtensionValid>=1) {
            return res.status(200).json({
                status: "exists",
                message: "Extensions already exist"
            });
        }
        res.status(200).json({ status: true, message: "success" });
    }catch(err){
        console.error("Error in ExtensionMapping:", err);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
}
exports.updateFileUploadedExtension = async(req,res,next)=>{
    try{    
   const {  datas, adminUserId } = req.body;
   let response = "";
   let validateEmpID="";
   let employeeArray=[];
   let heirarchy = await config.UnassignedHeirarchy();
   if (!heirarchy || !heirarchy.divisionId) {
       throw new Error("Invalid hierarchy data");
   }
   for (let i = 0; i < datas.length; i++) {
    const data = datas[i];
    const employeeID = data.employeeID || null;
    const extension = data.extension || null;
     response = await config.updateExtension(employeeID,extension); 
    }
        res.status(200).json({ status: true,message:"success"});
    }catch(err){
        console.log(err);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
}

