import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})

export class LoginTrackReportServiceComponent {


  BaseUrlReport: string = `/api/_reports`;

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

    // api for get Login Track report
    getloginTrackReports(body: any) {
      return this.http.post(`${this.BaseUrlReport}/loginTrackReports`, body, this.appendToken())
    }
    // api for get LoginTrack report filters
    getFiltersloginTrack(body: any) {
      return this.http.post(`${this.BaseUrlReport}/getFiltersloginTrack`, body, this.appendToken())
    }

}
