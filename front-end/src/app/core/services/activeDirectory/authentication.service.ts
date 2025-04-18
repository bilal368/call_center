import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, from, Observable, Subject } from 'rxjs';

const options = { headers: new HttpHeaders() }
export interface Message {
  type: 'Warning' | 'Error';
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private loginUser = new Subject<Message>();
  // added base url in environments 
  BaseUrl: string = `/api/_ldap`;
  messages$ = this.loginUser.asObservable();
  constructor(private http: HttpClient) { }

  // services for authentication purpose

  
  
  addError(text: string) {
    // console.log("function Calls", text);

    this.loginUser.next({ type: 'Error', text });
    this.messages$.subscribe(message => {
      console.log("message:", message);
    });
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
  //  api to login user with LDAP
  authentication(data: any) {
    return this.http.post(`${this.BaseUrl}/authentication`, data,this.appendToken())
  }
  //  api to fetch Hierarchy with LDAP
  hirechydata(data: any) {
    return this.http.post(`${this.BaseUrl}/Hierarchy`, data,this.appendToken())
  }
//  api to fetching employee from LDAP
  employeeDataMapping(data: any) {
    return this.http.post(`${this.BaseUrl}/EmployeeDataMapping`, data,this.appendToken())
  }
  //  api to saving employee data from LDAP to database
  savingempolyeData(data:any){
    return this.http.post(`${this.BaseUrl}/EmployeeDataSaving`, data,this.appendToken())
  }
    //  api to get all location hierarchy from LDAP
  getHirechyDataAll(data:any){
    return this.http.post(`${this.BaseUrl}/HierarchySearch`,data,this.appendToken())
  }
  getUserRole(data:any){
    return this.http.post(`${this.BaseUrl}/getUserGroups`, data,this.appendToken())

  }
  saveUserRole(data:any){
    return this.http.post(`${this.BaseUrl}/saveUserRoles`, data,this.appendToken())

  }
  //  api to  save hierarchy
  saveHierarchy(data:any){
    return this.http.post(`${this.BaseUrl}/HierarchySave`, data,this.appendToken())

  }
}
