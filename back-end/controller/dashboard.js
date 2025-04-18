const messages = require("ldap/lib/messages");
const dashboard = require("../model/dashboard")
const dashboardModel = dashboard.dashboard;
var log = require('log4js').getLogger("Dashboard");
const redisClient = require('../redisconnection');
const moment = require('moment');
const { processes } = require("systeminformation");
const CryptoJS = require('crypto-js');
const apiSecret = process.env.AUTHORIZATION_USER
const pako = require('pako');
const audit = require("../auditTrail");

// Decryption license Key
exports.decryption = async (req, res) => {
  try {
    log.info('Executing decryption API')
    //decryption
    const token = req.body.token;
    const receivedEncryptedData = token;

    // Hash the key to ensure it is the correct length
    const hashedKey = CryptoJS.SHA256(apiSecret).toString(CryptoJS.enc.Hex).slice(0, 32);

    // Step 1: Decrypt the encrypted data
    const decrypted = CryptoJS.AES.decrypt(receivedEncryptedData, CryptoJS.enc.Hex.parse(hashedKey), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });

    // Step 2: Convert decrypted data from WordArray to Base64 string
    const decryptedBase64 = decrypted.toString(CryptoJS.enc.Utf8);

    // Step 3: Convert Base64 string to Uint8Array
    const byteCharacters = atob(decryptedBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Step 4: Decompress the data using pako
    const decompressedData = pako.inflate(byteArray, { to: 'string' });
    const receivedToken = decompressedData;

    const parts = receivedToken.split('.');
    const MacAddress = parts[parts.length - 1];
    const encodedPayload = parts[1];
    const decodedPayload = JSON.parse(atob(encodedPayload));

    res.status(200).json({ status: true, MacAddress, decodedPayload })
  } catch (outerError) {
    log.error(outerError);
    console.error("Error querying decrypting license:", outerError);
    res.status(404).json({ status: false, message: "Invalid Token" })
  }
}

// Fetch Dashboard Features
exports.fetchDashboardFeatures = async (req, res) => {
  try {
    const { userId } = req.body
    const [dashboardFeatures] = await dashboardModel.getDashboardFeatures(userId);
    if (!dashboardFeatures || dashboardFeatures.length === 0) {
      res.status(404).json({ status: false, statusText: "Data Not Found" });
    } else {
      res.status(200).json({ status: true, dashboardFeatures: dashboardFeatures });
    }
  } catch (err) {
    console.log("err:", err);
    log.error(err);
    res
      .status(500)
      .json({ status: false, statusText: "Internal Server Error" });
  }
};
// insert Dashboard Status
exports.updateUserDashboardStatus = async (req, res) => {

  const { userId, datas, filterChannelTimeSettings, filterChannelCallSettings, selectedTabIndex, AgentfilterSettings, AgentCallfilterSettings } = req.body;
  const filtersettings = [filterChannelTimeSettings, filterChannelCallSettings];
  const AgentSettings = [AgentfilterSettings, AgentCallfilterSettings]
  // callRecordingDashboardUserFeatureId
  if (!userId) {
    res.status(400).json({ status: false, statusText: "userId Not Found" });
  }
  try {
    const [validateUserId] = await dashboardModel.validateUserId(userId);
    if (!validateUserId || validateUserId.length === 0) {
      // insert features
      const insertfeatures = await dashboardModel.insertfeatures(userId, datas);
      if (insertfeatures.status) {
        if (filterChannelTimeSettings || filterChannelCallSettings || AgentfilterSettings || AgentCallfilterSettings) {
          const updatefeatures = await dashboardModel.updateFeatures(userId, datas, filtersettings, selectedTabIndex, AgentSettings);
        }
        return res.status(200).json({ status: true, message: insertfeatures.message })
      }
    } else {
      // Update features
      const updatefeatures = await dashboardModel.updateFeatures(userId, datas, filtersettings, selectedTabIndex, AgentSettings);
      if (updatefeatures.status) {
        res.status(200).json({ status: true, message: updatefeatures.message });
      }

    }
  } catch (err) {
    console.log("err:", err);
    log.error(err);
    res
      .status(500)
      .json({ status: false, statusText: "Internal Server Error" });
  }
};
// Fetch channel Status
exports.channelStatus = async (req, res) => {
  // Subscribe to the 'LIVE_CHANNEL_STATUS' channel
  //   redisClient.ft = Redisearch;
  const key = 'CHANNEL_MONITOR';
  // const processedData = [];
  const extensionfilter = []
  const agentFilter = []
  redisClient.hgetall(key)
    .then(async result => {
      let channelStatusCounts = {};

      // Filter valid JSON values only
      const validEntries = Object.values(result).filter(value => {
        return typeof value === 'string' && value.trim().startsWith('{');
      });

      validEntries.forEach(value => {
        let parsedEntry;
        try {
          parsedEntry = JSON.parse(value);
        } catch (error) {
          console.error('Error parsing entry:', value, error);
          return;
        }

        extensionfilter.push(parsedEntry.Extension);
        agentFilter.push(parsedEntry.Agent);

        let channelStatus = parsedEntry.ChannelStatus;
        channelStatusCounts[channelStatus] = (channelStatusCounts[channelStatus] || 0) + 1;
      });

      const [[DisconnectStatus]] = await dashboardModel.fetchDisconnectStatus();
      channelStatusCounts['5'] = DisconnectStatus.DisconnectStatus;
      const defaultKeys = {
        '0': 'Idle',
        '5': 'Offline',
        '2': 'On Call',
        '4': 'Ringing'
      };

      const updatedChannelStatusCounts = Object.keys(defaultKeys).reduce((acc, key) => {
        const newKey = defaultKeys[key];
        acc[newKey] = channelStatusCounts[key] !== undefined ? channelStatusCounts[key] : 0;
        return acc;
      }, {});
      res.status(200).json({
        status: true,
        statusText: 'Channel Status Counts Fetched Successfully',
        ChannelStatusCounts: updatedChannelStatusCounts
      });
    })
    .catch(err => {
      log.error(err);
      console.error('Error:', err);
      res.status(500).json({
        status: false,
        statusText: 'Error Fetching Data',
        error: err
      });
    });
};

