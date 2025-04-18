const db = require('../utils/DAL');
class recSettings {
  constructor(userName, password) {
    this.userName = userName;
    this.password = password;
  }
  static async insertrecordersettings(recorderTypeId,
    dataPath,
    localIPAddress,
    localPort,
    AESServerIPAddress,
    AESPort,
    AESUsername,
    AESPassword,
    switchConnectionName,
    switchIPAddress,
    IPCH,
    RTPIPAddress,
    protocolVersion,
    logStatus,
    channelIndex,
    codec) {
    try {

      const inserdata = await db.execute(`INSERT INTO dgRecorderConfiguration(
            recorderTypeId, 
            dataPath, 
            localIPAddress, 
            localPort, 
            AESServerIPAddress, 
            AESPort, 
            AESUsername, 
            AESPassword, 
            switchConnectionName, 
            switchIPAddress, 
            IPCH, 
            RTPIPAddress, 
            protocolVersion, 
            logStatus, 
            channelIndex, 
            codec)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [recorderTypeId,
        dataPath,
        localIPAddress,
        localPort,
        AESServerIPAddress,
        AESPort,
        AESUsername,
        AESPassword,
        switchConnectionName,
        switchIPAddress,
        IPCH,
        RTPIPAddress,
        protocolVersion,
        logStatus,
        channelIndex,
        codec])

      return [inserdata];

    } catch (error) {
      console.log(error);
      throw error;


    }
  }
  static async channelmapping(recorderTypeId, channel, mappedExtensionMacIP, password) {
    try {
      const inserdata = await db.execute(`INSERT INTO dgRecorderChannelMapping(recorderTypeId,channel,mappedExtensionMacIP,password)VALUES(?,?,?,?)`, [recorderTypeId, channel, mappedExtensionMacIP, password])
      return inserdata;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  static async channelvalidation(recorderTypeId, channel) {
    try {

      const channeldata = await db.execute(`SELECT * FROM dgRecorderChannelMapping WHERE channel = ? AND active=1 AND recorderTypeId=?`, [channel, recorderTypeId])
      return channeldata;
    } catch (error) {
      console.log(error);
      throw error;

    }
  }
  static async DIDmappingList(limit, offset,recorderTypeId) {
    try {      

      const data = await db.execute(`SELECT didLabelingId,didNumber,didLabel from dgDIDLabeling WHERE active=1 AND recorderTypeId=? LIMIT ? OFFSET ?`, [recorderTypeId,limit, offset])
      return data;
    } catch (error) {
      console.log(error);
      throw error;

    }
  }
  static async didMappingCount(recorderTypeId) {
    try {
      const data = await db.execute(`SELECT COUNT(*) AS totalCount FROM dgDIDLabeling WHERE active = 1 AND recorderTypeId = ?;`,[recorderTypeId])
      return data[0];
    } catch (error) {
      console.log(error);
      throw error;


    }
  }
  static async labelDuplication(didNumber) {
    try {

      const isData = await db.execute(`SELECT * FROM dgDIDLabeling WHERE didNumber=? and active=1`, [didNumber])
      return isData;
    } catch (error) {
      console.log(error);
      throw error;

    }
  }
  static async labelInsert(recorderTypeId, didNumber, didLabel) {
    try {      
      const insertData = await db.execute(`INSERT INTO dgDIDLabeling
        (recorderTypeId ,didNumber,didLabel) VALUES(?,?,?) `, [recorderTypeId, didNumber, didLabel])
      return insertData;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  static async updateLabel( didLabel,didLabelingId) {
    try {
        const updateData = await db.execute(
            `UPDATE dgDIDLabeling SET didLabel = ? WHERE didLabelingId=?`,
            [didLabel,didLabelingId]
        );
        return updateData;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
static async deleteLabel( didLabelingId) {
  try {
      const updateData = await db.execute(
          `UPDATE dgDIDLabeling SET active = 0 WHERE didLabelingId=?`,
          [didLabelingId]
      );
      return updateData;
  } catch (error) {
      console.error(error);
      throw error;
  }
}

  static async Updatechannelmapping(recorderTypeId, channel, mappedExtensionMacIP, password, recorderChannelMappingId) {
    try {
      const inserdata = await db.execute(`UPDATE dgRecorderChannelMapping SET recorderTypeId = ?, channel = ?, mappedExtensionMacIP = ?, password = ? WHERE recorderChannelMappingId = ?;`, [recorderTypeId, channel, mappedExtensionMacIP, password, recorderChannelMappingId])
      return inserdata;
    } catch (error) {
      console.log(error);
      throw error;

    }
  }
  static async channelmappinglist(limit, offset) {
    try {

      const data = await db.execute(`SELECT recorderChannelMappingId,channel,mappedExtensionMacIP,password FROM dgRecorderChannelMapping WHERE active=1 AND recorderTypeId=2  LIMIT ? OFFSET ?`, [limit, offset])
      return data;
    } catch (error) {
      console.log(error);
      throw error;

    }
  }

  static async channelmappingCount() {
    try {
      const data = await db.execute(`SELECT COUNT(*) AS totalCount FROM dgRecorderChannelMapping WHERE active = 1 AND recorderTypeId = 2;`)
      return data[0];
    } catch (error) {
      console.log(error);
      throw error;


    }
  }

  static async deletechannel(recorderChannelMappingId) {
    try {

      const data = await db.execute(`UPDATE dgRecorderChannelMapping SET active=0 WHERE recorderChannelMappingId=?`, [recorderChannelMappingId])
      return data;
    } catch (error) {
      console.log(error);
      throw error;

    }
  }
  static async channelmappingsiptrunk(recorderTypeId, channel, mappedExtensionMacIP) {
    try {
      const inserdata = await db.execute(`INSERT INTO dgRecorderChannelMapping(recorderTypeId,channel,mappedExtensionMacIP)VALUES(?,?,?)`, [recorderTypeId, channel, mappedExtensionMacIP])
      return inserdata;
    } catch (error) {
      console.log(error);
      throw error;

    }
  }
  static async channelmappinglistsiptrunk(limit, offset) {
    try {

      const data = await db.execute(`SELECT recorderChannelMappingId,channel,mappedExtensionMacIP FROM dgRecorderChannelMapping WHERE active=1 AND recorderTypeId=3 LIMIT ? OFFSET ?`, [limit, offset])
      return data;
    } catch (error) {
      console.log(error);
      throw error;

    }
  }
  static async channelmaapingsigtrunlcount() {
    try {
      const data = await db.execute(`SELECT COUNT(*) AS totalCount FROM dgRecorderChannelMapping WHERE active = 1 AND recorderTypeId = 3;`)
      return data[0];
    } catch (error) {
      console.log(error);
      throw error;


    }
  }
  static async fetchTokenConfig() {
    try {

      const data = await db.execute(`SELECT token from dgConfig where status='true'`)

      return data[0];
    } catch (error) {
      console.log(error);
      throw error;

    }
  }
  static async digitarecorderevent(recorder, eventvalue, category, isstaticevent) {
    try {
      const insertdata = await db.execute(`INSERT INTO dgDigitalRecorderEvent (digitalRecorderEvent, eventValue,category,isStaticEvent) VALUES (?,?,?,?)`, [recorder, eventvalue, category, isstaticevent])
      return insertdata;
    } catch (error) {
      console.log(error)
      throw error;


    }
  }
  static async digitarecordereventalexist(recorderevent, category) {
    try {
      const data = await db.execute(`SELECT COUNT(*) AS recordCount FROM dgDigitalRecorderEvent WHERE digitalRecorderEvent=? AND category = ?`, [recorderevent, category])

      return data[0]
    } catch (error) {
      console.log(error);
      throw error;


    }
  }
  static async digitalrecoredereventget() {
    try {
      const data = await db.execute(`SELECT *  FROM dgDigitalRecorderEvent`)

      return data[0]
    } catch (error) {
      console.log(error);
      throw error;


    }
  }
  static async digitalrecoredereventdelete(event) {
    try {
      const data = await db.execute(`DELETE FROM dgDigitalRecorderEvent where digitalRecorderEvent=?`, [event])

      return data[0]
    } catch (error) {
      console.log(error);
      throw error;


    }
  }
}


module.exports = { recSettings };