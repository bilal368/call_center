
let log = require("log4js").getLogger("Roles And Privileges");
const rolesAndPriv = require('../model/rolesAndPriv')
const rolesAndPrivModel = rolesAndPriv.rolesAndPrivileges

exports.saveRolesAndPrivileges = async (req, res) => {
    try {
      // Validate input data
      if (!Array.isArray(req.body) || req.body.length === 0) {
        throw new Error("Invalid request body. Expected an array of features.");
      }
  
      // Validate each feature in the array
      req.body.forEach((feature) => {
        if (!feature.type || !["user", "group"].includes(feature.type)) {
          throw new Error(
            `Invalid feature type '${feature.type}'. Must be 'user' or 'group'.`
          );
        }
  
        if (feature.type === "user" && !feature.id) {
          throw new Error("Missing Id for user feature.");
        }
  
        if (feature.type === "group" && !feature.groupName) {
          throw new Error("Missing groupName for group feature.");
        }
  
        if (!feature.privileageData) {
          // throw new Error("Missing privilegeData for feature.");
        }
      });
  
      // Update roles and privileges
     // Update roles and privileges
    for (const feature of req.body) {
      const queryString = await createQueryString(feature.hierarchy);
      if (feature.privileageData) {
        // Only include privilegeData if it exists
        const packageFeatureTabPermissionId = feature.privileageData.join(",");

        if (feature.type === "user") {
          await rolesAndPrivModel.updateUserPrivileges(
            feature.id,
            packageFeatureTabPermissionId,
            queryString
          );
        } else {
          await rolesAndPrivModel.updateRolePrivileges(
            feature.groupName,
            packageFeatureTabPermissionId,
            queryString
          );
        }
      } else {
        // Update only with queryString if privilegeData is not found
        if (feature.type === "user") {
          await rolesAndPrivModel.updateUserPrivileges(
            feature.id,
            null, // No privilege data
            queryString
          );
        } else {
          await rolesAndPrivModel.updateRolePrivileges(
            feature.groupName,
            null, // No privilege data
            queryString
          );
        }
      }
    }

      const response = { message: "Features successfully updated." };
      res.status(200).json({ status: true, statusText: response });
    } catch (err) {
      console.error("Error:", err);
      log.error(err);
      res
        .status(500)
        .json({ status: false, statusText: "Error updating features." });
    }
  };
  //for creating query for accessPermission
  async function createQueryString(hierarchy) {
    let queryParts = [];
  
    for (let key in hierarchy) {
      if (hierarchy.hasOwnProperty(key)) {
        const ids = hierarchy[key].filter(id => id !== undefined); // Remove undefined values
  
        if (ids.length > 0) {
          queryParts.push(`${key} IN(${ids.join(",")})`);
        }
      }
    }
  
    return queryParts.join(" AND ");
  }
  
  
  exports.getPrivileages = async (req, res, next) => {
    try {
      const data = await rolesAndPrivModel.getPrivileages(3);
      const transformedData = transformData(data);
      return res.status(200).json({ data: transformedData });
    } catch (err) {
      console.log("err:", err);
      log.error(err);
      return res.status(400).json({ status: false, error: err });
    }
  };
  function transformData(inputData) {
    const transformedData = {};
  
    inputData.forEach((item) => {
      const {
        licenseName,
        packageName,
        basicFeatureName,
        basicFeatureTabName,
        packageFeatureTabPermissionId,
        basicAccessPermissionName,
      } = item;
  
      // Ensure license node exists
      if (!transformedData[licenseName]) {
        transformedData[licenseName] = {};
      }
  
      // Handle packages within licenses (nested objects)
      let currentLevel = transformedData[licenseName];
      if (packageName) {
        currentLevel[packageName] = currentLevel[packageName] || {};
        if (basicFeatureName) {
          if (basicFeatureTabName) {
            currentLevel[packageName][basicFeatureName] =
              currentLevel[packageName][basicFeatureName] || {};
            currentLevel[packageName][basicFeatureName][basicFeatureTabName] =
              currentLevel[packageName][basicFeatureName][basicFeatureTabName] ||
              {};
            if (basicAccessPermissionName) {
              currentLevel[packageName][basicFeatureName][basicFeatureTabName][
                basicAccessPermissionName
              ] = packageFeatureTabPermissionId;
            } else {
              currentLevel[packageName][basicFeatureName][basicFeatureTabName] =
                packageFeatureTabPermissionId;
            }
          } else {
            if (basicAccessPermissionName) {
              currentLevel[packageName][basicFeatureName] =
                currentLevel[packageName][basicFeatureName] || {};
              currentLevel[packageName][basicFeatureName][
                basicAccessPermissionName
              ] = packageFeatureTabPermissionId;
            } else {
              currentLevel[packageName][basicFeatureName] =
                packageFeatureTabPermissionId;
            }
          }
        } else {
          currentLevel[packageName] = packageFeatureTabPermissionId;
        }
      } else {
        if (basicFeatureName) {
          if (basicFeatureTabName) {
            currentLevel[basicFeatureName] = currentLevel[basicFeatureName] || {};
            currentLevel[basicFeatureName][basicFeatureTabName] =
              currentLevel[basicFeatureName][basicFeatureTabName] || {};
            if (basicAccessPermissionName) {
              currentLevel[basicFeatureName][basicFeatureTabName][
                basicAccessPermissionName
              ] = packageFeatureTabPermissionId;
            } else {
              currentLevel[basicFeatureName][basicFeatureTabName] =
                packageFeatureTabPermissionId;
            }
          } else {
            if (basicAccessPermissionName) {
              currentLevel[basicFeatureName] =
                currentLevel[basicFeatureName] || {};
              currentLevel[basicFeatureName][basicAccessPermissionName] =
                packageFeatureTabPermissionId;
            } else {
              currentLevel[basicFeatureName] = packageFeatureTabPermissionId;
            }
          }
        } else {
          currentLevel[licenseName] = packageFeatureTabPermissionId;
        }
      }
    });
  
    return transformedData;
  }
  
  exports.getPrivileagesIdofOne = async (req, res) => {
    try {
      // checking body is containing user/group
      let body = req.body;
      if (body.user) {
        let userData = await rolesAndPrivModel.findByUserId(body.user);
        if (
          userData[0].packageFeatureTabPermissionIds?.length > 0 ||
          userData[0].packageFeatureTabPermissionIds != null
        ) {
          let privilegeArray = JSON.parse(
            userData[0].packageFeatureTabPermissionIds
          );
          return res
            .status(200)
            .json({
              status: true,
              statusText: "Data fetched",
              privileageOfOne: privilegeArray,
            });
        } else {
          return res
            .status(404)
            .json({ status: false, statusText: "No data found" });
        }
      }
      if (body.group) {
        let groupData = await rolesAndPrivModel.findBygroupName(body.group);
  
        if (
          groupData[0].packageFeatureTabPermissionIds.length > 0 ||
          groupData[0].packageFeatureTabPermissionIds != null
        ) {
          let privilegeArray = JSON.parse(
            groupData[0].packageFeatureTabPermissionIds
          );
          return res
            .status(200)
            .json({
              status: true,
              statusText: "Data fetched",
              privileageOfOne: privilegeArray,
            });
        } else {
          return res
            .status(404)
            .json({ status: false, statusText: "No data found" });
        }
      }
    } catch (error) {
      log.error(err);
      console.log(err);
      return res.status(500).json({
        status: false,
        statusText: "Data Fetching Failed",
        error: error.message,
      });
    }
  };
  exports.getUsersByRoleGroups = async (req, res, next) => {
    try {
      const users = await rolesAndPrivModel.getUsersByRole();
  
      // Handle successful retrieval and response
      const arrayOfUsers = {};
      users.forEach((user) => {
        const role = user.roleName;
        const featuresRole = user?.featuresRole?.split(",").map(Number);
        const accessPermissionRole = user.accessPermissionQueryFilterRole;
  
        // Initialize role if it does not exist
        if (!arrayOfUsers[role]) {
          let data;
          accessPermissionRole?data=`[${accessPermissionRole}]`:data=null
          arrayOfUsers[role] = {
            featuresRole: featuresRole || [],
            accessPermission: data,
            users: user.userId ? [] : null, // Set to null if no users
          };
        }
  
        // Add user details if user exists
        if (user.userId) {
          const featuresUser  = user?.featuresUser ?.split(",").map(Number);
          const accessPermissionUser  = user.accessPermissionQueryFilterUser ;
          let data;
          accessPermissionUser?data=`[${accessPermissionUser}]`:data=null
          arrayOfUsers[role].users.push({
            name: `${user.firstname} ${user.lastname}`,
            userId: user.userId,
            accessPermission: data,
            features: featuresUser  || [],
          });
        }
      });
  
      return res
        .status(200)
        .json({ status: true, statusText: "Data fetched", data: arrayOfUsers });
    } catch (error) {
      console.error("Error retrieving users:", error);
      log.error(error);
      let statusCode = 500;
      let errorMessage = "Internal server error";
      if (error.message.includes("Not Found")) {
        statusCode = 404;
        errorMessage = "Data not found";
      } else if (error.message.includes("Validation")) {
        statusCode = 400;
        errorMessage = "Invalid data provided";
      }
      return res.status(statusCode).json({ status: false, error: errorMessage });
    }
  };
  
  exports.getDataforDataRestrictions = async (req, res, next) => {
    try {
      // Fetch data
      const data = await rolesAndPrivModel.getDataforDataRestrictions();
      const { locations, departments, divisions, extension } = data;
  
      // Build JSON structure
      const hierarchy = locations.map((loc) => {
        const location = {
          locationId: loc.locationId,
          locationName: loc.locationName,
          departments: departments
            .filter((dept) => dept.locationId === loc.locationId)
            .map((dept) => {
              const department = {
                departmentId: dept.departmentId,
                departmentName: dept.departmentName,
                divisions: divisions
                  .filter((div) => div.departmentId === dept.departmentId)
                  .map((div) => {
                    const division = {
                      divisionId: div.divisionId,
                      divisionName: div.divisionName,
                      extension: extension
                        .filter((emp) => emp.divisionId === div.divisionId)
                        .map((emp) => ({
                          extension: emp.extensionNumber,
                          extensionNumber: emp.extensionNumber,
                        })),
                    };
                    return division;
                  }),
              };
              return department;
            }),
        };
        return location;
      });
  
      const result = [];
      // Loop through each location object in the response
      for (const location of hierarchy) {
        const locationObj = {
          item: location.locationName,
          locationId: location.locationId,
          children: [],
        };
  
        // Loop through each department within the location
        for (const department of location.departments) {
          const departmentObj = {
            item: department.departmentName,
            departmentId: department.departmentId,
            children: [],
          };
  
          // Loop through each division within the department
          for (const division of department.divisions) {
            const divisionObj = {
              item: division.divisionName,
              divisionId: division.divisionId,
              children: division.extension.map((emp) => ({
                item: emp.extension,
                extensionNumber: parseInt(emp.extensionNumber),
              })),
            };
  
            departmentObj.children.push(divisionObj);
          }
  
          locationObj.children.push(departmentObj);
        }
  
        result.push(locationObj);
      }
  
      return res.status(200).json({
        status: true,
        statusText: "Data Fetched Successfully",
        Data: result,
      });
    } catch (error) {
      console.error(error);
      log.error(err);
      return res.status(500).json({
        status: false,
        statusText: "Data Fetching Failed",
        error: error.message,
      });
    }
  };