function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") {
    console.error("Error: Invalid date string received:", dateStr);
    return null;
  }

  let dateObj = null;

  try {
    if (/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2} (am|pm)$/i.test(dateStr)) {
      // Format: "DD/MM/YYYY, hh:mm:ss am/pm"
      const [datePart, timePart] = dateStr.split(", ");
      const [day, month, year] = datePart.split("/");

      if (!day || !month || !year || !timePart) throw new Error("Invalid format");

      const formattedDate = `${year}-${month}-${day} ${timePart}`;
      dateObj = new Date(formattedDate);
    }
    else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
      // Format: "YYYY-MM-DD hh:mm:ss" (INVALID FORMAT FOR YOU)
      console.warn("Excluding invalid format:", dateStr);
      return null;
    }
    else {
      throw new Error("Unknown date format");
    }

    if (isNaN(dateObj.getTime())) throw new Error("Invalid date value");

    return dateObj;
  } catch (error) {
    console.error("Error parsing date:", error.message, "| Date string:", dateStr);
    return null;
  }
}




// Fetch Active Users
exports.activeUsers = async (req, res) => {

  const key = process.env.USER_LOGIN_REDIS_KEY;

  redisClient.hgetall(key)
    .then(async result => {
      let activeUsers = [];
      let recentUsers = [];

      if (!result) {
        return res.status(404).json({
          status: false,
          statusText: 'No data found for the provided key',
        });
      }

      Object.values(result).forEach(value => {
        let parsedEntry;

        try {
          parsedEntry = JSON.parse(value);

          // Add both active and recent users to recentUsers
          recentUsers.push(parsedEntry);

          // Check if LogoutTime is null (still active)
          if (parsedEntry.LogoutTime === null) {
            activeUsers.push(parsedEntry);
          }

        } catch (error) {
          log.error(error);
          console.error('Error parsing entry:', value, error);
          return; // Skip this entry if there's an error
        }
      });

      // Sort active users by LoginTime (newest first)
      activeUsers.sort((a, b) => {
        return parseDate(b.LoginTime) - parseDate(a.LoginTime); // Sort by parsed date, latest first
      });

      // Sort recent users only by LoginTime, ignoring LogoutTime null priority
      recentUsers.sort((a, b) => {
        return parseDate(b.LoginTime) - parseDate(a.LoginTime); // Sort by parsed LoginTime
      });

      // Send the response with the active and recent users
      res.status(200).json({
        status: true,
        statusText: 'Channel Status Counts Fetched Successfully',
        activeUsers: activeUsers,
        recentUsers: recentUsers
      });

    })
    .catch(error => {
      log.error(error);
      console.error('Error fetching data from Redis:', error);
      res.status(500).json({
        status: false,
        statusText: 'Error Fetching Data',
        error: error
      });
    });
};


