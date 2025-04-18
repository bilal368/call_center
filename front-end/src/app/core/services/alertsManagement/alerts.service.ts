import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SharedService } from '../../shared/share.service';

const options = { headers: new HttpHeaders() }

@Injectable({
  providedIn: 'root'
})
export class AlertsService {
  BaseUrl: string = `/api/_alerts`;
  userId:string=''
   constructor(private http: HttpClient,
    private sharedService:SharedService
  ) {
    sharedService.loginUserId$.subscribe((result:any)=>{
      	this.userId=result
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
  // api for manage multiple alerts actions
  manageAlerts(body:any) {
    return this.http.post(`${this.BaseUrl}/manageAlerts`,body,this.appendToken())
  }
  // api for get recorder types
  getRecorderTypes(){
    let body={}
    return this.http.post(`${this.BaseUrl}/getRecorderTypes`,body,this.appendToken())
  }
}
