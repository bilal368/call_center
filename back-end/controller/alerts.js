let log = require("log4js").getLogger("Alerts Management");
const alerts = require('../model/alerts')
const alertsModel = alerts.alerts
const audit = require("../auditTrail");
// array of alerts item and id for adding id to query as per type
const alertItemWithIds = [
    { id: 1, name: "Not Recording" },
    { id: 2, name: "Network Failure" },
    { id: 3, name: "System Shutdown" },
    { id: 4, name: "System Time Change" },
    { id: 5, name: "IP Address Change" },
    { id: 6, name: "Disk Full" },
    { id: 7, name: "Client Connection Status" },
    { id: 8, name: "Recorder Settings" },
    { id: 9, name: "Data Path Change" },
    { id: 10, name: "User Account Locked" },
    { id: 11, name: "Record Deleted" },
    { id: 12, name: "Archive Status" },
    { id: 13, name: "Archive Reminder" },
    { id: 14, name: "Channel Busy" },
    { id: 15, name: "Channel Connection" }
];


exports.manageAlerts = async (req, res, next) => {
    const { action, alertItem, userId, userListforAdd, 
        userListwithAlerts,timeInterval,archiveInitialValue,adminUserId} = req.body; // Extract action from request body
    let recorderType=req.body.recorderType
    let alertItemId;
    if(alertItem){
        alertItemId = alertItemWithIds.find(item => item.name === alertItem);        
    }
    if(recorderType==undefined||recorderType==0){
        recorderType=null
    }
    try {
        switch (action) {
            case 'getUsers':
                
                const users = await alertsModel.getUsers(alertItemId.id,recorderType);
                if (users.length == 0 || !users) {
                    res.status(404).json({ status: false, statusText: "No data found" })
                }
                else {
                    res.status(200).json({ users, status: true, statusText: "Users fetched successfully" })

                }
                break;
            case 'getUsersInAlerts':
                const userList = await alertsModel.getUserList(alertItemId.id,recorderType)
                if (userList.length == 0 || !userList) {
                    res.status(404).json({ status: false, statusText: "No data found" })
                }
                else {
                    audit.auditTrailFunction(adminUserId, 'ALERT MANAGEMENT', 'READ', `ALERT MANAGEMENT-${alertItem} accessed`, 'dgAlertManagement', 0, null, null, null)
                    res.status(200).json({ userList, status: true, statusText: "Users fetched successfully" })

                }
                break;
            case 'getTimeIntervalData':
                const daysList = await alertsModel.getTimeIntervalData(alertItemId.id,recorderType);
                
                if (daysList.length == 0 || !daysList) {
                    res.status(404).json({ status: false, statusText: "No data found" })
                }
                else {
                    res.status(200).json({ daysList, status: true, statusText: "Time interval successfully" })

                }
                break;
            case 'getDiskAlertValue':
                alertItemId = alertItemWithIds.find(item => item.name === 'Disk Full');
                const diskAlert = await alertsModel.getDiskAlertValue(alertItemId.id);
                if (diskAlert.length == 0 || !diskAlert) {
                    res.status(404).json({ status: false, statusText: "No data found" })
                }
                else {
                    res.status(200).json({ diskAlert, status: true, statusText: "Data fetched successfully" })

                }
                break;
            case 'addUsersToAlerts':                
                const result = await alertsModel.addUserToAlerts(alertItemId.id, userListforAdd,recorderType);

                if (!result) {
                    res.status(503).json({ status: false, statusText: "Failed to insert user group" })
                }
                else {
                    audit.auditTrailFunction(adminUserId, 'ALERT MANAGEMENT', 'CREATE', `User(s) added to-${alertItem}`, 'dgAlertManagement', 0, null, null, null)

                    res.status(200).json({ result, status: true, statusText: "Users added successfully" })

                }
                break;
            case 'setAlertForUsers':
                const updatedAlert = await alertsModel.setAlertForUsers(userListwithAlerts,recorderType); // Pass relevant data from request body
                
                if (!updatedAlert.length || updatedAlert[0]?.affectedRows === 0) {
                    res.status(503).json({ status: false, statusText: "Failed to update alert" });
                }
                
                else {
                    audit.auditTrailFunction(adminUserId, 'ALERT MANAGEMENT', 'UPDATE', `Alerts updated for-${alertItem}`, 'dgAlertItemUser', 0, null, null, null)
                    res.status(200).json({ updatedAlert, status: true, statusText: "Alerts updated successfully" })

                }
                break;
            case 'setTimeInterval':
                const result2 = await alertsModel.setTimeInterval(timeInterval,alertItemId.id,recorderType); // Pass relevant data from request body
                  
                if (result2[0]?.affectedRows==0|| result2!=true) {
                    res.status(503).json({ status: false, statusText: "Failed to set time interval" })
                }
                else {
                    audit.auditTrailFunction(adminUserId, 'ALERT MANAGEMENT', 'UPDATE', 'Time interval updated', 'dgAlertDayTimeInterval', 0, null, null, null)
                    res.status(200).json({  status: true, statusText: "Time interval updated successfully" })

                }
                break;

            case 'removeUserFromAlerts':
                const result1 = await alertsModel.removeUserFromAlerts(alertItemId.id, userId); // Pass relevant data from request body
                audit.auditTrailFunction(adminUserId, 'ALERT MANAGEMENT', 'DELETE', `User removed successfully from-${alertItem}`, 'dgAlertItemUser', 0, null, null, null)
                res.status(200).json({ status: true, statusText: "User removed successfully", result1 }); // Consider returning the updated alerts (if applicable)
                break;

            case 'setPercentageForDiskFull':
                alertItemId = alertItemWithIds.find(item => item.name === 'Disk Full');
                const result3 = await alertsModel.setPercentageForDiskFull(alertItemId.id, archiveInitialValue); 
                if (result3[0].affectedRows==0) {
                    res.status(503).json({ status: false, statusText: "Failed to set disk full limit" })
                }
                else{
                    audit.auditTrailFunction(adminUserId, 'ALERT MANAGEMENT', 'UPDATE', 'Disk limit updated', 'dgAlertItem', 0, null, null, null)
                    res.status(200).json({ status: true, statusText: "Limit set successfully", result3 }); // Consider returning the updated alerts (if applicable)
                }
                break;//
            default:
                res.status(400).json({ error: 'Invalid action provided' });
        }
    } catch (error) {
        log.error(error);
        console.error(error)
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getRecorderTypes=async(req,res,next)=>{
    try {
        console.log("getRecorderTypes");
        const recorders = await alertsModel.getRecorderTypes();
                if (recorders.length == 0 || !recorders) {
                    res.status(404).json({ status: false, statusText: "No data found" })
                }
                else {
                    res.status(200).json({ recorders, status: true, statusText: "Recorders fetched successfully" })

                }
    } catch (error) {
        log.error(error);
        console.error(error)
        res.status(500).json({ error: 'Internal server error' });
    }
};


