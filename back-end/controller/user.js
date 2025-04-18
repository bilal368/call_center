var log = require("log4js").getLogger("User Actions");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const user = require("../model/user");
const userModel = user.login;
const ldapObj = require("../model/ldap");
const ldapModel = ldapObj.ldap;
const moment = require("moment");
const validator = require("validator");
const io = require("../socket");
const redisClient = require("../redisconnection");
const ldap = require('ldapjs');
const audit = require("../auditTrail");

const key = process.env.USER_LOGIN_REDIS_KEY; // Key where data will be stored



function userLoginRedis(key, field, userLoginDetails) {
  return new Promise((resolve, reject) => {
    // Save the user login details in Redis
    redisClient.hset(
      key,
      field,
      JSON.stringify(userLoginDetails),
      (err, result) => {
        if (err) {
          console.error("Error saving user login details:", err);
          return reject(err); // Reject the promise on error
        }
        resolve(result); // Resolve the promise on success
      }
    );
    
    io.emit("logIn", userLoginDetails.Username);
  });
}

function validationForUser(data) {
  const {
    firstname,
    lastname,
    primaryEmail,
    phone,
    roleId,
    designation,
    employeeID,
  } = data;

  // Validation functions
  const isNotEmpty = (value) => value !== null && value !== "";
  const isValidPhone = (phone) => /^\+?[0-9]{7,15}$/.test(phone);
  // const isValidExtension = (extension) => /^[0-9]{4,6}$/.test(extension);
  const isValidDesignation = (designation) => designation.length < 20;
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Validation errors
  const errors = [];

  if (!isNotEmpty(firstname)) {
    errors.push({ field: "firstname", message: "firstname must be non-empty" });
  }
  if (!isNotEmpty(lastname)) {
    errors.push({ field: "lastname", message: "Last name must be non-empty" });
  }
  if (!isNotEmpty(primaryEmail) || !isValidEmail(primaryEmail)) {
    errors.push({
      field: "primaryEmail",
      message: "Primary email must be valid and non-empty",
    });
  }
  if (!isNotEmpty(phone) || !isValidPhone(phone)) {
    errors.push({
      field: "phone",
      message:
        "Phone number must be 7-15 digits",
    });
  }

  if (!isNotEmpty(roleId)) {
    errors.push({ field: "roleId", message: "Role ID must be non-empty" });
  }
  if (!isNotEmpty(designation) || !isValidDesignation(designation)) {
    errors.push({
      field: "designation",
      message: "Designation must be less than 20 characters",
    });
  }
  if (!isNotEmpty(employeeID)) {
    errors.push({
      field: "employeeID",
      message: "Employee ID must be non-empty",
    });
  }

  if (errors.length > 0) {
    return errors;
  }
  return [{ field: "", message: "" }];
}
function validationForEmployee(data, type) {
  const {
    userId,
    // username,
    firstname,
    primaryEmail,
    employeeID,
  } = data;

  // Validation functions
  const isNotEmpty = (value) => value !== null && value !== "";
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Validation errors
  const errors = [];

  if (!isNotEmpty(firstname)) {
    errors.push({
      field: "firstname",
      message: "First name must be non-empty",
    });
  }
  if (!isNotEmpty(primaryEmail) || !isValidEmail(primaryEmail)) {
    errors.push({
      field: "primaryEmail",
      message: "Primary email must be valid and non-empty",
    });
  }


  const IsempId = userModel.employeeIDisExist(employeeID);
  if (!IsempId) {
    errors.push({
      field: "employeeID",
      message: "This Employee ID is already in use. Please enter a unique ID",
    });
  }
  if (!isNotEmpty(employeeID)) {
    errors.push({
      field: "employeeID",
      message: "Employee ID must be non-empty",
    });
  }
  if (errors.length > 0) {
    return errors;
  }
  return [{ field: "", message: "" }];
}


function validationinsertEmployee(data, type) {
  const {
    firstname,
    primaryEmail,
    employeeID,
  } = data;

  // Validation functions
  const isNotEmpty = (value) => value !== null && value !== "";
  const isInteger = (value) => Number.isInteger(Number(value));
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Validation errors
  const errors = [];

  if (!isNotEmpty(firstname)) {
    errors.push({
      field: "firstname",
      message: "First name must be non-empty",
    });
  }
  if (!isNotEmpty(primaryEmail) || !isValidEmail(primaryEmail)) {
    errors.push({
      field: "primaryEmail",
      message: "Primary email must be valid and non-empty",
    });
  }
  const IsempId = userModel.employeeIDisExist(employeeID);
  if (!IsempId) {
    errors.push({
      field: "employeeID",
      message: "This Employee ID is already in use. Please enter a unique ID",
    });
  }
  if (!isNotEmpty(employeeID)) {
    errors.push({
      field: "employeeID",
      message: "Employee ID must be non-empty",
    });
  }
  if (errors.length > 0) {
    return errors;
  }
  return [{ field: "", message: "" }];
}

async function handleError(res, err) {
  console.error("Error retrieving users:", err);
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
//#region login new
// Main login function
exports.login = async (req, res, next) => {

  let clientIp = req.headers['x-forwarded-for']?.split(',')[0]  // Proxy IP
    || req.socket?.remoteAddress                    // Direct socket IP
    || req.connection?.remoteAddress;               // Fallback

  // Handle IPv4-mapped IPv6 (e.g., ::ffff:192.168.2.95 -> 192.168.2.95)
  if (clientIp && clientIp.startsWith("::ffff:")) {
    clientIp = clientIp.split("::ffff:")[1];
  }

  console.log("Client IP:", clientIp);

  const { userName, password, concurrentLogin } = req.body;
  const isLDAPauthentication = true;
  const user = await userModel.getUserData(userName);
  // const formattedLoginTime = moment().format('YYYY-MM-DD HH:mm:ss');
  // Get the system's local time zone dynamically
  // Get current time in UTC
  const formattedLoginTime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
  console.log('UTC Time for login:', formattedLoginTime);


  if (!user) {

    await logInvalidLoginAttempt(0, 'Invalid Users', formattedLoginTime, clientIp);
    return res.status(401).send({ status: false, statusText: "Invalid username or password" });
  }
  const userId = user.userId;
  // Assuming tabIdUser and tabIdRole are comma-separated strings
  let tabIdUserArray = user?.tabIdUser ? user.tabIdUser.split(",") : [];
  let tabIdRoleArray = user?.tabIdRole ? user.tabIdRole.split(",") : [];
  // Combine arrays and remove duplicates efficiently
  let combinedPackageID = [...new Set(tabIdUserArray.concat(tabIdRoleArray))];
  combinedPackageID = combinedPackageID.map((str) => +str);


  if (isLDAPauthentication) {
    // When LDAP authentication is ON
    const isLDAPuser = await userModel.findUserByLDAP(userName);

    if (!isLDAPuser) {

      // User not found in LDAP, use DB login
      return await dbLogin(req, res, next, user, formattedLoginTime, clientIp); // Call the dbLogin function
    } else {
      // User found in LDAP, use LDAP login
      return await LDAPLogin(userName, concurrentLogin, password, res, user, userId, formattedLoginTime, combinedPackageID, clientIp,); // Ensure this function handles the response
    }
  } else {
    // When LDAP authentication is OFF, use DB login
    return await dbLogin(req, res, next, user, formattedLoginTime, clientIp);
  }
};

// Database login function
const dbLogin = async (req, res, next, user, formattedLoginTime, clientIp) => {

  const { userName, password, concurrentLogin } = req.body;
  try {
    const userId = user.userId;
    const combinedPackageID = getCombinedPackageID(user.tabIdUser, user.tabIdRole);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid && user.username.toLowerCase() === userName.toLowerCase()) {
      const isResponseSent = await handleConcurrentLogin(user, concurrentLogin, userId, formattedLoginTime, clientIp, res);
      // Only proceed if no response has been sent
      if (isResponseSent) {
        return; // Exit the function if a response has already been sent
      }
      // User found and password is valid, proceed with login
      return await handleSuccessfulLogin(user, userId, formattedLoginTime, combinedPackageID, clientIp, res);
    } else {
      return await handleFailedLogin(res, user, userId, formattedLoginTime, clientIp);
    }
  } catch (err) {
    console.error(err);
    log.error(err);
    return res.status(500).send({ status: false, statusText: "Internal Server Error" });
  }
};
// LDAP login function
const LDAPLogin = async (username, concurrentLogin, password, res, user, userId, formattedLoginTime, combinedPackageID, clientIp) => {
  // use db LDAP Login
  const [[ldapDet]] = await ldapModel.getLdapCredential(); //fetch ldap Details in db
  const ldapDomain = ldapDet.domainName;
  const systemIP = ldapDet.serverIP;
  // Check if all required fields are provided
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide ldapDomain, username, and password.'
    });
  }

  const client = ldap.createClient({
    url: `LDAP://${systemIP}`
  });
  const ldapUser = `${username}@${ldapDomain}`
  try {
    const isAuthenticated = await new Promise((resolve, reject) => {
      client.bind(ldapUser, password, (err) => {
        if (err) {

          if (err.name === 'InvalidCredentialsError') {
            resolve(false); // Invalid credentials
          } else {
            console.error(`An error occurred Step1: ${err.message}`);
            reject(err); // Other errors (network, etc.)
          }
        } else {
          resolve(true); // Authentication successful
        }

        client.unbind((unbindErr) => {
          if (unbindErr) {
            console.error('Error unbinding LDAP client:', unbindErr);
          }
        });
      });
    });

    if (isAuthenticated) {
      const isResponseSent = await handleConcurrentLogin(user, concurrentLogin, userId, formattedLoginTime, clientIp, res);
      // Only proceed if no response has been sent
      if (isResponseSent) {
        return; // Exit the function if a response has already been sent
      }
      return await handleSuccessfulLogin(user, userId, formattedLoginTime, combinedPackageID, clientIp, res);

    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `An error occurred Step2: ${error.message}`
    });
  }
};
const handleFailedLogin = async (res, user, userId, formattedLoginTime, clientIp) => {
  if (user.retryCount >= 3) {
    // insert login track details
    await userModel.insertLoginTrackDetails(userId,
      'Account Locked',
      formattedLoginTime,                 //loginTime
      null,                 //logoutTime
      clientIp    //ipAddress     
    )
    res
      .status(429)
      .send({
        status: false,
        statusText:
          "Your password attempts have exceeded the limit. Please contact administrator to regain access",
      });
    return;
  } else {
    await userModel.setRetryCount(userId, "");
    await userModel.insertLoginTrackDetails(userId,
      'Invalid Users',
      formattedLoginTime,                 //loginTime
      null,                 //logoutTime
      clientIp    //ipAddress     
    )
    res
      .status(401)
      .send({ status: false, statusText: "Invalid username or password" });
    return;

  }
};
// Helper functions
const logInvalidLoginAttempt = async (userId, status, loginTime, ipAddress) => {
  await userModel.insertLoginTrackDetails(userId, status, loginTime, null, ipAddress);
};

