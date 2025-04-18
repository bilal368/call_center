import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SharedService } from '../../shared/share.service';
const options = { headers: new HttpHeaders() }
@Injectable({
  providedIn: 'root'
})
export class ArchiveService {
  archiveUrl: string = `/api/_systemInfo`;
  userId: string = ''
  constructor(
    private http: HttpClient,
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
  // api for get Archive List
  getArchiveList(pageNumber: number, recordsPerPage: number, searchName: any,selectedArchiveTypes:any) {
    let body = { pageNumber, recordsPerPage, searchName,selectedArchiveTypes}
    return this.http.post(`${this.archiveUrl}/getArchiveList`, body, this.appendToken())
  }
  // api for transform data from XML Archive List
  getDataFromXML(body:any) {
    return this.http.post(`${this.archiveUrl}/getXMLData`, body, this.appendToken())
  }
  // api for get data from XML
  getCallsFromXML(body:any) {
    return this.http.post(`${this.archiveUrl}/getCallsFromXML`, body, this.appendToken())
  }
  // api for delete archive from list
  deleteArchiveReport(body:any){
    return this.http.post(`${this.archiveUrl}/deleteArchiveReport`, body, this.appendToken())

  }
  
}