// Daily Call Traffic Status
exports.dailyCallTrafficStatus = async (req, res) => {
  const dates = await getLastWeekLastYear();

  let date = req.body.date


  let startData;
  let endDate;
  if (!date) {
    startData = dates.thisMonthStart;
    endDate = dates.today;
  }
  switch (date) {
    case "today":

      startData = dates.today;
      endDate = dates.tomorrow;

      break;
    case "week":

      startData = dates.thisWeekStart;
      endDate = dates.today;

      break;
    case "month":

      startData = dates.thisMonthStart;
      endDate = dates.today;

      break;

    case "year":

      startData = dates.thisYearStart;
      endDate = dates.today;


      break;
    case "custom":

      startData = req.body.startDate;
      endDate = req.body.endDate;


      break;


    default:
      break;
  }

  try {
    const result = await dashboardModel.getDailyCallTrafficStatus(startData, endDate)

    const callData = result[0][0].map(item => {
      const date = new Date(item.callDate); // Assuming callDate is in ISO format
      return {
        ...item,
        callDate: moment(date).format('DD-MM-YYYY')
      };
    });// Access the first element of the first array


    const transformedData = callData.reduce((acc, item) => {
      acc[item.callDate] = { numberOfCalls: item.numberOfCalls };
      return acc;
    }, {});

    res.status(200).json({
      status: true,
      statusText: 'Fetched Successfully',
      callDataDaily: transformedData,// Include the counts of each ChannelStatus

    });





  } catch (error) {
    console.log(error);
    res.status(404).json({
      status: false,
      message: "No Data"
    })

  }
  // let endDate = req.body.endDate;
};