const getCombinedPackageID = (tabIdUser, tabIdRole) => {
  const tabIdUserArray = tabIdUser ? tabIdUser.split(",") : [];
  const tabIdRoleArray = tabIdRole ? tabIdRole.split(",") : [];
  return [...new Set([...tabIdUserArray, ...tabIdRoleArray])].map(Number);
};
const handleConcurrentLogin = async (user, concurrentLogin, userId, formattedLoginTime, clientIp, res) => {
  if (user.isLoggedIn == 1 && concurrentLogin !== "YES") {
    if (concurrentLogin === "NO") {
      await logInvalidLoginAttempt(userId, 'Concurrent Login Denied', formattedLoginTime, clientIp);
      console.log(`Login attempt denied for user ${userId} due to concurrent login restrictions.`);
      res.status(403).send({ status: false, statusText: "Denied login due to concurrent login restrictions." });
      return true; // Indicate that a response has been sent
    } else {
      console.log(`User  ${userId} is already logged in from another device.`);
      res.status(409).send({
        status: false,
        statusText: "The user has logged in from another device. Click 'confirm' to enforce the login",
      });
      return true; // Indicate that a response has been sent
    }
  }
  return false; // Indicate that no response was sent
};

const handleSuccessfulLogin = async (user, userId, formattedLoginTime, combinedPackageID, clientIp, res) => {
  if (user.retryCount >= 3) {
    await logInvalidLoginAttempt(userId, 'Account Locked', formattedLoginTime, clientIp);
    return res.status(429).send({ status: false, statusText: "Your password attempts have exceeded the limit. Please contact administrator to regain access" });
  }
  await userModel.updateLoginTrackDetails(userId,
    formattedLoginTime                 //logoutTime
  )
  await userModel.updateIsLoggedIn(userId, 1);
  await userModel.setRetryCount(user.username, 'Reset');
  await removeTokenFromRedis(userId);
  await logoutRedisUpdate(user.username);
  await logoutUsingSocket(userId);

  await generateToken(user, combinedPackageID, userId, formattedLoginTime, clientIp, res);
  // await storeTokenIn
};
const generateToken = async (result, combinedPackageID, userId, formattedLoginTime, clientIp, res) => {
  const expiresIN = "10h";
  const tokenExpirySeconds = 360000; // 10 hours in seconds (for redis)
  const languageFileName = await userModel.getLanguageFileNameById(
    result.languageId
  );
  const token = jwt.sign(
    {
      userName: result.username,
      userId: result.userId,
      languageFileName: languageFileName,
      combinedPackageID: combinedPackageID,
      roleId: result.roleId,
      userHierarchyId: result.userHierarchyId,
    }, //storing package id in token
    process.env.JWT_SECRET,
    { expiresIn: expiresIN }
  );
  // Store the token in Redis with an expiry time
  await redisClient.set(
    `token:${userId}`,
    token,
    "EX",
    tokenExpirySeconds,
    (err, result) => {
      if (err) {
        console.error("Error storing token in Redis:", err);
      } else {
        console.log(
          `Token for ${userId} stored in Redis with a ${expiresIN} expiry.`
        );
      }
    }
  );

  await userModel
    .insertToken(token, result.username)

    .then(async () => {
      const currentTime = new Date().toLocaleString("en-GB", {
        timeZone: "UTC",
        hour12: true,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const userLoginDetails = {
        Username: result.username, // Example username
        IPAddress: clientIp, // Automatically retrieve system IP address
        LoginTime: currentTime, // Current date and time in UTC as login time
        LogoutTime: null,
        StatusCode: "Authenticated", // Example status code
      };

      // Create a unique field for the hash, e.g., using Username and LoginTime
      const field = `${userLoginDetails.Username}${userLoginDetails.LoginTime}`;

      // Call the login function
      userLoginRedis(key, field, userLoginDetails)
        .then((result) => { })
        .catch((err) => {
          console.error("Failed to save user login details:", err);
        });
      await userModel.insertLoginTrackDetails(userId,
        'Authenticated',
        formattedLoginTime,                 //loginTime
        null,                 //logoutTime
        clientIp    //ipAddress     
      )
      res.status(200).json({
        token,
        status: true,
        statusText: "Login Successfully",
      });
    })
    .catch((err) => {
      console.error(
        "Error during token insertion or fetching language:",
        err
      );
      res
        .status(500)
        .json({ status: false, statusText: "Internal Server Error" });
    });
};
//#endregion



async function logoutUsingSocket(userId) {
  io.emit("logout", userId);
}
async function removeTokenFromRedis(userId) {
  // Construct the token key based on userId
  const tokenKey = `token:${userId}`;
  // Delete the token key from Redis
  await redisClient.del(tokenKey, (err, result) => {
    if (err) {
      console.error("Error deleting token:", err);
    } else if (result === 1) {
      console.log(`Token for user ${userId} successfully deleted.`);
    } else {
      console.log(`Token for user ${userId} does not exist.`);
    }
  });
}
// update redis when logout for Dashboard
async function logoutRedisUpdate(targetUsername) {
  try {
    if (!redisClient) {
      console.error("❌ Redis client is not initialized.");
      return { success: false, message: "Redis client not available." };
    }
    const userKeys = await redisClient.hkeys(key);

    let targetKey = null;
    let userData = null;

    for (const field of userKeys) {
      const userDataJson = await redisClient.hget(key, field);
      if (!userDataJson) continue;

      userData = JSON.parse(userDataJson);
      if (userData.Username === targetUsername && userData.LogoutTime == null) {
        targetKey = field;
        break;
      }
    }

    if (targetKey && userData) {
      const currentTime = new Date().toLocaleString("en-GB", {
        timeZone: "UTC",
        hour12: true,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const updatedUserData = {
        ...userData,
        LogoutTime: currentTime,
      };

      await redisClient.hset(key, targetKey, JSON.stringify(updatedUserData));
      return { success: true, message: "✅ LogoutTime updated successfully." };
    } else {
      console.log("ℹ️ Username not found or already logged out.");
      return { success: true, message: "Username not found or already logged out." };
    }
  } catch (err) {
    console.error("❌ Error in logoutRedisUpdate:", err);
    return { success: false, message: "Internal Server Error", error: err.message };
  }
}

exports.logOut = async (req, res, next) => {
  const { userId, userName } = req.body;
  if (!userId || !userName) {
    return res
      .status(400)
      .json({ status: false, statusText: "Inputs required" });
  }
  try {
    const result = await userModel.updateIsLoggedIn(userId, 0);
    await removeTokenFromRedis(userId);
    // Call the updated logoutRedisUpdate function
    const redisUpdateResult = await logoutRedisUpdate(userName);

    if (!redisUpdateResult.success) {
      console.error('error', redisUpdateResult.message);
      return res
        .status(404)
        .json({ status: false, statusText: redisUpdateResult.message });
    }

    // Format loginTime to MySQL datetime format
    const formattedLogoutTime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
    // const formattedLogoutTime = moment().format('YYYY-MM-DD HH:mm:ss');
    await userModel.updateLoginTrackDetails(userId,
      formattedLogoutTime                 //logoutTime
    )
    return res
      .status(200)
      .json({ status: true, statusText: "Successfully logged out" });
  } catch (error) {
    console.error("Error during logout:", error);
    log.error(error);
    return res
      .status(500)
      .json({ status: false, statusText: "An error occurred during logout" });
  }
};
exports.unLockUser = async (req, res, next) => {
  const { userId } = req.body;
  if (!userId) {
    return res
      .status(400)
      .json({ status: false, statusText: "userId is required" });
  }
  try {
    const result = await userModel.unLockUser(userId);
    if (result.changedRows) {
      return res
        .status(200)
        .json({ status: true, statusText: "Successfully unlocked user" });
    } else {
      return res
        .status(400)
        .json({ status: false, statusText: "Error during unlock user" });
    }
  } catch (error) {
    console.error("Error during unlock user:", error);
    log.error(error);
    return res
      .status(500)
      .json({ status: false, statusText: "Error during unlock user" });
  }
};
exports.languages = async (req, res) => {
  try {
    const data = await userModel.fecthuserlanguages();
    if (data.length > 0) {
      return res.status(200).json({
        status: true,
        statusText: "Data Fetched Successfully",
        Data: data,
      });
    } else {
      return res.status(404).json({
        status: false,
        statusText: "No Data Found",
        Data: [],
      });
    }
  } catch (err) {
    console.error("Error fetching languages:", err);
    log.error(err);
    return res.status(500).json({
      status: false,
      statusText: "Internal Server Error",
      error: err.message,
    });
  }
};

exports.UpdateUserlanguage = async (req, res) => {
  try {
    const { userId, languageId } = req.body;
    // console.log(req.body);

    const data = await userModel.Updateuserlanguage(userId, languageId);
    if (data.affectedRows > 0) {
      return res.status(200).json({
        status: true,
        message: "User Language Successfully Updated",
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "No Data Found",
        Data: [],
      });
    }
  } catch (err) {
    console.error("Error fetching languages:", err);
    log.error(err);
    return res.status(500).json({
      status: false,
      statusText: "Internal Server Error",
      error: err.message,
    });
  }
};
function sendPasswordResetEmail(primaryEmail, token) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "nodetest0097@gmail.com",
      pass: "jpgk ozgn fesc dpup",
    },
  });
  const mailOptions = {
    from: "nodetest0097@gmail.com",
    to: primaryEmail,
    subject: "Password Reset",
    html: `
      <p>Click the following link to reset your password:</p>
      <p><a href="http://your-frontend-url/resetPassword/${token}">Reset Password</a></p>
    `,
  };
  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.error(error);
      log.error(err);
      res.status(401).send({
        status: false,
        statusText: "An error occurred during mail sent",
      });
    } else {
      res
        .status(200)
        .json({ status: true, statusText: "Email sent successfully" });
    }
  });
}
// password reset
exports.forgotPassword = async (req, res) => {
  const primaryEmail = req.body.email;
  // Retrieves user information by primary email
  const users = await userModel.getUserByEmail(primaryEmail);
  if (!users) {
    return res
      .status(404)
      .json({ status: false, statusText: "No user found for this email" });
  }
  const token = crypto.randomBytes(32).toString("hex"); // Generate a unique token
  await userModel.updateUserToken(primaryEmail, token);
  console.log(token);

  sendPasswordResetEmail(primaryEmail, token);
  res.status(200).json({ status: true, statusText: "Email sent successfully" });
};
// update password using the token
exports.updateResetPassword = async (req, res) => {
  const { newToken, password } = req.body;

  try {
    const user = await userModel.getUserByToken(newToken); // Check if the token exists in the database
    if (!user) {
      return res
        .status(401)
        .json({ status: false, statusText: "Unauthorized access" });
    }
    const newPassword = await bcrypt.hash(password, 10); // Update the user's password (hash the password in a real application)
    const status = await userModel.updatePasswordAndToken(
      user.primaryEmail,
      newPassword,
      newToken
    );
    if (status[0].affectedRows != 0) {
      res
        .status(200)
        .json({ status: true, statusText: "Password updated successfully" });
    } else {
      res
        .status(401)
        .json({ status: false, statusText: "Error when updating password" });
    }
  } catch (error) {
    console.error("Error when updating password:", error);
    log.error(error);
    res
      .status(401)
      .send({ status: false, statusText: "Error when updating password " });
  }
};
exports.insertUsergroups = async (req, res) => {
  try {
    const { roleName } = req.body;
    const adminUserId = req.body.adminUserId

    const currentDate = moment().format("YYYY/MM/DD HH:mm:ss");
    let status;
    const roleNameexist = await userModel.roleExist()

    if (checkRoleExists(roleName)) {
      return res
        .status(400)
        .json({ status: false, statusText: "Group name already exists" });
    }
    //funtion to check user group name already exist
    function checkRoleExists(roleToCheck) {
      return roleNameexist.some(roleNameexist => roleNameexist.roleName === roleToCheck);
    }



    // Insert user group if roleName does not exist
    const result = await userModel.insertUserGroup(
      roleName,
      adminUserId
    );
    if (result != undefined) {
      res
        .status(200)
        .json({ status: true, statusText: "User group inserted successfully" });
    } else {
      res
        .status(500)
        .json({ status: false, statusText: "Failed to insert user group" });
    }
  } catch (error) {
    console.error("Error inserting user group:", error);
    // log.error(err);
    res
      .status(500)
      .json({ status: false, statusText: "Failed to insert user group" });
  }
};

