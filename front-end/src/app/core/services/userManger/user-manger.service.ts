import { Injectable } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { SharedService } from '../../shared/share.service';
const options = { headers: new HttpHeaders() }
@Injectable({
  providedIn: 'root'
})
export class UserMangerService {
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
  //insert users api
  inserUserGroups(data: any) {
  
    return this.http.post(`${this.BaseUrl}/insertUsers`, data, this.appendToken())
  }
  //insert user group api
  insertUser(data: any) {

    return this.http.post(`${this.BaseUrl}/insertUsergroups`, data, this.appendToken())
  }
  //fecting user groups api
  getUserRolesgroups(data: any) {

    return this.http.post(`${this.BaseUrl}/getUsergroupsAlert`, data, this.appendToken());
  }
  //updateing user groups api
  updateUserRolesGroup(data: any) {

    return this.http.post(`${this.BaseUrl}/updateUsergroups`, data, this.appendToken());
  }
  //delete user groups api
  deleteUserGroups(data: any) {

    return this.http.post(`${this.BaseUrl}/deleteUsergroups`, data, this.appendToken());
  }
  //fetcing users details
  getUsers(data: any) {

    return this.http.post(`${this.BaseUrl}/getUsers`, data, this.appendToken());
  }
  //delete users api
  deleteUsers(data: any) {

    return this.http.post(`${this.BaseUrl}/deleteUsers`, data, this.appendToken());
  }
  //fecting users by id
  getUserGroupId(data: any) {

    return this.http.post(`${this.BaseUrl}/getUsersId`, data, this.appendToken());
  }
  getUserslistById(data:any){
    return this.http.post(`${this.BaseUrl}/getuserlistbyid`, data, this.appendToken());
  }
  //update users details
  updateUser(data: any) {
    return this.http.post(`${this.BaseUrl}/updateUsers`, data, this.appendToken());
  }

  searchData(data:any){
    return this.http.post(`${this.BaseUrl}/SearchData`, data, this.appendToken());
  }


  // new file updload
  //uploading users from the excel file

  fileUploadUsers(data: any) {
    return this.http.post(`${this.BaseUrl}/UploadUsers`, data, this.appendToken());
  }

  // fetching Languages
  getAllLanguages() {
    const data = {}
    return this.http.post(`${this.BaseUrl}/UserLanguages`, data, this.appendToken());
  }

  //Update Language
  updateUserlanguage(userId: any, languageId: any) {
    const data = { userId, languageId }
    return this.http.post(`${this.BaseUrl}/UpdateUserlanguage`, data, this.appendToken());
  }
  // unlock user when user locked due to incorrect tries
  unLockUser(body: any) {
    return this.http.post(`${this.BaseUrl}/unLockUser`, body, this.appendToken());

  }
}
