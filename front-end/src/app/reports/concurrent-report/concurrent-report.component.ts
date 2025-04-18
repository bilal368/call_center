import { Component, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import {MatButtonModule} from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CustomDateComponent } from '../../shared/dialogComponents/custom-date/custom-date.component';
import {MatDatepickerInputEvent, MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { TimelineConcurrentReportsService } from '../../core/services/timeLine&ConcurrentReports/timeline-concurrent-reports.service';
import { Router } from '@angular/router';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { SharedService } from '../../core/shared/share.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSort, MatSortModule } from '@angular/material/sort';


ReactiveFormsModule
interface concurrentData {
  day: string;
  maximumConcurrentCalls: number;
  [key: string]: string | number;
}
let ELEMENT_DATA: concurrentData[] = [];
@Component({
  selector: 'app-concurrent-report',
  standalone: true,
  imports: [TranslateModule,MatSortModule,ReactiveFormsModule,MatIconModule,MatMenuModule,MatCheckboxModule,MatToolbarModule,
    MatSelectModule,MatTableModule,CommonModule,FormsModule,MatButtonModule, MatTooltipModule,
    MatFormFieldModule, MatDatepickerModule],
  providers: [provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    DatePipe
  ],
 
  templateUrl: './concurrent-report.component.html',
  styleUrl: './concurrent-report.component.css'
})
export class ConcurrentReportComponent {
  toolTips:any={
    "apply":'Menu.Apply Changes',
   "download":'Menu.Download Reports'
  }
  recordsPerPage:number=10;
  currentDate:any | undefined
  pageNumber:number=1;
  dataSource = new MatTableDataSource(ELEMENT_DATA);
  exportDataSource = new MatTableDataSource(ELEMENT_DATA); 
  displayedColumns:string[]=['callDate','maxConcurrentCalls','peakTime']
  data:any=[]
  selectedTypeValue:string='Daily'
  totalRecord:number=0
  selectedDateRange: string = 'Today';
  @ViewChild(MatSort)sort!: MatSort;
  // body for report
  reportBody: any = {
    inCallStartDateTime: null,
    inCallEndDateTime: null,
    inPageNumber: this.pageNumber,
    inRecordsPerPage: this.recordsPerPage,
    inSortColumn: null,
    inSortOrder: null,
    inTimelineCriteria:"Hourly"
  };
  constructor(
    private reportApi:TimelineConcurrentReportsService,
    private dialog:MatDialog,
    private router:Router,
    private exportService:SharedService,
    public datePipe: DatePipe
  ){
    this.currentDate = new Date().toISOString().split('T')[0];    // current date for show date as selected in date picker
    this.reportBody.inCallStartDateTime=this.currentDate //this for hourly report for today
    this.reportBody.inCallEndDateTime=this.currentDate
  }
  ngOnInit(): void {
    this.getConcurrentReport()
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  getConcurrentReport(){
    //api call to get data
    this.reportApi.getConcurrentReports(this.reportBody).subscribe((result:any)=>{
      this.totalRecord=result.TotalRecords[0].TotalRecords
      this.dataSource.data=result.concurrentReports
      
    },(Error)=>{
      console.error(Error);
      if (Error.status === 403) {
        this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } ,disableClose:true});
      } else if (Error.status === 401) {
        this.router.navigateByUrl('');
      }
      
    })

  }
  applyFilter(){
    this.getConcurrentReport();

  }
  timelineCriteriaChange(timeLineCriteria:string){
    this.reportBody.inTimelineCriteria=timeLineCriteria
    this.range.value.start=this.currentDate
    this.range.value.end=this.currentDate
    this.getConcurrentReport();


  }
  dateChange(event: MatDatepickerInputEvent<Date>) {
    this.reportBody.inCallStartDateTime=event.value
    this.reportBody.inCallEndDateTime=event.value

    
  }
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  onDateRangeChange() {
    // console.log(this.range.value);
    this.reportBody.inCallStartDateTime=this.range.value.start
    this.reportBody.inCallEndDateTime=this.range.value.end
  // this.reportBody.inCallStartDateTime = event.start;
  // this.reportBody.inCallEndDateTime = event.end;
}
previousPage() {
  if (this.pageNumber > 1) {
    this.pageNumber--;
    this.reportBody.inRecordsPerPage = this.recordsPerPage;
    this.reportBody.inPageNumber = this.pageNumber;
    this.getConcurrentReport();
  }
}
getTotalPages() {
  return Math.ceil(this.totalRecord / this.recordsPerPage);
}
nextPage() {
  if (this.pageNumber < this.getTotalPages()) {
    this.pageNumber++;
    this.reportBody.inRecordsPerPage = this.recordsPerPage;
    this.reportBody.inPageNumber = this.pageNumber
    this.getConcurrentReport();
  }
}

  goToPage(event: MatSelectChange) {
    const selectedPage = event.value; // event.value directly provides the selected page number
    this.pageNumber = parseInt(selectedPage, 10);
    if (this.pageNumber < 1 || this.pageNumber > this.getTotalPages()) {
      return;
    }
    this.reportBody.inPageNumber = this.pageNumber;
    this.getConcurrentReport();
 
  }
  onItemsPerPageChange(event:MatSelectChange){
    this.recordsPerPage = event?.value;
    this.reportBody.inRecordsPerPage = this.recordsPerPage
    this.reportBody.inPageNumber = 1
    this.pageNumber = 1;
    this.getConcurrentReport()
  }
 
  getPagesArray() {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }
  setDateRange(range: string) {

    this.selectedDateRange = range;
    const today = new Date();
    let startDateTime: string = '0000-00-00 00:00:00';
    let endDateTime: string = '0000-00-00 23:59:59';

    switch (range) {
      case 'Today':
        startDateTime = today.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = today.toISOString().split('T')[0] + ' ' + '23:59:59';
        break;
        
      case 'This Week':
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        const endOfWeek = new Date(today.setDate(startOfWeek.getDate() + 6));
        startDateTime = startOfWeek.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfWeek.toISOString().split('T')[0] + ' ' + '23:59:59';
        break;
      case 'This Month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 2);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        startDateTime = startOfMonth.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfMonth.toISOString().split('T')[0] + ' ' + '23:59:59';
        break;
      case 'This Quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        startDateTime = startOfQuarter.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfQuarter.toISOString().split('T')[0] + ' ' + '23:59:59';
        break;
      case 'This Year':
        const startOfYear = new Date(today.getFullYear(), 0, 2); // January is month 0
        const endOfYear = new Date(today.getFullYear(), 11, 32); // December is month 11
        startDateTime = startOfYear.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfYear.toISOString().split('T')[0] + ' ' + '23:59:59';
        break;

      case 'Custom':
        this.openCustomDateDialog(this.selectedDateRange);
        return;

      default:
        // Fallback to today
        startDateTime = today.toISOString().split('T')[0] + ' 00:00:00';
        endDateTime = today.toISOString().split('T')[0] + ' 23:59:59';
        break;
        
    }

    // Update the callFilter object
    this.reportBody.inCallStartDateTime = startDateTime;
    this.reportBody.inCallEndDateTime = endDateTime;
  }
  customFromDate: Date | null = null;
  customToDate: Date | null = null;
  openCustomDateDialog(selectedDateRange:any) {

    this.selectedDateRange=selectedDateRange;


    const currentDate = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(currentDate.getMonth() + 1);
    const startDate = this.formatDate(currentDate);
    const endDate = this.formatDate(oneMonthFromNow);
    let dialogRef: any;


    const fromDate = this.customFromDate ? this.formatDate(new Date(this.customFromDate)) : startDate;

    const toDate = this.customToDate ? this.formatDate(new Date(this.customToDate)) : endDate;

    setTimeout(() => {
      dialogRef = this.dialog.open(CustomDateComponent, {
        minWidth: '300px', height: '245px',
        data: {
          fromDate,
          toDate
        }
      });
      dialogRef.afterClosed().subscribe((result: { fromDate: Date | null; toDate: Date | null; }) => {
        if (result) {
          this.customFromDate = result.fromDate;
          this.customToDate = result.toDate;

          // Fallback to current date if fromDate or toDate is null
          const customFromDate = this.customFromDate ? new Date(this.customFromDate) : new Date();
          const customToDate = this.customToDate ? new Date(this.customToDate) : new Date();

          this.selectedDateRange = `${this.formatDate(customFromDate)} to ${this.formatDate(customToDate)}`;

          const startDateTime = customFromDate.toISOString().split('T')[0] + ' ' + '00:00:00';
          const endDateTime = customToDate.toISOString().split('T')[0] + ' ' + '23:59:59';

          this.reportBody.inCallStartDateTime = startDateTime;
          this.reportBody.inCallEndDateTime = endDateTime;
        }
      });
    }, 500);
  }
  formatDate(date: Date | null): string {
    return date ? this.datePipe.transform(date, 'dd-MM-yyyy') || '' : '';
  }

  isAllSelected(){

  }
  masterToggle(){

  }
  exportToFile(fileType:string){
    // window.print()
    const exportdata = {
      inCallStartDateTime: this.reportBody.inCallStartDateTime,
      inCallEndDateTime: this.reportBody.inCallEndDateTime,
      inPageNumber: null,
      inRecordsPerPage: null,
      inSortColumn: this.reportBody.inSortColumn,
      inSortOrder: this.reportBody.inSortOrder,
      inTimelineCriteria:`${this.reportBody.inTimelineCriteria}`
    };
    this.reportApi.getConcurrentReports(exportdata).subscribe((result:any)=>{
      
      // this.totalRecord=result.TotalRecords[0].TotalRecords
      result.concurrentReports = result.concurrentReports.map((report: { peakTime: string | number | Date; }) => {
        return {
          ...report,
          peakTime: this.datePipe.transform(report.peakTime, 'dd-MM-yyyy hh:mm:ss a')
        };
      });
      this.exportDataSource.data = result.concurrentReports
      this.exportService.generateFile(fileType,this.exportDataSource.data,'Concurrent Report')
    },(Error)=>{
      console.error(Error);
      if (Error.status === 403) {
        this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } ,disableClose:true});
      } else if (Error.status === 401) {
        this.router.navigateByUrl('');
      }
      
    })
    
  }
}