exports.getUsergroups = async (req, res) => {

  const { adminUserId } = req.body
  try {
    const userGroups = await userModel.getUsergroups(adminUserId);
    const roleIds = userGroups.map((group) => group.roleId); // Log the roleIds array
    res.status(200).json({ status: true, groups: userGroups });
  } catch (error) {
    console.error("Error fetching user groups:", error);
    // log.error(err);
    res
      .status(500)
      .json({ status: false, statusText: "Failed to fetch user groups" });
  }
};
exports.getUsergroupsAlert = async (req, res) => {

  const { adminUserId } = req.body
  try {
    const userGroups = await userModel.getUsergroupsAlert(adminUserId);
    const roleIds = userGroups.map((group) => group.roleId); // Log the roleIds array
    res.status(200).json({ status: true, groups: userGroups });
  } catch (error) {
    console.error("Error fetching user groups:", error);
    // log.error(err);
    res
      .status(500)
      .json({ status: false, statusText: "Failed to fetch user groups" });
  }
};
exports.updateUsergroups = async (req, res) => {
  try {
    const { roleId, roleName, adminUserId } = req.body;
    const updatedUserGroup = await userModel.updateUsergroup(roleId, roleName, adminUserId);

    if (updatedUserGroup && updatedUserGroup != undefined) {
      res.status(200).json({
        status: true,
        statusText: " updated user group",
        updatedUserGroups: updatedUserGroup,
      });
    } else {
      res
        .status(500)
        .json({ status: false, statusText: "Failed to update user group" });
    }
  } catch (error) {
    console.error("Error updating user group:", error);
    log.error(err);
  }
};
exports.deleteUsergroups = async (req, res) => {
  try {
    const { roleId, adminUserId } = req.body;
    const roleIds = Array.isArray(roleId) ? roleId : [roleId];
    // console.log(req.body,'body');
    const usersExistInRoles = [];
    const deletedRoles = []
    for (const roleId of roleIds) {
      const isUsersHave = await userModel.userFound(roleId);

      if (isUsersHave) {
        usersExistInRoles.push(roleId);
      } else {
        const deletedUserGroup = await userModel.deleteUsergroup(roleId, adminUserId);
        if (deletedUserGroup) {
          deletedRoles.push(roleId);
        }
      }
    }

    // If any roles contain users, return an error response
    if (usersExistInRoles.length > 0) {
      return res.status(400).json({
        status: false,
        statusText: `User group cannot be deleted as users exist in the group.`,
        affectedRoles: usersExistInRoles
      });
    }

    // Otherwise, return success response
    return res.status(200).json({
      status: true,
      statusText: `User groups deleted successfully.`,
      deletedRoles
    });

  } catch (error) {
    console.error("Error deleting user group:", error);
    // log.error(err);
    res
      .status(500)
      .json({ status: false, statusText: "Failed to delete user group" });
  }
};
exports.insertUsers = async (req, res) => {
  console.log(req.body);

  try {
    // let hashedPassword = await bcrypt.hash("Admin@123", 10);
    const isValidExtension = (extension) => /^[0-9]{4,6}$/.test(extension);

    isValidationStatus = await validationForUser(req.body);

    if (isValidationStatus[0].message != "") {
      return res
        .status(400)
        .json({ status: false, statusText: isValidationStatus });
    }
    // let agnetcode=null
    const {
      //  element.firstname,
      //       element.middlename,
      //       element.lastname,
      //       element.primaryEmail,
      //       element.phone,
      //       element.extension,
      //       parsedRoleId,
      //       element.designation,
      //       parsedEmployeeID,
      //       agentCode,
      //       hashedPassword,
      //       adminUserId,
      //       element.username,



      firstname,
      middlename,
      lastname,
      primaryEmail,
      phone,
      // extension,
      roleId,
      designation,
      employeeID,
      confirmPassword,
      adminUserId,
      username
    } = req.body;

    // if (extension) {
    //   if (!isValidExtension(extension)) {
    //     return res
    //       .status(400)
    //       .json({
    //         status: false,
    //         statusText: "Extension must be 4-6 digits long",
    //       });
    //   }
    // }


    if (!req.body) {
      return res
        .status(400)
        .json({ status: false, statusText: "Request body is missing" });
    }

    if (primaryEmail) {
      const emailValidate = await userModel.isUserExist(primaryEmail)
      if (emailValidate == true) {
        return res.status(400).json({
          status: false,
          statusText: "Email ID already exists",
        });
      }
    }
    if (username) {
      const usernameValidatte = await userModel.isUserNameExist(username)
      if (usernameValidatte == true) {
        return res.status(400).json({
          status: false,
          statusText: "User name  already exists",
        });
      }
    }
    if (employeeID) {
      const employeeValidate = await userModel.isEmployeIdExist(employeeID)
      if (employeeValidate == true) {
        return res.status(400).json({
          status: false,
          statusText: "Employee ID already exists",
        });
      }
    }
    // if (phone) {
    //   const employeeValidate = await userModel.isPhoneExist(phone)
    //   if (employeeValidate == true) {
    //     return res.status(400).json({
    //       status: false,
    //       statusText: "Phone number already exists",
    //     });
    //   }
    // }

    // Validate roleId and employeeID as integers
    const parsedRoleId = parseInt(roleId);
    // const parsedEmployeeID = parseInt(employeeID);

    if (!Number.isInteger(parsedRoleId)) {
      return res.status(400).json({
        status: false,
        statusText: "Invalid roleId. It must be an integer.",
      });
    }
    const agentCode = null

    // if (!Number.isInteger(parsedEmployeeID)) {
    //   return res.status(400).json({
    //     status: false,
    //     statusText: { message: ["Invalid employeeID. It must be an integer"] },
    //   });
    // }
    hashedPassword = await bcrypt.hash(confirmPassword, 10);
    const currentDate = moment().format("YYYY/MM/DD HH:mm:ss");

    const result = await userModel.insertUsers(
      firstname,
      middlename,
      lastname,
      primaryEmail,
      phone,
      // extension,
      parsedRoleId,
      designation,
      agentCode,
      employeeID,
      hashedPassword,
      adminUserId,
      username
    );


    if (result != "Failed" && result != undefined) {
      res
        .status(200)
        .json({ status: true, statusText: "User added successfully" });
    } else {
      res
        .status(401)
        .json({ status: false, statusText: "User added Failed" });
    }
  } catch (error) {
    console.error("Error inserting users:", error);
    log.error(err);
    res.status(500).json({ status: false, statusText: ["Failed to add user"] });
  }
};
exports.UploadUsers = async (req, res) => {
  try {
    const isNotEmpty = (value) => value !== null && value !== "";
    const isValidFirstname = (firstname) => /^[a-zA-Z\s]{1,50}$/.test(firstname);
    const isValidLastname = (lastname) => /^[a-zA-Z\s]{1,50}$/.test(lastname);
    const isValidPhone = (phone) => /^\+?[0-9]{7,15}$/.test(phone);
    // const isValidExtension = (extension) => /^[0-9]{4,6}$/.test(extension);
    const isValidDesignation = (designation) => designation.length < 30;
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const excelKeys = req.body.excelKeys;
    const datas = req.body.datas;
    const adminUserId = req.body.adminUserId;
    let idexist;
    const empty = validateData(datas)


    function validateData(data) {
      return data.map((row, index) => {
        const { roleId, ...otherFields } = row;
        const otherFieldsFilled = Object.values(otherFields).some(value => value);

        if (roleId && !otherFieldsFilled) {
          return null; // or any marker for invalid rows
        }
        return row;
      }).filter(row => row); // Remove invalid rows if needed
    }
    if (empty.length == 0) {
      return res
        .status(400)
        .json({ status: false, statusText: "Excel cannot be empty" });
    }

    if (!excelKeys) {
      return res
        .status(400)
        .json({ status: false, statusText: "Select the Excel file" });
    }
    if (!datas) {
      return res
        .status(400)
        .json({ status: false, statusText: "Excel cannot be empty" });
    }
    const keys = [
      'First Name', 'Middle Name', 'Last Name', 'Email', 'Phone Number', 'Username', 'Employee ID', 'Designation', 'Password'
    ];

    if (keys.length != excelKeys.length) {
      return res
        .status(500)
        .json({
          status: false,
          statusText: "Invalid file",
        });
    }
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] != excelKeys[i]) {
        return res
          .status(500)
          .json({
            status: false,
            statusText: "Invalid file",
          });
      }
    }

    const results = [];

    for (const element of datas) {


      if (!isNotEmpty(element.firstname) || !isValidFirstname(element.firstname)) {
        return res
          .status(400)
          .json({ status: false, statusText: "Firstname must be alphebatic and non-empty" });
      }

      if (!isNotEmpty(element.lastname) || !isValidLastname(element.lastname)) {
        return res
          .status(400)
          .json({ status: false, statusText: "Lastname must be alphebatic and non-empty" });
      }

      if (
        !isNotEmpty(element.primaryEmail) ||
        !isValidEmail(element.primaryEmail)
      ) {
        return res
          .status(400)
          .json({
            status: false,
            statusText: "Email must be valid and non-empty",
          });
      }

      if (!isNotEmpty(element.phone) || !isValidPhone(element.phone)) {
        return res
          .status(400)
          .json({
            status: false,
            statusText:
              "Phone number must be 7-15 digits long and can include the plus sign",
          });
      }

      // if (
      //   !isNotEmpty(element.extension) ||
      //   !isValidExtension(element.extension)
      // ) {
      //   return res
      //     .status(400)
      //     .json({
      //       status: false,
      //       statusText: "Extension must be 4-6 digits long",
      //     });
      // }

      if (!isNotEmpty(element.roleId)) {
        return res
          .status(400)
          .json({ status: false, statusText: "User group is not selected" });
      }

      if (
        !isNotEmpty(element.designation) ||
        !isValidDesignation(element.designation)
      ) {
        return res
          .status(400)
          .json({
            status: false,
            statusText: "Designation must be less than 30 characters",
          });
      }

      if (!isNotEmpty(element.employeeID)) {
        return res
          .status(400)
          .json({ status: false, statusText: "Employee ID must be non-empty" });
      }

      const parsedRoleId = parseInt(element.roleId);
      const parsedEmployeeID = parseInt(element.employeeID);
      let hashedPassword = await bcrypt.hash(element.password.toString(), 10);


      if (element.primaryEmail) {
        const emailValidate = await userModel.isUserExist(element.primaryEmail)
        if (emailValidate == true) {
          return res.status(400).json({
            status: false,
            statusText: "Email id already exist",
          });
        }
      }
      if (element.username) {
        const usernameValidatte = await userModel.isUserNameExist(element.username)
        if (usernameValidatte == true) {
          return res.status(400).json({
            status: false,
            statusText: "Username already exist",
          });
        }
      }
      if (element.employeeID) {
        const employeeValidate = await userModel.isEmployeIdExist(element.employeeID)
        if (employeeValidate.exists == true) {
          return res.status(400).json({
            status: false,
            statusText: `Employee ID ${employeeValidate.employeeID} already exists`,
          });
        }
      }

      try {
        const resulId = await userModel.selectingEmployeeID(element.roleId);


        const idexist = resulId.some(
          (resulId) => resulId.employeeID === element.employeeID
        );
        if (idexist) {
          return res
            .status(400)
            .json({
              status: false,
              statusText: `Employee ID '${element.employeeID}' already exists`,
            });
        } else {
          const agentCode = null
          const result = await userModel.insertUsers(
            element.firstname,
            element.middlename,
            element.lastname,
            element.primaryEmail,
            element.phone,
            parsedRoleId,
            element.designation,
            agentCode,
            element.employeeID,
            hashedPassword,
            adminUserId,
            element.username,
          );
          results.push(result);

        }

      } catch (error) {
        console.error("Error during database operation:", error);
        return res
          .status(500)
          .json({ status: false, statusText: "Internal Server Error" });
      }
    }

    // Return a response after processing all elements
    return res.status(200).json({ status: true, statusText: "User(s) added successfully" });
  } catch (err) {
    console.log("err:", err);
    log.error(err);
  }
};

