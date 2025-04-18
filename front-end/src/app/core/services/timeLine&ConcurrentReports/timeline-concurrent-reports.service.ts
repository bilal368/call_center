import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimelineConcurrentReportsService {
  BaseUrl: string = `/api/_reports`;

  constructor(private http: HttpClient) { }

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
  //  api to get timeline reports
  getTimelineReports(data: any) {
    return this.http.post(`${this.BaseUrl}/timelineReports`, data, this.appendToken())
  }
  //  api to get concurrent reports
  getConcurrentReports(data: any) {
    return this.http.post(`${this.BaseUrl}/concurrentReports`, data, this.appendToken())
  }
  // api to get 
  getFilters(body: any) {

    return this.http.post(`${this.BaseUrl}/fetchcallReportsDetails`, body, this.appendToken())
  }
  agentNamefilter(body: any) {

    return this.http.post(`${this.BaseUrl}/agentNamefilter`, body, this.appendToken())
  }
  agentCode(body: any) {

    return this.http.post(`${this.BaseUrl}/agentCode`, body, this.appendToken())
  }
  getDeletedUserDetails(body: any) {

    return this.http.post(`${this.BaseUrl}/getDeletedUserDetails`, body, this.appendToken())
  }
  getloginUserDetails(body: any) {

    return this.http.post(`${this.BaseUrl}/getloginUserDetails`, body, this.appendToken())
  }
}
