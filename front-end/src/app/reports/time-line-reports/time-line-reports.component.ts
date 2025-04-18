import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { TimelineConcurrentReportsService } from '../../core/services/timeLine&ConcurrentReports/timeline-concurrent-reports.service';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SharedService } from '../../core/shared/share.service';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { CustomDateComponent } from '../../shared/dialogComponents/custom-date/custom-date.component';
import { UserService } from '../../core/services/user/user.service';
import { MatSort, MatSortModule } from '@angular/material/sort';

interface timeLineData {
  agents: string;
  callcount: number;
  duration: number;
  avgduration: number;
  TotalWorkingdays: number;
  avgcallsWorkingdays: number;
  [key: string]: string | number;
}
let ELEMENT_DATA: timeLineData[] = [];

@Component({
  selector: 'app-time-line-reports',
  standalone: true,
  imports: [TranslateModule, ReactiveFormsModule, MatTooltip, MatIconModule, MatMenuModule, MatCheckboxModule, MatToolbarModule,
    MatSelectModule, MatTableModule,MatSortModule, CommonModule, FormsModule, MatButtonModule, MatDatepickerModule, MatTooltipModule
  ],

  providers: [provideNativeDateAdapter(),
  { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    DatePipe
  ],
  templateUrl: './time-line-reports.component.html',
  styleUrl: './time-line-reports.component.css'
})
export class TimeLineReportsComponent implements OnInit {
  toolTips: any = {
    "apply": 'Menu.Apply Changes',
    "download": 'Menu.Download Reports',
    Previous: 'Menu.REPORTS RECORDING.AGENTS.Previous',
    Next: 'Menu.REPORTS RECORDING.AGENTS.Next'
  }
  @ViewChild(MatSort)
  sort!: MatSort;
  clickedRows = new Set<timeLineData>();
  sortDirection: 'asc' | 'desc' = 'asc'; // Initializing with 'asc' by default
  recordsPerPage: number = 10;
  pageNumber: number = 1;
  displayedColumns: string[] = ['CallDateTimeRange','CallCount', 'TotalDuration', 'AverageDuration']
  selectedStatusValue: string = ''
  totalRecord: number = 0
  dataSource = new MatTableDataSource<timeLineData>(ELEMENT_DATA);
  exportdataSource = new MatTableDataSource<timeLineData>(ELEMENT_DATA);

  selectedDateRange: string = 'Today';
  // body for report
  reportBody: any = {
    inExtensionNumber: null,
    inAgentCode: null,
    inCallStartDateTime: new Date().toISOString().split('T')[0] + ' 00:00:00', // Default to today
    inCallEndDateTime: new Date().toISOString().split('T')[0] + ' 23:59:59',   // Default to today
    inCallStartTime: null,
    inCallEndTime: null,
    inPageNumber: this.pageNumber,
    inRecordsPerPage: this.recordsPerPage,
    inUserId: null,
    inSortColumn: null,
    inSortOrder: null,
    inTimelineCriteria: "Hourly"
  };

  DownloadreportBody: any = {
    inExtensionNumber: null,
    inAgentCode: null,
    inCallStartDateTime: new Date().toISOString().split('T')[0] + ' 00:00:00', // Default to today
    inCallEndDateTime: new Date().toISOString().split('T')[0] + ' 23:59:59',   // Default to today
    inCallStartTime: null,
    inCallEndTime: null,
    inPageNumber: this.pageNumber,
    inRecordsPerPage: this.recordsPerPage,
    inUserId: null,
    inSortColumn: null,
    inSortOrder: null,
    inTimelineCriteria: "Hourly"
  };


  constructor(
    private reportApi: TimelineConcurrentReportsService,
    private dialog: MatDialog,
    private router: Router,
    private exportService: SharedService,
    private datePipe: DatePipe,
    private userApi: UserService
  ) {

  }
  ngOnInit(): void {
    this.getTimelineReport()
    this.getFilters()
  }
  ngAfterViewInit() {
    this.dataSource.sort = this.sort; // Attach MatSort to the data source
  }
  getTimelineReport() {
    //api call to get data
    this.reportApi.getTimelineReports(this.reportBody).subscribe((result: any) => {

      this.totalRecord = result.TotalRecords[0].TotalRecords
      this.dataSource.data = result.timelineReports

    }, (Error) => {
      console.error(Error);
      if (Error.status === 403) {
        this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' }, disableClose: true });
      } else if (Error.status === 401) {
        this.router.navigateByUrl('');
      }

    })

  }
  applyFilters() {
    this.getTimelineReport()
  }
  // table fields sorting

  timelineCriteriaChange(timeLineCriteria: string) {
    this.reportBody.inTimelineCriteria = timeLineCriteria
    this.getTimelineReport();
  }
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  dateChange(event: MatDatepickerInputEvent<Date>) {

  }
  onDateRangeChange() {
    this.reportBody.inCallStartDateTime = this.range.value.start
    this.reportBody.inCallEndDateTime = this.range.value.end
    this.getTimelineReport()
    // this.reportBody.inCallStartDateTime = event.start;
    // this.reportBody.inCallEndDateTime = event.end;
  }
  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.reportBody.inRecordsPerPage = this.recordsPerPage;
      this.reportBody.inPageNumber = this.pageNumber;
      this.getTimelineReport()
    }
  }
  nextPage() {
    if (this.pageNumber < this.getTotalPages()) {
      this.pageNumber++;
      this.reportBody.inRecordsPerPage = this.recordsPerPage;
      this.reportBody.inPageNumber = this.pageNumber
      this.getTimelineReport()

    }
  }
  goToPage(event: MatSelectChange) {
    const selectedPage = event.value; // event.value directly provides the selected page number
    this.pageNumber = parseInt(selectedPage, 10);
    if (this.pageNumber < 1 || this.pageNumber > this.getTotalPages()) {
      return;
    }
    this.reportBody.inPageNumber = this.pageNumber;
    this.getTimelineReport()

  }
  onItemsPerPageChange(event: MatSelectChange) {
    this.recordsPerPage = event?.value;
    this.reportBody.inRecordsPerPage = this.recordsPerPage
    this.reportBody.inPageNumber = 1
    this.pageNumber = 1;
    this.getTimelineReport()
  }
  selectAllAgents: boolean = false;
  filteredAgents: any[] = [];
  selectedAgents: string[] = [];
  agents: any = []; // Replace with your actual agent structure

  // Function for Filters
  getFilters(): void {

    this.reportApi.getFilters({}).subscribe(
      (result: any) => {
        if (result.status === true) {

          const uniqueValues = new Set();
          result.callReports.forEach((item: any) => {
            uniqueValues.add(item);
          });
          this.extensions = [...uniqueValues].filter((value: any) => value.valueType.startsWith('extensionNumber'));
          this.agents = [...uniqueValues].filter((value: any) => value.valueType.startsWith('agentCode'));


          this.filteredAgents = [...this.agents]; // Initialize filtered agents
          this.filteredExtensions = [...this.extensions]; // Initialize filtered agents
        }
      },
      error => {
        console.error(error);
      }
    );
  }
  toggleAgent(agentCode: string, event: any): void {
    if (agentCode === 'All') {
      if (event.checked) {
        // Select all agents
        this.selectedAgents = this.agents.map((agent: any) => agent.uniqueValue);
      } else {
        // Deselect all agents
        this.selectedAgents = [];
      }
    } else {
      if (event.checked) {
        // Add individual agent to selectedAgents if not already present
        if (!this.selectedAgents.includes(agentCode)) {
          this.selectedAgents.push(agentCode);
        }
      } else {
        // Remove individual agent from selectedAgents
        const index = this.selectedAgents.indexOf(agentCode);
        if (index >= 0) {
          this.selectedAgents.splice(index, 1);
        }
      }

      // Uncheck "All" if not all agents are selected
      if (this.selectedAgents.length !== this.agents.length) {
        const allIndex = this.selectedAgents.indexOf('All');
        if (allIndex >= 0) {
          this.selectedAgents.splice(allIndex, 1);
        }
      }
    }


    // Update the filter input with selected agents
    this.reportBody.inAgentCode = this.selectedAgents.join(',');
  }
  toggleExtension(agentCode: string, event: any): void {

    if (agentCode === 'All') {
      if (event.checked) {
        // Select all agents
        this.selectedExtensions = this.extensions.map((agent: any) => agent.uniqueValue);
      } else {
        // Deselect all agents
        this.selectedExtensions = [];
      }
    } else {
      if (event.checked) {
        // Add individual agent to selectedAgents if not already present
        if (!this.selectedExtensions.includes(agentCode)) {
          this.selectedExtensions.push(agentCode);
        }
      } else {
        // Remove individual agent from selectedAgents
        const index = this.selectedExtensions.indexOf(agentCode);
        if (index >= 0) {
          this.selectedExtensions.splice(index, 1);
        }
      }

      // Uncheck "All" if not all agents are selected
      if (this.selectedExtensions.length !== this.agents.length) {
        const allIndex = this.selectedExtensions.indexOf('All');
        if (allIndex >= 0) {
          this.selectedExtensions.splice(allIndex, 1);
        }
      }
    }

    // Update the filter input with selected agents
    this.reportBody.inExtensionNumber = this.selectedExtensions.join(',');
  }
  selectAllExtensions: boolean = false;
  filteredExtensions: any[] = [];
  selectedExtensions: string[] = [];
  extensions: any = [];

  getTotalPages() {
    return Math.ceil(this.totalRecord / this.recordsPerPage);

  }
  getPagesArray() {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }
  isAllSelected() {

  }
  masterToggle() {

  }
  exportToFile(fileType: string) {
    this.DownloadreportBody = this.reportBody;
    this.DownloadreportBody.inPageNumber = null;
    this.DownloadreportBody.inRecordsPerPage = null;
    //api call to get data
    this.reportApi.getTimelineReports(this.DownloadreportBody).subscribe((result: any) => {
      this.exportdataSource.data = result.timelineReports
      // window.print()
      this.exportService.generateFile(fileType, this.exportdataSource.data, 'Time Line Report')
    }, (Error) => {
      console.error(Error);
      if (Error.status === 403) {
        this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' }, disableClose: true });
      } else if (Error.status === 401) {
        this.router.navigateByUrl('');
      }
    })
  }
  //Function for Date Range Filter
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

  openCustomDateDialog(selectedDateRange: any) {
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
  onAgentSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredAgents = this.agents.filter((agent: any) =>
      agent.uniqueValue.toLowerCase().includes(searchValue)
    );
  }
  onExtensionSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredExtensions = this.extensions.filter((agent: any) =>
      agent.uniqueValue.toLowerCase().includes(searchValue)
    );
  }
  toggleSelectAllAgents(isChecked: boolean): void {
    this.selectAllAgents = isChecked;
    this.selectedAgents = isChecked ? this.agents.map((agent: any) => agent.uniqueValue) : [];


  }
  toggleSelectAllExtensions(isChecked: boolean): void {
    this.selectAllExtensions = isChecked;
    this.selectedExtensions = isChecked ? this.extensions.map((agent: any) => agent.uniqueValue) : [];
  }



  isAgentSelected(agentCode: string): boolean {
    return this.selectedAgents.includes(agentCode);
  }
  isExtensionSelected(agentCode: string): boolean {
    return this.selectedExtensions.includes(agentCode);
  }


  trackByAgent(index: number, agent: any): string {
    return agent.agentCode;
  }
}