exports.UploadEmployees = async (req, res) => {
  try {
    const isNotEmpty = (value) => value !== null && value !== "";
    const isValidFirstname = (firstname) => /^[a-zA-Z\s]{1,50}$/.test(firstname);
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidPhoneNumber = (phone) => /^[0-9]{7,15}$/.test(phone);
    const isValidEmployeeID = (employeeID) => /^.{4,}$/.test(employeeID);  // At least 4 characters of any kind

    const excelKeys = req.body.excelKeys;
    const datas = req.body.datas;
    const adminUserId = req.body.adminUserId;

    if (!excelKeys) {
      return res.status(400).json({ status: false, statusText: "Invalid file1" });
    }
    if (!datas) {
      return res.status(400).json({ status: false, statusText: "Invalid file2" });
    }

    const keys = [
      'First Name', 'Middle Name', 'Last Name', 'Email', 'Phone Number', 'Designation', 'Employee ID', 'Agent ID'
    ];

    if (keys.length !== excelKeys.length) {
      return res.status(500).json({ status: false, statusText: "Invalid file3" });
    }
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] !== excelKeys[i]) {
        return res.status(500).json({ status: false, statusText: "Invalid file4" });
      }
    }

    const isEmptyData = datas.every((row) =>
      Object.values(row).every((value) => value === null || value === "")
    );

    if (isEmptyData) {
      return res.status(400).json({ status: false, statusText: "Excel file cannot be empty" });
    }

    const results = [];

    for (const element of datas) {
      if (!isNotEmpty(element.firstname) || !isValidFirstname(element.firstname)) {
        return res.status(400).json({ status: false, statusText: "Firstname must be alphabetic and non-empty" });
      }

      if (!isNotEmpty(element.primaryEmail) || !isValidEmail(element.primaryEmail)) {
        return res.status(400).json({ status: false, statusText: "Email must be valid and non-empty" });
      }

      // Employee ID validation
      if (!isNotEmpty(element.employeeID)) {
        return res.status(400).json({ status: false, statusText: "Employee ID is required" });
      } else if (!isValidEmployeeID(element.employeeID)) {
        return res.status(400).json({ status: false, statusText: "Employee ID must be at least 4 characters long" });
      }

      if (element.phone && !isValidPhoneNumber(element.phone)) {
        return res.status(400).json({ status: false, statusText: "Phone number must be between 7 to 15 digits" });
      }

      if (element.primaryEmail) {
        const emailValidate = await userModel.isUserExist(element.primaryEmail);
        if (emailValidate) {
          return res.status(400).json({ status: false, statusText: "Email ID already exists" });
        }
      }

      if (element.employeeID) {
        const employeeValidate = await userModel.isEmployeIdExist(element.employeeID);
        if (employeeValidate) {
          return res.status(400).json({ status: false, statusText: `Employee ID '${element.employeeID}' already exists` });
        }
      }

      try {
        const result = await userModel.ImportEmployees(
          element.firstname,
          element.middlename,
          element.lastname,
          element.primaryEmail,
          element.phone,
          element.designation,
          element.employeeID,
          element.agentcode,
          adminUserId
        );
        results.push(result);
      } catch (error) {
        console.error("Error during database operation:", error);
        return res.status(500).json({ status: false, statusText: "Internal Server Error" });
      }
    }

    return res.status(200).json({ status: true, statusText: "Employee(s) added successfully" });

  } catch (err) {
    console.log("err:", err);
    log.error(err);
    return res.status(500).json({ status: false, statusText: "Internal Server Error" });
  }
};


