import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { SharedService } from '../../shared/share.service';
const options = { headers: new HttpHeaders() }

@Injectable({
  providedIn: 'root'
})
export class AuthService {


  BaseUrl: string = `/api/_license`;
  userId:string=''
  private packagePermissionIds = new Subject<void>();
  // Observable that other components can subscribe to
  componentMethodCalled$ = this.packagePermissionIds.asObservable();
  setpackageIds(data: any) {
    this.packagePermissionIds.next(data);

  }
  constructor(private http: HttpClient,
    private sharedService:SharedService
  ) {
    sharedService.loginUserId$.subscribe((result:any)=>{
      	this.userId=result
    })
   }
  extractDataFromToken(token: any) {
    const jsonResult = JSON.parse(atob(token.split('.')[1])); 
    return {
      combinedPackageID: jsonResult.combinedPackageID, //for privileaged UI
      userName: jsonResult.userName,  //show user name
      languageFileName: jsonResult.languageFileName, //for language translation
      userId: jsonResult.userId, // for update language selecto
      roleId: jsonResult.roleId, // User roleId 
      userHierarchyId: jsonResult.userHierarchyId // User userHierarchyId 
    };
  }

  appendToken() {
    let token = localStorage.getItem('token')
    let headers = new HttpHeaders()
    if (token) {
      headers = headers.append('authorization', token)
      options.headers = headers
    }
    return options
  }

  // fetch license Key
  getLicenseKey() {
    const body = {}
    return this.http.post(`${this.BaseUrl}/fetchLicenseKey`, body, this.appendToken())
  }
  // validate license Key
  validateLicenseKey(enteredKey: any) {
    const body = { token: enteredKey }
    return this.http.post(`${this.BaseUrl}/validateLicenseKey`, body, this.appendToken())
  }
  // update license Key
  updateLicenseKey(enteredKey: any,internalFeatures:any, serialKey:any, amc:any) {
    const body = { token: enteredKey, internalFeatures, serialKey, amc }
    return this.http.post(`${this.BaseUrl}/insertLicenseKey`, body, this.appendToken())
  }
}