// Fetch Filter Settings
exports.fetchFilterSettings = async (req, res) => {
  try {

    const { userId } = req.body;

    const [userFeatureRows] = await dashboardModel.validateSettingUserId(userId);
    if (!userFeatureRows || userFeatureRows.length === 0) {
      return res.status(404).json({ message: "No active user features found for this user." });
    } else {
      const featureIds = userFeatureRows.map(row => row.callRecordingDashboardUserFeatureId);

      const extensionRows = await dashboardModel.fetchFeatures(featureIds);
      if (extensionRows.length === 0) {
        return res.status(404).json({
          message: "No extension data found for the provided user feature IDs.",
          updateRequiredFor: featureIds.slice(0, 2) // Specify the first 2 items for update
        });
      }
      // Return the fetched data if available
      res.status(200).json({
        message: "Filter settings fetched successfully.",
        data: extensionRows
      });
    }

  } catch (error) {
    console.error("Error fetching filter settings:", error);
    res.status(500).json({ message: "An error occurred while fetching filter settings." });
  }
};
// Fetch Filter Agent Settings
exports.fetchFilterAgentSettings = async (req, res) => {
  try {

    const { userId } = req.body;

    const [userFeatureRows] = await dashboardModel.validateSettingUserId(userId);

    if (!userFeatureRows || userFeatureRows.length === 0) {
      return res.status(404).json({ message: "No active user features found for this user." });
    } else {
      const featureIds = userFeatureRows.map(row => row.callRecordingDashboardUserFeatureId);

      const [AgentFeatures] = await dashboardModel.fetchAgentFeatures(featureIds);
      if (AgentFeatures.length === 0) {
        return res.status(404).json({
          message: "No extension data found for the provided user feature IDs.",
          updateRequiredFor: featureIds.slice(0, 2) // Specify the first 2 items for update
        });
      }
      // Return the fetched data if available
      res.status(200).json({
        message: "Filter settings fetched successfully.",
        data: AgentFeatures
      });
    }

  } catch (error) {
    console.error("Error fetching filter settings:", error);
    res.status(500).json({ message: "An error occurred while fetching filter settings." });
  }
};
// Fetch User Extensions
exports.fetchUserExtensions = async (req, res) => {
  try {

    const { userId } = req.body;

    const [userFeatureRows] = await dashboardModel.validateSettingUserId(userId);
    if (!userFeatureRows || userFeatureRows.length === 0) {
      return res.status(404).json({ message: "No active user features found for this user." });
    } else {
      const featureIds = userFeatureRows.map(row => row.callRecordingDashboardUserFeatureId);

      const [extensionRows] = await dashboardModel.fetchFeatures(featureIds);

      if (extensionRows.length === 0) {
        return res.status(404).json({
          message: "No extension data found for the provided user feature IDs.",
          updateRequiredFor: featureIds.slice(0, 2) // Specify the first 2 items for update
        });
      }
      // Return the fetched data if available
      res.status(200).json({
        status: true,
        message: "Filter settings fetched successfully.",
        data: extensionRows
      });
    }

  } catch (error) {
    console.error("Error fetching filter settings:", error);
    res.status(500).json({ status: false, message: "An error occurred while fetching filter settings." });
  }
};
// Fetch Channel Time
exports.fetchChannelTime = async (req, res) => {

  try {
    const dates = await getLastWeekLastYear();

    let { date, userId, sort } = req.body

    let startData;
    let endDate;
    const pagenumber = 1;
    const recorderPage = 10;
    const columnname = null
    if (!date) {
      startData = dates.thisMonthStart;
      endDate = dates.today;
    }
    switch (date) {
      case "today":
        startData = dates.today;
        endDate = dates.tomorrow;
        break;
      case "week":

        startData = dates.thisWeekStart;
        endDate = dates.today;

        break;
      case "month":
        startData = dates.thisMonthStart;
        endDate = dates.today;
        break;

      case "year":

        startData = dates.thisYearStart;
        endDate = dates.today;
        break;


      default:
        break;
    }

    try {
      const [[result]] = await dashboardModel.getChannelTimeStatus(startData, endDate, userId, pagenumber, recorderPage, columnname, sort)
      const transformedData = result.reduce((acc, item) => {
        acc[item.extensionNumber] = { busyTime: item.busyTime, idleTime: item.idleTime };
        return acc;
      }, {});

      if (result) {
        res.status(200).json({
          status: true,
          statusText: 'Fetched Successfully',
          channelTime: transformedData

        });
      } else {
        res.status(404).json({
          status: false,
          message: "No Data",
          callDataDaily: callData,// Include the counts of each ChannelStatus
          callDataTrafic,
          frequentCall,
          currentCall
        })
      }

    } catch (error) {
      console.log(error);
      res.status(404).json({
        status: false,
        message: "No Data"
      })

    }
    // let endDate = req.body.endDate;

  } catch (error) {
    console.error("Error fetching filter settings:", error);
    res.status(500).json({ message: "An error occurred while fetching filter settings." });
  }
};

