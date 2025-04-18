import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SharedService } from '../../shared/share.service';

const options = { headers: new HttpHeaders() }
@Injectable({
  providedIn: 'root'
})
export class StationmonitoringService {

  BaseUrl: string = `/api/_user`;
  userId: string = ''
  constructor(private http: HttpClient,
    private sharedService: SharedService
  ) {
    sharedService.loginUserId$.subscribe((result: any) => {
      this.userId = result
    })
  }
  // get token for append to api calls
  appendToken() {
    let token = localStorage.getItem("token")
    let headers = new HttpHeaders()
    if (token) {

      headers = headers.append('authorization', token)

      options.headers = headers
    }
    return options
  }
  //Api to get redis data 
  getData(data: any) {
    return this.http.post(`${this.BaseUrl}/redisDataStation`, data, this.appendToken());
  }

  recordEnableDisable(data: any) {
    return this.http.post(`${this.BaseUrl}/updateRecorderEnableDisable`, data, this.appendToken())
  }


  // Avayarecordersettings(data:any){
  //   return this.http.post(`${this.BaseUrl}/insertrecordersettingredis`, data);
  // }
  // channelMapping(data:any){
  //   return this.http.post(`${this.BaseUrl}/channelmapping`, data);
  // }
  // channelMappingList(data:any){
  //   return this.http.post(`${this.BaseUrl}/channelmappinglist`, data);
  // }

  // deletechanneld(data:any){
  //   return this.http.post(`${this.BaseUrl}/deleteChannel`, data);
  // }

}
