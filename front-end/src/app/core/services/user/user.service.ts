import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { SharedService } from '../../shared/share.service';

const options = { headers: new HttpHeaders() }
@Injectable({
  providedIn: 'root',

})
export class UserService {
 

  BaseUrl: string = `/api/_user`;
  BaseUrlReport: string = `/api/_reports`;
  settingUrl:string =`api/_ldap`;
  licenseUrl:string =`api/_license`;
  test: any = []
  loginUser = new BehaviorSubject({})
  constructor(private http: HttpClient
  ) {
  
   }
  private recorderSubject = new BehaviorSubject<{ recorderValue: string }>({ recorderValue: '' });
  // get token for append to api calls


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

  //  api to login user with DB 
  login(data: any) {
    return this.http.post(`${this.BaseUrl}/login`, data)
  }
    //  api to logout user 
  logOut(body:any){
    return this.http.post(`${this.BaseUrl}/logOut`,body)
  }
  //api for License validity Alert
  licenseValidityAlert(){
    return this.http.post(`${this.licenseUrl}/validityChecking`,{},this.appendToken());
  }
  getEmployees(body: any) {
    return this.http.post(`${this.BaseUrl}/getEmployees`, body, this.appendToken())
  }
  hierarchyNames(body: any) {
    return this.http.post(`${this.BaseUrl}/hierarchyNames`, body, this.appendToken())
  }
  
  updateEmployees(body: any) {
    return this.http.post(`${this.BaseUrl}/updateEmployees`, body, this.appendToken())
  }
  addEmployees(body: any) {
    return this.http.post(`${this.BaseUrl}/addEmployees`, body, this.appendToken())
  }
  searchData(data:any){
    return this.http.post(`${this.BaseUrl}/SearchData`, data, this.appendToken());
  }

  // api for insert location
  addLocation(body: any) {
    return this.http.post(`${this.BaseUrl}/addLocation`, body, this.appendToken())
  }
  // api for get location,department,division
  getLocationDepartmentDivision(body: any) {
    return this.http.post(`${this.BaseUrl}/getLocationDepartmentDivision`, body, this.appendToken())
  }
  getDepartmentByLocation(body:any){
    return this.http.post(`${this.BaseUrl}/getDepartmentByLocation`, body,this.appendToken())
  }
  getDivisionBylocation(body:any){
    return this.http.post(`${this.BaseUrl}/getDivisionBylocation`, body,this.appendToken())
  }
  getDivisionByDept(body:any){
    return this.http.post(`${this.BaseUrl}/getDivisionByDept`, body,this.appendToken())
  }
   // api for update location
  updateLocation(body:any){
    return this.http.post(`${this.BaseUrl}/updateLocation`, body,this.appendToken())
  }
  // api for delete location
  deleteLocation(body: any) {
    return this.http.post(`${this.BaseUrl}/deleteLocation`, body, this.appendToken())
  }
  // api for insert department
  addDepartment(body: any) {
    return this.http.post(`${this.BaseUrl}/addDepartment`, body, this.appendToken())
  }
  updateDepartment(body: any) {
    return this.http.post(`${this.BaseUrl}/updateDepartment`, body, this.appendToken())
  }
  // api for delete department
  deleteDepartment(body: any) {
    return this.http.post(`${this.BaseUrl}/deleteDepartment`, body, this.appendToken())
  }
  // api for add division
  addDivision(body: any) {
    return this.http.post(`${this.BaseUrl}/addDivision`, body, this.appendToken())
  }
  // api for update division
  updateDivision(body: any) {
    return this.http.post(`${this.BaseUrl}/updateDivision`, body, this.appendToken())
  }
  // api for delete division
  deleteDivision(body: any) {
    return this.http.post(`${this.BaseUrl}/deleteDivision`, body, this.appendToken())
  }
  departmentList(body: any) {
    return this.http.post(`${this.BaseUrl}/departmentList`, body, this.appendToken())
  }
  deleteEmployees(body: any) {
    return this.http.post(`${this.BaseUrl}/deleteEmployees`, body, this.appendToken())
  }
  insertUsersExcel(body: any) {
    return this.http.post(`${this.BaseUrl}/insertUsersExcel`, body, this.appendToken())
  }
  //Extension
  getExtension(body: any) {
    return this.http.post(`${this.BaseUrl}/getExtensions`, body, this.appendToken());
  }
  getExtensionMapping(body:any){
    return this.http.post(`${this.settingUrl}/getExtensionMapping`,body, this.appendToken());
  }
  getMappingDetails(){
   return this.http.post(`${this.settingUrl}/getMappingDetails`,{},this.appendToken());
  }
  //Api for dropdown hierarchy selection 
  getHierachyMappingDetails(){
    return this.http.post(`${this.BaseUrl}/getHierachyMappingDetails`,{},this.appendToken());
   }
  //Api for save excel import employees hierarchy details
   MappingHeirarchyEmployee(body:any){
    return this.http.post(`${this.BaseUrl}/MappingHeirarchyEmployee`,body,this.appendToken());
  }
  getEmployeesByUserID(body:any){
    return this.http.post(`${this.settingUrl}/getEmployeesByUserID`,body,this.appendToken());
  }
  addExtension(body: any){
    return this.http.post(`${this.settingUrl}/addExtensionMapping`,body,this.appendToken());
  }
  mappingHierarchy(body:any){
    return this.http.post(`${this.settingUrl}/MappingHeirarchy`,body,this.appendToken());
  }
  updateExtension(body: any){
    return this.http.post(`${this.settingUrl}/addExtensionMapping`,body,this.appendToken());
  }
  deleteExtension(body: any){
    return this.http.post(`${this.settingUrl}/deleteExtensionMapping`,body,this.appendToken());
  }
  ExtensionfileUpload(body:any){
    return this.http.post(`${this.settingUrl}/ExtensionfileUpload`,body,this.appendToken());  
  }
  fileUploadUsers(data: any) {
    return this.http.post(`${this.BaseUrl}/UploadUsers`, data, this.appendToken());
  }
  fileUploadEmployees(body: any) {
    return this.http.post(`${this.BaseUrl}/UploadEmployees`, body, this.appendToken())
  }
  //Extension fileUploadExtension
  fileUploadExtension(body: any) {
    return this.http.post(`${this.settingUrl}/ExtensionfileUpload`, body, this.appendToken())
  }
  isExtensionExists(body:any){
    return this.http.post(`${this.settingUrl}/IsExtensionExists`, body, this.appendToken())
  }
    //Extension fileUploadExtension
    updateFileUploadedExtension(body: any) {
      return this.http.post(`${this.settingUrl}/updateFileUploadedExtension`, body, this.appendToken())
    }
    // api for frequent call Report 
  getfrequentCallReports(body: any) {
    return this.http.post(`${this.BaseUrlReport}/frequentCallReports`, body, this.appendToken())
  }
     // api for frequent call Report
  
  getAgentReport(body: any) {
    return this.http.post(`${this.BaseUrlReport}/agentReports`, body, this.appendToken())
  }
    // api for get filters extension ,Agents,Phonenumber filters
  getFilters(body: any) {
    return this.http.post(`${this.BaseUrl}/getFilters`, body, this.appendToken())
  }

  // api for get colorcode 
  getColorcode(body: any) {
    return this.http.post(`${this.BaseUrlReport}/colorCodeReports`, body, this.appendToken())
  }

  getColorcodeExcel(body: any) {
    return this.http.post(`${this.BaseUrlReport}/ColorCodeDetailExcelReport`, body, this.appendToken())
  }
  
  
}
