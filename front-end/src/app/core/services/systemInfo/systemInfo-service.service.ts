import { HttpClient, HttpEvent, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
const options = { headers: new HttpHeaders() }

@Injectable({
  providedIn: 'root'
})
export class SystemInfoServices {

  BaseUrl: string = `/api/_systemInfo`;
  BaseUrlImage: string = `/api`;
  // Create a BehaviorSubject to hold the logout state (true when logged out)
  logoChanged = new BehaviorSubject<boolean>(false);
  // Observable that other components can subscribe to
  logoChangedStatus$ = this.logoChanged.asObservable();
  constructor(private http: HttpClient) { }
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
  // api to get registration details
  getRegistrationDetails() {
    return this.http.post(`${this.BaseUrl}/getRegistrationDetails`, {}, this.appendToken())

  }

  // Update Audit Trail Report
  updateAuditTrailReport(loginId: any, moduleName: any, action: any, actionDescription: any) {
    const tableName = 'dgOrganizationDetails'
    const body = {
      adminUserId: loginId,
      moduleName: moduleName,
      action: action,
      actionDescription: actionDescription,
      tableName,
      recordIds: 0,
      oldValue: '',
      newValue: [],
      ipAddress: ''
    };

    return this.http.post(`${this.BaseUrl}/updateAuditTrailReport`, body, this.appendToken())
  }

  // api to get registration details
  saveRegistration(body: any) {
    return this.http.post(`${this.BaseUrl}/saveRegistration`, body, this.appendToken())

  }

  // api to upload logo
  upload(file: any) {
    return this.http.post(`${this.BaseUrl}/uploadLogo`, file, this.appendToken())
  }
  // api to upload logo
  getLogoName() {
    return this.http.get(`${this.BaseUrl}/getLogoName`)
  }
  // api to get logo
  getFiles(logoFileName: string) {
    return this.http.get(`${this.BaseUrlImage}/_uploads/logoImages/${logoFileName}`, {
      responseType: 'blob' as 'blob'
    });
  }
  // api to get Disk Usage
  getDiskUsage() {
    return this.http.get(`${this.BaseUrl}/getDiskUsage`, this.appendToken())
  }
  // api to manualArchive
  manualArchive(body: any) {
    return this.http.post(`${this.BaseUrl}/manualArchive`, body, this.appendToken())
  }
  // api to autoarchive
  autoarchive(body: any) {
    return this.http.post(`${this.BaseUrl}/autoArchive`, body, this.appendToken())
  }
  // api to get Default Location
  getDefaultLocation(body: any) {
    return this.http.post(`${this.BaseUrl}/getDefaultLocation`, body, this.appendToken());
  }
  getArchiveSetting(){
    return this.http.get(`${this.BaseUrl}/getArchiveSetting`,  this.appendToken());
  }
  // api to mount location
  mountCIFS(body: any) {
    return this.http.post(`${this.BaseUrl}/mountCIFS`, body, this.appendToken())

  }
  // api to unmount location
  unMountCIFS(body: any) {
    return this.http.post(`${this.BaseUrl}/unMountCIFS`, body, this.appendToken())

  }
  // api to save Auto-Delete settings
  saveAutoDelete(body: any) {
    return this.http.post(`${this.BaseUrl}/saveAutoDelete`, body, this.appendToken())

  }
  // api to save Auto-Delete settings
  getAutoDeleteSettings() {
    return this.http.post(`${this.BaseUrl}/getAutoDeleteSettings`, {}, this.appendToken())

  }
  // API to save Mailer Settings
  saveMailSettings(body: any) {
    return this.http.post(`${this.BaseUrl}/saveMailSettings`, body, this.appendToken());
  }
  // API to get SMTP settings
  getSMTPSettings() {
    return this.http.get(`${this.BaseUrl}/getSMTPmailSettings`, this.appendToken());
  }


}
