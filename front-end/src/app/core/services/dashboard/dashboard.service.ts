import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { SharedService } from '../../shared/share.service';

const options = { headers: new HttpHeaders() }

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  BaseUrl: string = `/api/_dashboard`;
  licenseUrl: string = `/api/_license`;
  test: any = []
  userId: string = ''

  loginUser = new BehaviorSubject({})
  constructor(private http: HttpClient,
    private sharedService: SharedService
  ) {
    sharedService.loginUserId$.subscribe((result: any) => {
      this.userId = result
    })
  }
 
  // Api Header
  appendToken() {
    let token = localStorage.getItem("token")
    let headers = new HttpHeaders()
    if (token) {
      headers = headers.append('authorization', token)
      options.headers = headers
    }
    return options
  }

  // Get dashboard features
  fetchDashboardFeatures(userId: any) {
    const body = { userId }
    return this.http.post(`${this.BaseUrl}/fetchDashboardFeatures`, body, this.appendToken())
  }
  // Get Channel Status
  fetchChannelStatus() {
    const body = {}
    return this.http.post(`${this.BaseUrl}/channelStatus`, body, this.appendToken())
  }
  // Get User Details
  fetchusersDetails() {
    const body = {}
    return this.http.post(`${this.BaseUrl}/usersDetails`, body, this.appendToken())
  }
  // Get User Details
  fetchFilterSettingsDetails(userId: any) {
    const body = { userId }
    return this.http.post(`${this.BaseUrl}/fetchFilterSettings`, body, this.appendToken())
  }
  // update features
  updateDashboardFeatures(userId: any, datas: any, filterChannelTimeSettings: any, filterChannelCallSettings: any, selectedTabIndex: any, AgentfilterSettings: any, AgentCallfilterSettings: any) {
    const body = { userId, datas, filterChannelTimeSettings, filterChannelCallSettings, selectedTabIndex, AgentfilterSettings, AgentCallfilterSettings }
    return this.http.post(`${this.BaseUrl}/updateUserDashboardStatus`, body, this.appendToken())
  }
  fetchDialyTrafficReport(data: any) {
    const body = data;
    return this.http.post(`${this.BaseUrl}/dailyCallTrafficStatus`, body, this.appendToken())
  }
  //LivestreamaudioData
  stationMonitor(data: any) {

    const body = { uuid: data };


    return this.http.post(`${this.BaseUrl}/stationmonitorLiveStream`, body, this.appendToken())
  }
  stopStationMonitor(data: any) {
    const body = { uuid: data };
    return this.http.post(`${this.BaseUrl}/stoplivecall`, body, this.appendToken())
  }

  // Fetch Time Report
  fetchChannelTimeReport(data: any) {
    const body = data;
    return this.http.post(`${this.BaseUrl}/fetchChannelTime`, body, this.appendToken())
  }
  // Fetch Call Report
  fetchChannelCallReport(data: any,) {
    const body = data;
    return this.http.post(`${this.BaseUrl}/fetchChannelCall`, body, this.appendToken())
  }
  //fecth frequant dasborad
  fetchfrequantCall(data: any,) {
    const body = data;
    return this.http.post(`${this.BaseUrl}/frequantcalldasboard`, body, this.appendToken())
  }
  //dashborad calltype data
  calltypeTraffic(data: any) {
    const body = data;
    return this.http.post(`${this.BaseUrl}/calltypetrafficdasboard`, body, this.appendToken())
  }
  //dashboard concurrent data
  concurrentData(data: any,) {
    const body = data;
    return this.http.post(`${this.BaseUrl}/concurrentcalldashboard`, body, this.appendToken())
  }

  // api for  Fetch Extensions
  fetchExtensions() {
    const body = {}
    return this.http.post(`${this.BaseUrl}/fetchExtensions`, body, this.appendToken())
  }
  // api for  Fetch Extensions
  fetchUserExtensions(userId: any) {
    const body = { userId }
    return this.http.post(`${this.BaseUrl}/fetchUserExtensions`, body, this.appendToken())
  }
  // Fetch Agent Call Activity
  fetchAgentCall(data: any) {
    const body = data;
    return this.http.post(`${this.BaseUrl}/fetchAgentCall`, body, this.appendToken())
  }
  // Fetch Agent Time Report
  fetchAgentTime(data: any) {
    const body = data;
    return this.http.post(`${this.BaseUrl}/fetchAgentTime`, body, this.appendToken())
  }
  // Get User Details
  fetchFilterAgentSettings(userId: any) {
    const body = { userId }
    return this.http.post(`${this.BaseUrl}/fetchFilterAgentSettings`, body, this.appendToken())
  }
  // api for Fetch Agent Code
  fetchAgentCode() {
    const body = {}
    return this.http.post(`${this.BaseUrl}/fetchAgentCode`, body, this.appendToken())
  }
  // removeUpdateDashboardFeatures
  removeUpdateDashboardFeatures(userId: any, dashboardName: any) {
    const body = { userId, dashboardName }
    return this.http.post(`${this.BaseUrl}/removeUpdateDashboardFeatures`, body, this.appendToken())
  }
  // general setting data
  fetchgeneralsetting() {
    const body = { userId: this.userId }
    return this.http.post(`${this.BaseUrl}/fectchgeneralsetting`, body, this.appendToken())
  }
  fetchsiptrunEone(data: any) {
    const body = data
    return this.http.post(`${this.BaseUrl}/siptrunkeoneDashboard`, body, this.appendToken())
  }
  fetchlicenseData() {
    return this.http.post(`${this.licenseUrl}/licensevalidationDashboard`, {}, this.appendToken())
  }
}