exports.getHierachyMappingDetails = async (req, res, next) => {
  try {
    // Fetch location and employee data
    const [location] = await ldapModel.getLDAPlocationPath();
    const department = await userModel.getdepartment();
    const getEmployees = await userModel.getAllEmployee();

    return res.status(200).json({
      status: true,
      location: location || [],
      department: department || [],
      getEmployees: getEmployees || [],
    });
  } catch (err) {
    log.error("Error:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch hierarchy mapping details",
      error: err,
    });
  }
};
exports.MappingHeirarchyEmployee = async (req, res, next) => {
  try {
    const { userData, Division, adminUserId } = req.body;

    // Validate that userData is an array and contains the selected user(s)
    if (!Array.isArray(userData) || userData.length === 0) {
      return res.status(400).json({ status: false, message: "No users selected for mapping" });
    }

    let result = "";

    // Iterate over selected userData and map division to each user
    for (let i = 0; i < userData.length; i++) {
      const userId = userData[i];
      // Pass the division and userId to the MappExtension function to update the division
      result = await userModel.MappExtension(userId, Division, adminUserId);
      if (result !== "Success") {
        return res.status(400).json({ status: false, message: "Failed to map division for some users" });
      }
    }
    res.status(200).json({ status: true, message: "Successfully Mapped!!" });

  } catch (err) {
    console.log(err);
    log.error(err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.getUsers = async (req, res) => {


  try {
    const { roleID } = req.body;
    const { limit } = req.body;
    const { offset } = req.body;
    let count;
    let users
    // = await userModel.getUsers(roleID,limit, offset);
    if (roleID) {
      count = await userModel.getUsersCount(roleID)
      users = await userModel.getUsers(roleID, limit, offset);
    } else {
      count = await userModel.getUsersCountWithouRoleId()
      users = await userModel.getUsersTotal(limit, offset);
    }

    if (users.length > 0) {
      res.status(200).json({ status: true, groups: users, count });
    } else {
      res.status(400).json({ status: false, message: "No Data" });
    }
  } catch (error) {
    console.error("Error fetching user groups:", error);

    log.error(error);
    res
      .status(500)
      .json({ status: false, statusText: "Failed to fetch user groups" });
    // throw err;
  }
};
exports.SearchResult = async (req, res) => {
  try {
    const { query } = req.body
    // if (query) {
    const users = await userModel.getSearchResult(query);
    // console.log(users, 'dafafa');
    if (users.length > 0) {
      res.status(200).json({ status: true, groups: users, });
    } else {
      res.status(400).json({ status: false, message: "No Data" });
    }
    // }

  } catch (error) {
    log.error(error);
    res
      .status(500)
      .json({ status: false, statusText: "Failed to fetch Data" });
    throw err;
  }
}

exports.updateUsers = async (req, res) => {
  // console.log(req.body, 'updated users');

  let updatedUsers;
  try {
    // Validate if the request body is missing
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ status: false, statusText: "Request body is missing" });
    }
    // Perform user validation
    isValidationStatus = await validationForUser(req.body);
    if (isValidationStatus[0].message != "") {
      return res
        .status(400)
        .json({ status: false, statusText: isValidationStatus });
    }

    // Extract fields from request body
    const {
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

    } = req.body;


    // if (primaryEmail) {
    //   const emailValidate = await userModel.isUserExist(primaryEmail)
    //   if (emailValidate == true) {
    //     return res.status(400).json({
    //       status: false,
    //       statusText: { message: ["Email id already exist"] },
    //     });
    //   }
    // }
    // if (username) {
    //   const usernameValidatte = await userModel.isUserNameExist(username)
    //   if (usernameValidatte == true) {
    //     return res.status(400).json({
    //       status: false,
    //       statusText: { message: ["Username already exist"] },
    //     });
    //   }
    // }
    // if (employeeID) {
    //   const employeeValidate = await userModel.isEmployeIdExist(employeeID)
    //   if (employeeValidate == true) {
    //     return res.status(400).json({
    //       status: false,
    //       statusText: { message: ["EmployeeID already exist,if Employee is not showing contact Admin"] },
    //     });
    //   }
    // }
    if (!confirmPassword) {



      updatedUsers = await userModel.updateUsersWithoutpassword(
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
      );
    } else {
      const hashedPassword = await bcrypt.hash(confirmPassword, 10);
      // Perform the update operation
      updatedUsers = await userModel.updateUsers(
        firstname,
        middlename,
        lastname,
        primaryEmail,
        phone,
        extension,
        roleId,
        designation,
        employeeID,
        hashedPassword,
        userId,
        adminUserId,
        username
      );
      io.emit("logout", userId);
    }
    if (updatedUsers.affectedRows === 1) {
      res.status(200).json({
        status: true,
        statusText: "User updated successfully",
        updatedUserGroups: updatedUsers,
      });
    } else {
      res.status(200).json({
        status: false,
        statusText: "No user was updated",
      });
    }
  } catch (error) {
    console.error("Error updating users:", error);
    log.error(err);
    res.status(500).json({
      status: false,
      statusText: { message: ["Failed to Update Users"] },
    });
  }
};