// Fetch Channel Call
exports.fetchChannelCall = async (req, res) => {
  try {
    const dates = await getLastWeekLastYear();

    let { date, userId, sort } = req.body

    let startData;
    let endDate;
    const pagenumber = 1;
    const recorderPage = 10;
    const columnname = 'duration'
    if (!date) {
      startData = dates.thisMonthStart;
      endDate = dates.today;
    }
    switch (date) {
      case "today":

        startData = dates.today;
        endDate = dates.tomorrow;
        break;
      case "week":

        startData = dates.thisWeekStart;
        endDate = dates.today;

        break;
      case "month":

        startData = dates.thisMonthStart;
        endDate = dates.today;

        break;

      case "year":

        startData = dates.thisYearStart;
        endDate = dates.today;


        break;


      default:
        break;
    }

    try {
      const [[result]] = await dashboardModel.getChannelCallStatus(startData, endDate, userId, pagenumber, recorderPage, columnname, sort)
      const transformedData = result.reduce((acc, item) => {
        acc[item.extensionNumber] = { totalCalls: item.totalCalls };
        return acc;
      }, {});
      if (result) {
        res.status(200).json({
          status: true,
          statusText: 'Fetched Successfully',
          channelCall: transformedData

        });
      } else {
        res.status(404).json({
          status: false,
          message: "No Data",
          callDataDaily: callData,// Include the counts of each ChannelStatus
          callDataTrafic,
          frequentCall,
          currentCall
        })
      }




    } catch (error) {
      console.log(error);
      res.status(404).json({
        status: false,
        message: "No Data"
      })

    }
    // let endDate = req.body.endDate;

  } catch (error) {
    console.error("Error fetching filter settings:", error);
    res.status(500).json({ message: "An error occurred while fetching filter settings." });
  }
};
// Fetch Agent Time
exports.fetchAgentTime = async (req, res) => {
  try {
    const dates = await getLastWeekLastYear();

    let { date, userId, sort } = req.body


    const pagenumber = 1;
    const recorderPage = 10;
    const columnname = 'duration'
    let startData;
    let endDate;
    if (!date) {
      startData = dates.thisMonthStart;
      endDate = dates.today;
    }
    switch (date) {
      case "today":

        startData = dates.today;
        endDate = dates.tomorrow;
        break;
      case "week":

        startData = dates.thisWeekStart;
        endDate = dates.today;

        break;
      case "month":


        startData = dates.thisMonthStart;
        endDate = dates.today;
        break;

      case "year":

        startData = dates.thisYearStart;
        endDate = dates.today;


        break;


      default:
        break;
    }

    try {
      const [[result]] = await dashboardModel.getAgentTimeStatus(startData, endDate, userId, pagenumber, recorderPage, columnname, sort)
      const transformedData = result.reduce((acc, item) => {
        acc[item.agentCode] = { agentName: item.agentName, duration: item.duration };
        return acc;
      }, {});

      if (result) {
        res.status(200).json({
          status: true,
          statusText: 'Fetched Successfully',
          channelCall: transformedData

        });
      } else {
        res.status(404).json({
          status: false,
          message: "No Data",
          callDataDaily: callData,// Include the counts of each ChannelStatus
          callDataTrafic,
          frequentCall,
          currentCall
        })
      }




    } catch (error) {
      console.log(error);
      res.status(404).json({
        status: false,
        message: "No Data"
      })

    }
    // let endDate = req.body.endDate;
  } catch (error) {
    console.error("Error fetching filter settings:", error);
    res.status(500).json({ message: "An error occurred while fetching filter settings." });
  }
};
// Fetch Agent Call
exports.fetchAgentCall = async (req, res) => {
  try {
    const dates = await getLastWeekLastYear();

    let { date, userId, sort } = req.body

    let startData;
    let endDate;
    const pagenumber = 1;
    const recorderPage = 10;
    const columnname = 'totalCalls'

    if (!date) {
      startData = dates.thisMonthStart;
      endDate = dates.today;
    }
    switch (date) {
      case "today":

        startData = dates.today;
        endDate = dates.tomorrow;


        break;
      case "week":

        startData = dates.thisWeekStart;
        endDate = dates.today;

        break;
      case "month":

        startData = dates.thisMonthStart;
        endDate = dates.today;

        break;

      case "year":

        startData = dates.thisYearStart;
        endDate = dates.today;


        break;


      default:
        break;
    }

    try {
      const [[result]] = await dashboardModel.getAgentCallStatus(startData, endDate, userId, pagenumber, recorderPage, columnname, sort)
      const transformedData = result.reduce((acc, item) => {
        acc[item.agentCode] = { agentName: item.agentName, totalCalls: item.totalCalls };
        return acc;
      }, {});

      if (result) {
        res.status(200).json({
          status: true,
          statusText: 'Fetched Successfully',
          channelCall: transformedData

        });
      } else {
        res.status(404).json({
          status: false,
          message: "No Data",
          callDataDaily: callData,// Include the counts of each ChannelStatus
          callDataTrafic,
          frequentCall,
          currentCall
        })
      }




    } catch (error) {
      console.log(error);
      res.status(404).json({
        status: false,
        message: "No Data"
      })

    }
    // let endDate = req.body.endDate;
  } catch (error) {
    console.error("Error fetching filter settings:", error);
    res.status(500).json({ message: "An error occurred while fetching filter settings." });
  }
};
// Fetch Extensions
exports.fetchExtensions = async (req, res) => {

  try {
    const [result] = await dashboardModel.getExtensions()

    if (result) {
      res.status(200).json({
        status: true,
        statusText: 'Fetched Successfully',
        Extensions: result

      });
    } else {
      res.status(404).json({
        status: false,
        message: "No Data",
        callDataDaily: callData,// Include the counts of each ChannelStatus
        callDataTrafic,
        frequentCall,
        currentCall
      })
    }

  } catch (error) {
    console.log(error);
    res.status(404).json({
      status: false,
      message: "No Data"
    })

  }

};
// Fetch Agent Code
exports.fetchAgentCode = async (req, res) => {

  try {
    const [result] = await dashboardModel.agentCodes()

    if (result) {
      res.status(200).json({
        status: true,
        statusText: 'Fetched Successfully',
        Agents: result
      });
    } else {
      res.status(404).json({
        status: false,
        message: "No Data",
        callDataDaily: callData,// Include the counts of each ChannelStatus
        callDataTrafic,
        frequentCall,
        currentCall
      })
    }

  } catch (error) {
    console.log(error);
    res.status(404).json({
      status: false,
      message: "No Data"
    })

  }

};

