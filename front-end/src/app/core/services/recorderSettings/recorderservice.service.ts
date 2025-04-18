import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SharedService } from '../../shared/share.service';
const options = { headers: new HttpHeaders() }
@Injectable({
  providedIn: 'root'
})
export class RecorderserviceService {
  BaseUrl: string = `/api/_recorders`;
  userId: string = ''
  constructor(private http: HttpClient,
    private sharedService: SharedService
  ) {
    sharedService.loginUserId$.subscribe((result: any) => {
      this.userId = result
    })
  }

  appendToken() {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    // Add Authorization header
    if (token) {
      headers = headers.set('Authorization', token); // Use .set() instead of .append()
    }
    const options = {
      headers: headers
    };
    return options;
  }

  // API to insert recorder settings into Redis for Avaya
  Avayarecordersettings(data: any) {
    return this.http.post(`${this.BaseUrl}/insertRecorderSettingRedis`, data, this.appendToken());
  }

  // API to map a channel
  channelMapping(data: any) {
    return this.http.post(`${this.BaseUrl}/channelMapping`, data, this.appendToken());
  }

  // API to get the list of channel mappings
  channelMappingList(data: any) {
    return this.http.post(`${this.BaseUrl}/channelMappingList`, data, this.appendToken());
  }

  // API to update channel mapping
  updateChannelmapping(data: any) {
    return this.http.post(`${this.BaseUrl}/updatechannel`, data, this.appendToken());
  }

  // API to delete a channel
  deletechanneld(data: any) {
    return this.http.post(`${this.BaseUrl}/deleteChannel`, data, this.appendToken());
  }

  // API to map SIP trunk channels
  channelmappingsiptrunk(data: any) {
    return this.http.post(`${this.BaseUrl}/channelMappingSiptrunk`, data, this.appendToken());
  }

  // API to update SIP trunk channel mapping
  updatechannelsiptrunk(data: any) {
    return this.http.post(`${this.BaseUrl}/updatechannelsiptrunk`, data, this.appendToken());
  }

  // API to get the list of SIP trunk channel mappings
  channelmappingsiptrunklist(data: any) {
    return this.http.post(`${this.BaseUrl}/channelMapListSiptrunk`, data, this.appendToken());
  }

  // API to get the list of SIP trunk devices
  devicelist(data: any) {
    return this.http.post(`${this.BaseUrl}/siptrunkDevicelist`, data, this.appendToken());
  }

  // API to insert recorder settings for SIP trunk
  siptrunkRecodersettings(data: any) {
    return this.http.post(`${this.BaseUrl}/siptrunkRecorderSettings`, data, this.appendToken());
  }

  // API to insert analogue recorder settings
  InsertAngloueRecorderSetting(data: any) {
    return this.http.post(`${this.BaseUrl}/insertanalogueRecorderSettings`, data, this.appendToken());
  }

  // API to insert analogue channel settings
  channelsettingsinsertanalouge(data: any) {
    return this.http.post(`${this.BaseUrl}/channelSettingsInsertAnalouge`, data, this.appendToken());
  }

  // API to get analogue channel settings data
  getChannelsettingsDataAnalogue(data: any) {
    return this.http.post(`${this.BaseUrl}/getChannelsettingsDataAnalogue`, data, this.appendToken());
  }
  getsettingsDataAngloue(data: any) {
    return this.http.post(`${this.BaseUrl}/GetsettingDataAnalogue`, data, this.appendToken());
  }

  // API to insert media proxy settings
  insertMediaproxysettings(data: any) {
    return this.http.post(`${this.BaseUrl}/mediaProxySettings`, data, this.appendToken());
  }

  // API to get recorder settings data for SIP trunk
  siptrunkRecorderSettingsGetData(data: any) {
    return this.http.post(`${this.BaseUrl}/siptrunkRecorderSettingsGetData`, data, this.appendToken());
  }

  // API to get media proxy data
  getMediaproxyData(data: any) {
    return this.http.post(`${this.BaseUrl}/GetmediaporxyData`, data, this.appendToken());
  }

  // API to insert digital recorder settings
  InsertDigitalRecodersetting(data: any) {
    return this.http.post(`${this.BaseUrl}/digitalRecordersettings`, data, this.appendToken());
  }
  //Api to get digital settings data
  getdigitalRecorderData(data: any) {
    return this.http.post(`${this.BaseUrl}/getDigitalDataSettings`, data, this.appendToken());
  }
  //API to delete analogue data
  deleteAnalogue(data: any) {
    return this.http.post(`${this.BaseUrl}/deleteAnalogueData`, data, this.appendToken());
  }

  // API to get all location hierarchy from LDAP
  getHirechyDataAll(data: any) {
    return this.http.post(`${this.BaseUrl}/HierarchySearch`, data, this.appendToken());
  }
  //API call from volatge and graph
  getVoltageEnergy(data: any) {
    return this.http.post(`${this.BaseUrl}/VoltageEnergy`, data, this.appendToken());
  }
  //API call for digital recorderevent
  digitaleventmanegment(data: any) {
    return this.http.post(`${this.BaseUrl}/digitalrecorderEvent`, data, this.appendToken());
  }
  //Api for getting recorder data
  digitalrecordergetevent(data: any) {
    return this.http.post(`${this.BaseUrl}/getDigitalRecorderData`, data, this.appendToken());
  }
  //for delete channel mapping
  digitalrecorderdeleteevent(data: any) {
    return this.http.post(`${this.BaseUrl}/deleteEventData`, data, this.appendToken());

  }
  //API digital events
  digitalrecordereventsredis(data: any) {
    return this.http.post(`${this.BaseUrl}/eventsDataRedis`, data, this.appendToken());
  }
  //Api for get even data from redis
  getDigitalrecordEvents(data: any) {
    return this.http.post(`${this.BaseUrl}/GeteventDataFromredis`, data, this.appendToken());
  }
  //API digital events removing
  digitalrecordereventsremoved(data: any) {
    return this.http.post(`${this.BaseUrl}/removeFromRedisevent`, data, this.appendToken());
  }
  //API E1 recorder settings
  geteonerecorderData(data: any) {
    return this.http.post(`${this.BaseUrl}/getEoneRecorderdata`, data, this.appendToken());
  }

  //API E1 recorder settings insertion
  insertE1recoderData(data: any) {
    return this.http.post(`${this.BaseUrl}/insertEoneRecorder`, data, this.appendToken());
  }
  //API to get DID labeled data
  getDIDlabelData(data: any) {
    return this.http.post(`${this.BaseUrl}/getDIDlabelData`, data, this.appendToken());
  }
  //API to add DID label 
  saveDIDlabel(data: any) {
    return this.http.post(`${this.BaseUrl}/saveDIDlabel`, data, this.appendToken());
  }
  //API to update  DID label 
  updateDIDlabel(data: any) {
    return this.http.post(`${this.BaseUrl}/updateDIDlabel`, data, this.appendToken());
  }
  //API to delete  DID label 
 deleteDIDlabel(data: any) {
    return this.http.post(`${this.BaseUrl}/deleteDIDlabel`, data, this.appendToken());
  }
  licenseUrl: string = `/api/_license`;
  fetchlicenseData() {
    return this.http.post(`${this.licenseUrl}/licensevalidationDashboard`, {}, this.appendToken())
  }

}
