import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RolesAndPrivilegesService {
  BaseUrl: string = `/api/_rolesAndPrivileges`;
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
  // api for get users and their privileages
  getUsersByPrivileages(body: any) {
    return this.http.post(`${this.BaseUrl}/usersByRole`, body, this.appendToken())
  }
  // api for get all privileages 
  getFeatures(body: any) {
    return this.http.post(`${this.BaseUrl}/getPrivileages`, body, this.appendToken())
  }
  // api for  get Data for Data Restrictions
  getDataforDataRestrictions(body: any) {
    return this.http.post(`${this.BaseUrl}/getDataforDataRestrictions`, body, this.appendToken())
  }
  // api for save Privileages of user/group
  saveRolesAndPrivileages(body: any) {
    return this.http.post(`${this.BaseUrl}/saveRolesAndPrivileages`, body, this.appendToken())
  }
}