exports.deleteUsers = async (req, res) => {
  try {
    const { userIdDetails, adminUserId } = req.body;
    let message

    if (!userIdDetails || !Array.isArray(userIdDetails) || userIdDetails.length === 0) {
      return res.status(400).json({
        status: false,
        statusText: "Invalid or missing userIdDetails",
      });
    }

    if (!adminUserId) {
      return res.status(400).json({
        status: false,
        statusText: "Invalid or missing adminUserId",
      });
    }

    if (userIdDetails.includes(adminUserId)) {

      message = 'The same user cannot be deleted.';
    } else {
      message = null
    }
    // Call the model's deleteUsers method
    const deletedUsers = await userModel.deleteUsers(userIdDetails, adminUserId);

    if (deletedUsers) {
      return res.status(200).json({
        status: true,
        statusText: "Users deactivated successfully",
        message: message
      });
    } else {
      return res.status(400).json({
        status: false,
        statusText: "No users were deactivated",
        message: message
      });
    }
  } catch (error) {
    console.error("Error deleting users:", error);
    res.status(500).json({
      status: false,
      statusText: "An error occurred while deleting users",
    });
  }
};


exports.updateuserById = async (req, res) => {
  let id = req.body.userId;
  const data = await userModel.getUserGroupId(id);
  if (data) {
    res.status(200).json({ status: true, data: data });
  } else {
    res.status(400).send({ status: false, message: "no result" });
  }
};
exports.getUserlistbyId = async (req, res) => {


  const { roleId, limit, offset } = req.body;
  let returndata = []
  let couts = []

  if (!roleId) {
    return res.status(400).json({ status: false, message: "roleId is required" });
  }




  try {

    for (const roleIds of roleId) {
      const data = await userModel.getUserlistId(roleIds);
      const count = await userModel.getuserListIdcount(roleIds)
      returndata.push(...data)
      couts.push(...count)

    }

    const totalCount = couts.reduce((acc, item) => acc + item.count, 0);

    const paginatedData = returndata.slice(offset, offset + limit);
    if (paginatedData.length > 0) {
      // Clear returndata and couts before sending response
      const response = { status: true, groups: paginatedData, count: totalCount };
      returndata = [];
      couts = [];
      await audit.auditTrailFunction(req.body.adminUserId, 'USER MANAGEMENT', 'READ', `User management accessed`, 'dgUser', 0, null, null, null);
      res.status(200).json(response);
    } else {
      res.status(404).json({ status: false, message: "No result for the provided roleId" });
    }
  } catch (error) {
    console.error("Error retrieving data for roleId", roleId, ":", error); // Log any errors
    res.status(500).json({ status: false, message: "Internal server error" });
  }


}
exports.insertUsersExcel = async (req, res) => {
  try {
    const { adminUserId } = req.body
    const data = req.body.excelData;
    const currentDate = moment().format("YYYY/MM/DD HH:mm:ss");
    const userGroups = await userModel.getUsergroups(adminUserId);
    const roleId = userGroups.map((group) => group.roleId);
    const invalidEmails = [];

    for (const entry of data) {
      const { NAME, EMAIL } = entry;

      if (validator.isEmail(EMAIL)) {
        await userModel.insertUsers(NAME, currentDate, EMAIL, roleId, 1, adminUserId);
      } else {
        invalidEmails.push(EMAIL);
        console, log("invalidEmails", invalidEmails);
      }
    }
    if (invalidEmails.length > 0) {
      res.status(200).json({
        status: false,
        statusText: "Invalid email addresses",
        invalidEmails,
      });
    } else {
      res
        .status(200)
        .json({ status: true, statusText: "Data inserted successfully" });
    }
  } catch (error) {
    console.error("Error processing data:", error);
    log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.getEmployees = async (req, res) => {
  try {
    // pass values with this keys if has inpiut,otherwise pass null
    const {
      inLocationId,
      inDepartmentId,
      inDivisionId,
      inPageNumber,
      inRecordsPerPage,
      inUserId,
      inSortColumn,
      inSortOrder,
    } = req.body;

    const adminUserId = req.body.adminUserId;
    const results = await userModel.getEmployees(
      inLocationId,
      inDepartmentId,
      inDivisionId,
      inPageNumber,
      inRecordsPerPage,
      inUserId,
      inSortColumn,
      inSortOrder,
      adminUserId
    );
    if (!results.length) {
      res.status(404).json({ status: false, statusText: "No Data Found" });
    } else {
      res.status(200).json({ status: true, data: results });
    }
  } catch (error) {
    console.log("err:", error);
    log.error(error);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};

exports.getDepartmentList = async (req, res) => {
  try {
    const locationID = req.body.locationID;
    const [departmentList] = await ldapModel.getDepartmentListByLid(locationID);
    res.status(200).json({ status: true, departmentList: departmentList });
  } catch (err) {
    console.log(err);
    log.error(err);
  }
};

exports.deleteEmployees = async (req, res) => {
  const userId = req.body.userId;
  const adminUserId = req.body.adminUserId;
  if (!userId) {
    return res
      .status(400)
      .json({ status: false, statusText: "User ID is missing" });
  }

  try {
    // Perform deletion via model, which will also update the audit trail
    const isDeleted = await userModel.deleteEmployeeManager(
      userId,
      adminUserId
    );

    if (isDeleted) {
      res
        .status(200)
        .json({ status: true, statusText: "Employee deleted successfully" });
    } else {
      res.status(404).json({ status: false, statusText: "Employee not found" });
    }
  } catch (error) {
    console.error("Error deleting Employee:", error);
    log.error(error);
    res
      .status(500)
      .json({ status: false, statusText: "Failed to delete Employee" });
  }
};

exports.addLocation = async (req, res) => {
  try {
    const { locationName, adminUserId } = req.body;

    // Validate input
    if (!locationName || locationName.trim() === "") {
      return res.status(400).json({ status: false, statusText: "Location name is required" });
    }

    // Check if location name already exists
    const locationCount = await userModel.getLocationByName(locationName.trim());
    if (locationCount > 0) {
      return res.status(400).json({
        status: false,
        statusText: `Location '${locationName}' already exists`,
      });
    }

    // Insert new location, department, and division
    const newLocation = await userModel.addLocation(locationName.trim(), adminUserId);
    if (newLocation.affectedRows === 1) {
      return res.status(200).json({
        status: true,
        statusText: "Location added successfully",
        data: {
          locationId: newLocation.locationId,
          departmentId: newLocation.departmentId,
        },
      });
    }

    return res.status(400).json({ status: false, statusText: "Failed to add location" });
  } catch (error) {
    console.error("Error processing location:", error);
    log.error(error);
    return res.status(500).json({
      status: false,
      statusText: "Unable to process the request at the moment. Please try again later.",
    });
  }
};


exports.addDepartment = async (req, res) => {
  try {
    const { locationId, departmentName } = req.body;
    const adminUserId = req.body.adminUserId;

    // Validate input
    if (!departmentName || departmentName.trim() === "") {
      return res
        .status(400)
        .json({ status: false, statusText: "Department name is required" });
    }

    if (!locationId) {
      return res
        .status(400)
        .json({ status: false, statusText: "Location ID is required" });
    }

    // Check if department name already exists for the given location
    const departmentCount = await userModel.getDepartmentByName(departmentName.trim(), locationId);

    if (departmentCount > 0) {
      return res.status(400).json({
        status: false,
        statusText: `Department '${departmentName}' already exists`,
      });
    }

    // Insert new department
    const newDepartment = await userModel.addDepartment(
      departmentName.trim(),
      locationId,
      adminUserId
    );

    if (newDepartment.affectedRows === 1) {
      return res
        .status(200)
        .json({ status: true, statusText: "Department added successfully" });
    }

    return res.status(400).json({
      status: false,
      statusText: "Failed to add department",
    });
  } catch (error) {
    console.error("Error processing department:", error);
    log.error(error);
    return res.status(500).json({
      status: false,
      statusText:
        "Unable to process the request at the moment. Please try again later.",
    });
  }
};

exports.addDivision = async (req, res) => {
  try {
    const { departmentId, divisionName } = req.body;
    const adminUserId = req.body.adminUserId;

    // Validate input
    if (!divisionName || divisionName.trim() === "") {
      return res.status(400).json({
        status: false,
        statusText: "Division name is required",
      });
    }

    if (!departmentId) {
      return res.status(400).json({
        status: false,
        statusText: "Department ID is required",
      });
    }

    // Check if division name already exists in the department
    const divisionCount = await userModel.getDivisionByName(
      divisionName.trim(),
      departmentId
    );

    if (divisionCount > 0) {
      return res.status(400).json({
        status: false,
        statusText: `Division '${divisionName}' already exists`,
      });
    }

    // Insert new division
    const newDivision = await userModel.addDivision(
      divisionName.trim(),
      departmentId,
      adminUserId
    );

    if (newDivision.affectedRows === 1) {
      return res.status(200).json({
        status: true,
        statusText: "Division added successfully",
      });
    }

    return res.status(400).json({
      status: false,
      statusText: "Failed to add division",
    });
  } catch (error) {
    console.error("Error processing division:", error);
    log.error(error);
    return res.status(500).json({
      status: false,
      statusText: "Unable to process the request at the moment. Please try again later.",
    });
  }
};


exports.hierarchyNames = async (req, res) => {
  try {
    const adminUserId = req.body.adminUserId;

    // Call the model function to fetch data
    const data = await userModel.hierarchyNames(adminUserId);

    res.status(200).json({ status: true, Data: data });
    console.log("res", res);
  } catch (error) {
    console.error("Error fetching location, department, division hierarchy:", error);
    res.status(500).json({
      status: false,
      statusText: "Failed to fetch location, department, and division data"
    });
  }
};

exports.getLocationDepartmentDivision = async (req, res) => {
  try {
    const adminUserId = req.body.adminUserId;
    const data = await userModel.getLocationDepartmentDivision(adminUserId);
    res.status(200).json({ status: true, Data: data });
  } catch (error) {
    console.error("Error fetching user groups:", error);
    log.error(error);
    res
      .status(500)
      .json({ status: false, statusText: "Failed to fetch user groups" });
  }
};
exports.getDepartmentByLocation = async (req, res) => {
  try {
    const locationID = req.body.locationId;
    const adminUserId = req.body.adminUserId;

    const departmentList = await userModel.getDepartmentByLocation(locationID, adminUserId);
    // const employeeList = await userModel.getAllEmployeeByLocationID(locationID);
    const employeeList = await userModel.getAllEmployee();
    res.status(200).json({ status: true, Data: departmentList, employeeList: employeeList });
  } catch (err) {
    log.error(err);
    return handleError(res, err);
  }
};
exports.getDivisionByDept = async (req, res, next) => {
  try {
    const deartmentID = req.body.deartmentId;
    const adminUserId = req.body.adminUserId;
    const divisionList = await userModel.getDivisionByDept(deartmentID, adminUserId);
    res.status(200).json({ status: true, Data: divisionList });
  } catch (err) {
    log.error(err);
    return handleError(res, err);
  }
};
exports.getDivisionBylocation = async (req, res, next) => {
  try {
    const locationID = req.body.locationId;
    const adminUserId = req.body.adminUserId;
    const divisionList = await userModel.getDivisionBylocation(locationID, adminUserId);
    res.status(200).json({ status: true, Data: divisionList });
  } catch (err) {
    log.error(err);
    return handleError(res, err);
  }
};
exports.updateLocation = async (req, res) => {
  try {
    const { locationId, locationName } = req.body;
    const adminUserId = req.body.adminUserId;

    // Check if location name already exists
    const existingLocation = await userModel.getLocationByName(locationName);
    if (existingLocation.length > 0) {
      return res
        .status(400)
        .json({ status: false, statusText: `Location ${locationName} not changed` });
    }

    // Update location name
    else {
      const updateResult = await userModel.updateLocation(
        locationId,
        locationName,
        adminUserId
      );

      if (updateResult.affectedRows === 1) {
        return res.status(200).json({
          status: true,
          statusText: "Location Name updated successfully",
        });
      } else {
        return res
          .status(400)
          .json({ status: false, statusText: "No Location was updated" });
      }
    }
  } catch (error) {
    console.error("Error updating Location:", error);
    log.error(err);
    return res.status(500).json({
      status: false,
      statusText:
        "Unable to process the request at the moment. Please try again later.",
    });
  }
};
exports.updateDepartment = async (req, res) => {
  try {
    const { departmentId, departmentName } = req.body;
    const adminUserId = req.body.adminUserId;


    // Check if Department name already exists
    const existingDepartment = await userModel.getDepartmentByName(
      departmentName
    );
    if (existingDepartment.length > 0) {
      return res
        .status(400)
        .json({
          status: false,
          statusText: `Department '${departmentName}' already exists`,
        });
    }

    // Update Department name
    else {
      const updateResult = await userModel.updateDepartment(
        departmentId,
        departmentName,
        adminUserId
      );
      if (updateResult.affectedRows === 1) {
        return res.status(200).json({
          status: true,
          statusText: "Department Name updated successfully",
        });
      } else {
        return res
          .status(400)
          .json({ status: false, statusText: "No Department was updated" });
      }
    }
  } catch (error) {
    console.error("Error updating Department:", error);
    log.error(err);
    return res.status(500).json({
      status: false,
      statusText:
        "Unable to process the request at the moment. Please try again later.",
    });
  }
};
exports.updateDivision = async (req, res) => {
  try {
    const { divisionId, divisionName } = req.body;
    const adminUserId = req.body.adminUserId;


    // Check if Department name already exists
    const existingDivision = await userModel.getDivisionByName(divisionName);
    if (existingDivision.length > 0) {
      return res
        .status(400)
        .json({
          status: false,
          statusText: `Division '${divisionName}' already exists`,
        });
    }

    // Update Division name
    else {
      const updateResult = await userModel.updateDivision(
        divisionId,
        divisionName,
        adminUserId
      );
      if (updateResult.affectedRows === 1) {
        return res.status(200).json({
          status: true,
          statusText: "Division Name updated successfully",
        });
      } else {
        return res
          .status(400)
          .json({ status: false, statusText: "No Division was updated" });
      }
    }
  } catch (error) {
    console.error("Error updating Division:", error);
    log.error(err);
    return res.status(500).json({
      status: false,
      statusText:
        "Unable to process the request at the moment. Please try again later.",
    });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const { locationId } = req.body;
    const adminUserId = req.body.adminUserId;



    // Fetch the location data to check its name
    const locationData = await userModel.getLocationById(locationId);

    if (!locationData) {
      return res.status(404).json({
        status: false,
        errorCode: "LOCATION_NOT_FOUND",
        statusText: "Location not found",
      });
    }

    // Validate if the location name is "Unassigned"
    if (locationData.locationName === "Unassigned") {
      return res.status(400).json({
        status: false,
        errorCode: "LOCATION_UNASSIGNED_CANNOT_BE_DELETED",
        statusText: "The location Unassigned cannot be deleted",
      });
    }

    // Check if the location exists in the department table
    const locationInDepartment = await userModel.checkLocationInDepartment(
      locationId
    );

    if (locationInDepartment) {
      return res.status(400).json({
        status: false,
        errorCode: "LOCATION_HAS_DEPARTMENTS",
        statusText: `This location cannot be deleted because it has departments linked to it`,
      });
    }

    // Delete location
    let deleteResult;
    try {
      deleteResult = await userModel.deleteLocation(locationId, adminUserId);
    } catch (error) {
      console.error("Error deleting location:", error);
      return res.status(500).json({
        status: false,
        errorCode: "LOCATION_DELETE_ERROR",
        statusText:
          "Unable to process the request at the moment. Please try again later.",
      });
    }

    if (deleteResult.affectedRows === 1) {
      return res.status(200).json({
        status: true,
        statusText: "Location deleted successfully",
      });
    } else {
      return res.status(400).json({
        status: false,
        errorCode: "LOCATION_NOT_DELETED",
        statusText: "No location was deleted",
      });
    }
  } catch (error) {
    console.error("Error deleting location:", error);
    log.error(err);
    return res.status(500).json({
      status: false,
      errorCode: "INTERNAL_SERVER_ERROR",
      statusText:
        "Unable to process the request at the moment. Please try again later.",
    });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { departmentId } = req.body;
    const adminUserId = req.body.adminUserId;


    // Check if the department exists in the specified location
    const existingDepartment = await userModel.getDepartmentBydivision(
      departmentId
    );
    if (existingDepartment.count > 0) {
      return res.status(400).json({
        status: false,
        errorCode: "DEPARTMENT_HAS_DIVISIONS",
        statusText: `This department cannot be deleted because it has divisions linked to it`,
      });
    }

    // Delete department
    const deleteResult = await userModel.deleteDepartment(departmentId, adminUserId);
    if (deleteResult.affectedRows === 1) {
      return res.status(200).json({
        status: true,
        statusText: "Department deleted successfully",
      });
    } else {
      return res.status(400).json({
        status: false,
        errorCode: "DEPARTMENT_NOT_FOUND",
        statusText: "No Department was deleted",
      });
    }
  } catch (error) {
    console.error("Error deleting Department:", error);
    log.error(error);
    return res.status(500).json({
      status: false,
      errorCode: "INTERNAL_SERVER_ERROR",
      statusText:
        "Unable to process the request at the moment. Please try again later.",
    });
  }
};

exports.deleteDivision = async (req, res) => {
  try {
    const { divisionId } = req.body;
    const adminUserId = req.body.adminUserId;


    // Check if the department exists in the specified location
    const existingDivision = await userModel.getDivision(divisionId);

    if (existingDivision.length > 0) {
      return res
        .status(400)
        .json({
          status: false,
          errorCode: "DIVISION_HAS_USER",
          statusText: "Division cannot be deleted because it is linked to an active LDAP user",
        });
    }

    // Delete department
    const deleteResult = await userModel.deleteDivision(divisionId, adminUserId);
    if (deleteResult.affectedRows === 1) {
      return res
        .status(200)
        .json({ status: true, statusText: "Division deleted successfully" });
    } else {
      return res
        .status(400)
        .json({
          status: false, errorCode: "DIVISION_NOT_FOUND",
          statusText: "No Division was deleted"
        });
    }
  } catch (error) {
    console.error("Error deleting Division:", error);
    log.error(err);
    return res.status(500).json({
      status: false,
      errorCode: "INTERNAL_SERVER_ERROR",
      statusText:
        "Unable to process the request at the moment. Please try again later.",
    });
  }
};

exports.addEmployees = async (req, res, next) => {
  try {
    const {
      firstname,
      middlename,
      lastname,
      primaryEmail,
      phone,
      designation,
      agentcode,
      employeeID,
      divisionId,
    } = req.body;

    const adminUserId = req.body.adminUserId; // Admin user performing the insertion action
    const type = "Insert";

    // Validation process
    const isValidationStatus = await validationinsertEmployee(req.body, type);
    if (isValidationStatus[0].message != "") {
      return res.status(400).json({ status: false, statusText: isValidationStatus });
    }

    // Check if the email already exists
    const isEmailExist = await userModel.isUserExist(primaryEmail);
    if (isEmailExist) {
      return res.status(409).json({
        status: false,
        statusText: "Email ID already exists"
      });
    }

    // Check if the employee ID already exists
    const isEmployeeIDExist = await userModel.isEmployeIdExist(employeeID);
    if (isEmployeeIDExist) {
      return res.status(409).json({
        status: false,
        statusText: `Employee ID ${employeeID} already exists`
      });
    }

    // Insert new employee into the database
    const result = await userModel.addEmployees(
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
    );

    // Check result and respond accordingly
    if (result !== "Failed" && result != undefined) {
      res.status(200).json({
        status: true,
        statusText: "Employee added successfully"
      });
    } else {
      res.status(401).json({
        status: false,
        statusText: "Employee addition failed"
      });
    }
  } catch (err) {
    console.error("Error in addEmployees:", err);
    log.error(err);
    res.status(500).json({
      status: false,
      statusText: "Internal Server Error"
    });
  }
};


exports.updateEmployees = async (req, res, next) => {
  try {
    // Validation for employee data
    isValidationStatus = await validationForEmployee(req.body);
    if (isValidationStatus[0].message != "") {
      return res.status(400).json({ status: false, isValidationStatus });
    }
    // Extracting parameters from request body
    const {
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
    } = req.body;

    const adminUserId = req.body.adminUserId;

    // Check if the Employee ID exists already (excluding the current user's ID)
    const employeeIDExists = await userModel.checkEmployeeIDExists(employeeID, userId);
    if (employeeIDExists) {
      return res.status(400).json({
        status: false,
        statusText: 'Employee ID already exists',
      });
    }


    // Calling model to update the employee
    const result = await userModel.UpdateEmployees(
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
    );

    if (result != "Failed" && result != undefined) {
      res
        .status(200)
        .json({ status: true, statusText: "Employee updated successfully" });
    } else {
      res
        .status(400)
        .json({ status: false, statusText: "Employee update failed" });
    }
  } catch (err) {
    console.log("err:", err);
    log.error(err);
    res.status(500).json({ status: false, statusText: "Server error" });
  }
};
exports.getFilters = async (req, res) => {
  try {
    const extensions = await userModel.getExtension();
    const agents = await userModel.getAgents();
    const getExtensionNumber = await userModel.getExtensionNumber();
    const colorcode = await userModel.getColorcode();


    if (extensions.length === 0 && agents.length === 0 && getExtensionNumber === 0 && colorcode === 0) {
      return res
        .status(404)
        .json({ status: false, statusText: "No data found" });
    }
    res
      .status(200)
      .json({ status: true, extensions: extensions, agents: agents, getExtensionNumber: getExtensionNumber, colorcode: colorcode });
  } catch (err) {
    console.log(err);
    log.error(err);
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};


exports.fectingStationMonitorData = async (req, res) => {
  const data = await userModel.fecthuserDeatils();
  if (data.length > 0) {
    return res.status(200).json({
      status: true,
      statusText: "Data Fetched Successfully",
      Data: data,
    });
  }
};
