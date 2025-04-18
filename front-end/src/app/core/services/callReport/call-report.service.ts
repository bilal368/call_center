import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { SharedService } from '../../shared/share.service';

const options = { headers: new HttpHeaders() }

@Injectable({
  providedIn: 'root'
})
export class CallReportService {

  BaseUrl: string = `/api/_reports`;

  test: any = []
  loginUser = new BehaviorSubject({})
  userId: string = ''
  constructor(private http: HttpClient,
    private sharedService: SharedService
  ) {
    sharedService.loginUserId$.subscribe((result: any) => {
      this.userId = result
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
  // Audio Api Header
  audioappendToken() {
    let token = localStorage.getItem("token");
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.append('authorization', token);
    }
    return { headers: headers, responseType: 'blob' as 'json' };
  }
  // Get Call Reports
  getcallReports(body: any) {
    return this.http.post(`${this.BaseUrl}/CallReports`, body, this.appendToken())
  }
  // Get Call Reports
  fetchcallReportsDetails(body: any) {

    return this.http.post(`${this.BaseUrl}/fetchcallReportsDetails`, body, this.appendToken())
  }
  // Calls the report API to fetch extension reports and handles the response.
  ExtensionReports(body: any) {
    return this.http.post(`${this.BaseUrl}/ExtensionReports`, body, this.appendToken())
  }
  audiocallReports(body: any): Observable<Blob> {
    return this.http.post<Blob>(
      `${this.BaseUrl}/audioCallReports`,
      body,
      {
        ...this.audioappendToken(),
        responseType: 'blob' as 'json', // Cast 'blob' as 'json' to avoid conflicts with TypeScript
      }
    );
  }
  
  // Update Audit Trail Report
  updateAuditTrailReport(moduleName:any, action: any, actionDescription:any) {
    const tableName = 'dgRecordingCallLog'
    const body = { userId:this.userId, moduleName:moduleName, action:action, actionDescription:actionDescription,
       tableName, recordIds:0, oldValue:'', newValue:[], ipAddress:''}
    return this.http.post(`${this.BaseUrl}/updateAuditTrailReport`, body, this.audioappendToken())
  }
  // Lock Reports
  LockcallReports(SelectedDatas: any, loginId: any) {
    const body = { SelectedDatas, loginId }
    return this.http.post(`${this.BaseUrl}/lockCallReports`, body, this.appendToken())
  }
  // Unlock Reports
  UnlockcallReports(SelectedDatas: any, loginId: any) {
    const body = { SelectedDatas, loginId }
    return this.http.post(`${this.BaseUrl}/UnlockCallReports`, body, this.appendToken())
  }
  // Lock Reports
  LockSelectedcallReport(recordingCallLogId: any) {
    const body = { recordingCallLogId }
    return this.http.post(`${this.BaseUrl}/lockSelectedCallReports`, body, this.appendToken())
  }
  // Delete Reports
  deleteReports(SelectedDatas: any, loginId: any) {
    const body = { SelectedDatas, loginId }
    const options = this.appendToken();
    return this.http.request('delete', `${this.BaseUrl}/deleteReports`, { ...options, body: body });
  }
  // Notes 
  notesReport(notes: any, recordingCallLogId: any) {
    const body = { notes: notes, recordingCallLogId: recordingCallLogId, userId: this.userId }
    return this.http.post(`${this.BaseUrl}/notesCallReports`, body, this.appendToken())
  }
  // Add Feedback
  addFeedback(data: any) {
    const body = { data }
    return this.http.post(`${this.BaseUrl}/transcriptCallReports`, body, this.appendToken())
  }
  // Color code
  colorCode() {
    const body = {}
    return this.http.post(`${this.BaseUrl}/colorCode`, body, this.appendToken())
  }
  // updatecolorCode
  updatecolorCode(selectedColor: any, recordingCallLogId: any, loginId: any) {
    const body = { selectedColor: selectedColor, recordingCallLogId: recordingCallLogId, userId: loginId }
    return this.http.post(`${this.BaseUrl}/updatecolorCode`, body, this.appendToken())
  }
  // Fetch Call Tagging
  fetchCallTagging() {
    return this.http.post(`${this.BaseUrl}/fetchCallTagging`, {}, this.appendToken());
  }
  // Fetch Call Tagging Details
  fetchCallTaggingDetails(recordingCallLogId: any) {
    const body = { recordingCallLogId }
    return this.http.post(`${this.BaseUrl}/fetchCallTaggingDetails`, body, this.appendToken());
  }
  // updateCallTagging
  updateCallTagging(customTag: any) {
    const body = { customTag }
    return this.http.post(`${this.BaseUrl}/updateCallTagging`, body, this.appendToken());
  }
  // api for Deleted Call Report
  deleteCallReport(body: any) {
    return this.http.post(`${this.BaseUrl}/deleteCallReport`, body, this.appendToken())
  }
  // api for filters
  getFilters(body: any) {
    return this.http.post(`${this.BaseUrl}/getFilters`, body, this.appendToken())
  }
  // api for Audit Trail Report
  AuditTrailReports(body: any) {
    return this.http.post(`${this.BaseUrl}/AuditTrailReport`, body, this.appendToken())
  }
  // api for Insert Call Tagging Details
  insertCallTaggingDetails(callTagDetails: any) {
    const body = { callTagDetails }
    return this.http.post(`${this.BaseUrl}/insertCallTaggingDetails`, body, this.appendToken())
  }
  // api for Delete Call Tagging Details
  deleteCallTaggingDetails(callTaggingDetailsID: any) {
    const body = { callTaggingDetailsID }
    return this.http.post(`${this.BaseUrl}/deleteCallTaggingDetails`, body, this.appendToken())
  }
 
  
}