// Remove Update Dashboard Features
exports.removeUpdateDashboardFeatures = async (req, res) => {

  const { userId, dashboardName } = req.body;

  // RemoveUpdateDashboardFeatures
  if (!userId) {
    res.status(400).json({ status: false, statusText: "userId Not Found" });
  }
  if (!dashboardName) {
    res.status(400).json({ status: false, statusText: "Dashboard Name Not Found" });
  }
  try {
    const [result] = await dashboardModel.updateDashboard(userId, dashboardName)

    if (result) {
      res.status(200).json({
        status: true,
        statusText: 'updated Successfully',
      });
    } else {
      res.status(404).json({
        status: false,
        message: "No Data",
      })
    }

  } catch (error) {
    console.log(error);
    res.status(404).json({
      status: false,
      message: "No Data"
    })

  }

};
exports.fechgeneralsettings = async (req, res) => {
  try {

    const { userId } = req.body
    const [result] = await dashboardModel.fetchgeneralsettings(userId)
    if (result) {
      res.status(200).json({
        status: true,
        data: result,
      });
      await audit.auditTrailFunction(req.body.adminUserId, 'DASHBOARD', 'READ', `Dashboard Live accessed`, 'dgCallRecordingDashboardUserFeature', 0, null, null, null);
    } else {
      res.status(404).json({
        status: false,
        message: "No Data",
      })
    }
  } catch (error) {

  }



}
exports.frequantcall = async (req, res) => {

  try {
    const dates = await getLastWeekLastYear();

    let { date, userId } = req.body

    let startData;
    let endDate;
    if (!date) {
      startData = dates.thisMonthStart;
      endDate = dates.today;
    }
    switch (date) {
      case "today":

        startData = dates.today;
        endDate = dates.tomorrow;

        break;
      case "week":

        startData = dates.thisWeekStart;
        endDate = dates.today;

        break;
      case "month":

        startData = dates.thisMonthStart;
        endDate = dates.today;

        break;

      case "year":

        startData = dates.thisYearStart;
        endDate = dates.today;


        break;


      default:
        break;
    }
    const getFrequentCall = await dashboardModel.getFrequentCall(startData, endDate)
    if (getFrequentCall) {
      res.status(200).json({
        status: true,
        data: getFrequentCall[0][0],
      });
    } else {
      res.status(404).json({
        status: false,
        message: "No Data",
      })
    }


  } catch (error) {
    console.error("Error fetching call type traffic:", error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message
    });

  }
}
exports.calltypetraffic = async (req, res) => {


  try {
    const dates = await getLastWeekLastYear();

    let { date, userId } = req.body

    let startData;
    let endDate;

    if (!date) {
      startData = dates.thisMonthStart;
      endDate = dates.today;
    }
    switch (date) {
      case "today":

        startData = dates.today;
        endDate = dates.tomorrow;


        break;
      case "week":

        startData = dates.thisWeekStart;
        endDate = dates.today;

        break;
      case "month":

        startData = dates.thisMonthStart;
        endDate = dates.today;

        break;

      case "year":

        startData = dates.thisYearStart;
        endDate = dates.today;


        break;


      default:
        break;
    }
    const calltypeResult = await dashboardModel.getCallTypeTraffic(startData, endDate)

    const transformedData = calltypeResult[0][0].reduce((acc, item) => {



      const formattedDate = moment(item.callDate).format("DD-MM-YYYY");

      acc[formattedDate] = {
        totalIncomingCalls: item.totalIncomingCalls,
        totalOutgoingCalls: item.totalOutgoingCalls,
        totalAttendedCalls: item.totalAttendedCalls,
        totalMissedCalls: item.totalMissedCalls
      };

      return acc;
    }, {});


    if (calltypeResult) {
      res.status(200).json({
        status: true,
        data: transformedData,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "No Data",
      })
    }


  } catch (error) {
    console.error("Error fetching call type traffic:", error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message
    });
  }

}
exports.concurrentcall = async (req, res) => {

  try {
    const dates = await getLastWeekLastYear();

    let { date, userId } = req.body

    let startData;
    let endDate;
    if (!date) {
      startData = dates.thisMonthStart;
      endDate = dates.today;
    }
    switch (date) {
      case "today":

        startData = dates.today;
        endDate = dates.tomorrow;

        break;
      case "week":

        startData = dates.thisWeekStart;
        endDate = dates.today;

        break;
      case "month":

        startData = dates.thisMonthStart;
        endDate = dates.today;

        break;

      case "year":

        startData = dates.thisYearStart;
        endDate = dates.today;


        break;


      default:
        break;
    }
    const concurrrnteResult = await dashboardModel.getConcurrentCall(startData, endDate)

    const extractedData = concurrrnteResult[0][0]; // Extract the correct data level

    const transformedData = extractedData.reduce((acc, item) => {


      acc[moment(item.callDate).format('DD-MM-YYYY')] = {
        maxConcurrentCalls: item.maxConcurrentCalls,
        peakOccurrences: item.peakOccurrences,
        peakTime: item.peakTime ? moment(item.peakTime).format('DD-MM-YYYY HH:mm:ss') : null
      };

      return acc;
    }, {});

    if (concurrrnteResult) {
      res.status(200).json({
        status: true,
        data: transformedData,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "No Data",
      })
    }


  } catch (error) {
    console.error("Error fetching call type traffic:", error);
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message
    });
  }

}
exports.siptrunkeoneDashboard = async (req, res) => {

  try {
    const dates = await getLastWeekLastYear();

    let { date, sort } = req.body

    log.info(req.body)
    let startData;
    let endDate;
    const pagenumber = 1;
    const recorderPage = 10;
    if (!date) {
      startData = dates.thisMonthStart;
      endDate = dates.today;
    }
    switch (date) {
      case "today":

        startData = dates.today;
        endDate = dates.tomorrow;

        break;
      case "week":

        startData = dates.thisWeekStart;
        endDate = dates.today;

        break;
      case "month":

        startData = dates.thisMonthStart;
        endDate = dates.today;

        break;

      case "year":

        startData = dates.thisYearStart;
        endDate = dates.today;


        break;


      default:
        break;
    }
    const concurrrnteResult = await dashboardModel.getziptrunke1recoder(pagenumber, recorderPage, sort, startData, endDate)
    const extractedData = concurrrnteResult[0][1]; // Extract the correct data level
    const transformedData = extractedData.reduce((acc, item) => {
      acc[item.extensionNumber] = {
        totalIncomingCalls: item.totalIncomingCalls,
        totalOutgoingCalls: item.totalOutgoingCalls,
      };
      return acc;
    }, {});

    if (concurrrnteResult) {
      res.status(200).json({
        status: true,
        data: transformedData,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "No Data",
      })
    }


  } catch (error) {
    console.error("Error fetching call type traffic:", error);
    log.error(error)
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
}

async function getLastWeekLastYear() {
  const today = new Date();

  // Function to format date as 'YYYY-MM-DD HH:MM:SS'
  const formatDateTime = (date) => {
    return date.toISOString().split('T')[0] + ' 00:00:00';
  };

  // Calculate last year, last week, last month
  const lastYear = new Date(today);
  lastYear.setFullYear(today.getFullYear() - 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  // Calculate this week, this month, this year
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());

  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

  const thisMonthStart = new Date(today);
  thisMonthStart.setDate(1);

  const thisMonthEnd = new Date(thisMonthStart);
  thisMonthEnd.setMonth(thisMonthStart.getMonth() + 1, 0);

  const thisYearStart = new Date(today);
  thisYearStart.setMonth(0, 1); // Set to January 1st of the current year

  // Calculate tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Return the formatted dates
  return {
    today: formatDateTime(today),
    tomorrow: formatDateTime(tomorrow), // Added tomorrow's date
    lastWeek: formatDateTime(lastWeek),
    lastMonth: formatDateTime(lastMonth),
    lastYear: formatDateTime(lastYear),
    thisWeekStart: formatDateTime(thisWeekStart),
    thisWeekEnd: formatDateTime(thisWeekEnd),
    thisMonthStart: formatDateTime(thisMonthStart),
    thisMonthEnd: formatDateTime(thisMonthEnd),
    thisYearStart: formatDateTime(thisYearStart),
  };
}
