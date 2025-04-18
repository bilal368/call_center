import { Component, ViewChild, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckbox, MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatOption, MatSelect, MatSelectChange } from '@angular/material/select';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';
import { CustomDateComponent } from '../../shared/dialogComponents/custom-date/custom-date.component';
import { UserService } from '../../core/services/user/user.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { SharedService } from '../../core/shared/share.service';
import { TimelineConcurrentReportsService } from '../../core/services/timeLine&ConcurrentReports/timeline-concurrent-reports.service';

interface Agent {
  agents: string;
  callcount: number;
  duration: number;
  avgduration: number;
  TotalWorkingdays: number;
  avgcallsWorkingdays: number;
  [key: string]: string | number;
}
const ELEMENT_DATA: Agent[] = [];
@Component({
  selector: 'app-agent-report',
  standalone: true,
  imports: [MatButtonModule, MatToolbarModule, MatTooltip, MatIconModule, TranslateModule,
    MatInputModule, MatSlideToggleModule, MatSortModule, MatSort,
    MatCheckboxModule, MatTableModule,
    MatPaginatorModule, MatProgressBarModule, MatMenuModule, FormsModule,
    CommonModule, MatSelect, MatOption, MatToolbar, MatToolbarModule],
  providers: [DatePipe],
  templateUrl: './agent-report.component.html',
  styleUrl: './agent-report.component.css'
})

export class AgentReportComponent implements OnInit {
  selectedAgentNames: any;
  @ViewChild(MatSort)
  sort!: MatSort;
  exportdata: any;
  displayedColumns: string[] = ['agents', 'callcount', 'duration', 'avgduration', 'TotalWorkingdays', 'avgcallsWorkingdays'];
  dataSource1 = new MatTableDataSource<Agent>(ELEMENT_DATA);
  sortDirection: 'asc' | 'desc' = 'asc'; // Initializing with 'asc' by default
  sortIcon: string = 'expand_more';
  clickedRows = new Set<Agent>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataStatus: boolean = false;
  datas: any;
  selectedAgent: any;
  agents: any;
  selectedDirection: string = 'All';
  TotalRecords: number = 0;
  displayedRange: string = '';
  filteredAgents: any;
  validAgentNames: any;
  filteredAgentsName: any;
  constructor(public dialog: MatDialog,
    private datePipe: DatePipe,
    private reportApi: TimelineConcurrentReportsService,
    private userApi: UserService,
    private SharedService: SharedService) { }
  pageSize = 2;
  recordsPerPage: number = 10;
  pagedData: Agent[] = [];
  currentPage: number = 0;
  pageNumber: number = 1;
  selectedDateRange: string = 'Today';
  customFromDate: Date | null = null;
  customToDate: Date | null = null;
  selectedAgents: string[] = [];
  selectedAgentName: string[] = [];
  data: Agent[] = [];
  selection = new SelectionModel<Agent>(true, []);

  callFilter: any = {
    inExtensionNumber: null,
    inCallDirection: null,
    inAgentCode: null,
    inCallStartDateTime: new Date().toISOString().split('T')[0] + ' 00:00:00', // Default to today
    inCallEndDateTime: new Date().toISOString().split('T')[0] + ' 23:59:59',   // Default to today
    inCallStartTime: null,
    inCallEndTime: null,
    inPageNumber: this.pageNumber,
    inRecordsPerPage: this.recordsPerPage,
    inUserId: null,
    inSortColumn: null,
    inSortOrder: null
  };

  toolTips: any = {
    Previous: 'Menu.REPORTS RECORDING.AGENTS.Previous',
    Next: 'Menu.REPORTS RECORDING.AGENTS.Next'
  }

  ngOnInit(): void {
    this.dataStatus = true
    this.dataSource1.paginator = this.paginator;
    this.updatePagedData();
    this.getAgentSummaryReport();
    this.getFilters();
    this.updateDisplayedRange();
    this.agentNamefilter();
  }
  ngAfterViewInit() {
    this.dataSource1.paginator = this.paginator;
    this.dataSource1.sort = this.sort;
  }

  // Function for Agent Report
  getAgentSummaryReport(): void {
    let body = this.callFilter
    this.userApi.getAgentReport(body).subscribe((result: any) => {
      if (result.status === true) {
        this.dataStatus = true;
        this.TotalRecords = result.data[1][0].TotalRecords;
        this.dataSource1.data = result.data[0].map((item: any) => ({
          agents: item.agentCode || 'No Data',
          agentName: item.agentName !== 'NULL' && item.agentName?.trim() ? item.agentName : 'No Data',
          callcount: item.callCount,
          duration: item.totalDuration,
          avgduration: item.averageDuration,
          TotalWorkingdays: item.totalWorkingDays,
          avgcallsWorkingdays: item.averageCallsPerWorkingDay
        }));

      }
    }, error => {
      console.error(error);
    });
  }
  trackByUniqueValue(index: number, item: any): string {
    return item.uniqueValue;
  }

  // Function for Filters
  getFilters(): void {
    let body = {};
    this.reportApi.getFilters(body).subscribe(
      (result: any) => {
        if (result.status === true) {
          const uniqueValues = new Set();
          result.callReports.forEach((item: any) => {
            uniqueValues.add(item);
          });
          this.agents = [...uniqueValues].filter((value: any) => value.valueType.startsWith('agentCode'));
          this.filteredAgents = [...this.agents]; // Initialize filtered agents
        }
      },
      error => {
        console.error(error);
      }
    );
  }

  agentNamefilter(): void {
    let body = {};
    this.reportApi.agentNamefilter(body).subscribe(
      (result: any) => {

        if (result.status === true) {
          const uniqueValues = new Set();
          result.callReports.forEach((item: any) => {
            uniqueValues.add(item);
          });
          this.agents = [...uniqueValues].filter((value: any) => value.valueType.startsWith('agentCode'));

          this.filteredAgentsName = [...this.agents]; // Initialize filtered agents

        }
        this.validAgentNames = this.filteredAgentsName
          .filter((item: any) => item.agentName && item.agentName !== "NULL") // Exclude invalid agent names
          .map((item: any) => ({
            agentCode: item.uniqueValue, // Map agentCode as uniqueValue
            agentName: item.agentName,  // Map corresponding agentName
          }));
      },
      (error: any) => {
        console.error(error);
      }
    );
  }

  applyFilters() {
    this.pageNumber = 1;
    this.recordsPerPage = 10
    this.callFilter.inPageNumber = this.pageNumber;
    this.callFilter.inRecordsPerPage = this.recordsPerPage;
    this.getAgentSummaryReport();
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
    this.callFilter.inCallStartDateTime = startDateTime;
    this.callFilter.inCallEndDateTime = endDateTime;
  }

  openCustomDateDialog(selectedDateRange: any) {
    this.selectedDateRange = selectedDateRange;

    const currentDate = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(currentDate.getMonth() + 1);
    const startDate = this.formatDate(currentDate);
    const endDate = this.formatDate(oneMonthFromNow);


    const fromDate = this.customFromDate ? this.formatDate(new Date(this.customFromDate)) : startDate;

    const toDate = this.customToDate ? this.formatDate(new Date(this.customToDate)) : endDate;



    let dialogRef: any;
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

          this.callFilter.inCallStartDateTime = startDateTime;
          this.callFilter.inCallEndDateTime = endDateTime;
        }
      });
    }, 500);
  }

  formatDate(date: Date | null): string {
    return date ? this.datePipe.transform(date, 'dd-MM-yyyy') || '' : '';
  }

  setDirection(direction: string) {
    if (direction === '') {
      this.selectedDirection = 'All';
      this.callFilter.inCallDirection = '0,1'; // Set direction to '1,2' when 'All' is selected
    } else if (direction === '0') {
      this.selectedDirection = 'Incoming';
      this.callFilter.inCallDirection = '0';
    } else {
      this.selectedDirection = 'Outgoing';
      this.callFilter.inCallDirection = '1';
    }
  }

  getAgentFilterText(): string {
    if (this.selectedAgents.length === 0) {
      return 'All'; // If no agents are selected
    } else if (this.selectedAgents.length === 1 && !this.selectedAgents.includes('All')) {
      return this.selectedAgents[0]; // If exactly one agent is selected
    } else if (this.selectedAgents.length > 1 && !this.selectedAgents.includes('All')) {
      return 'Multiple'; // If more than one agent is selected
    } else if (this.selectedAgents.includes('All')) {
      return 'All'; // If 'All' is selected
    }
    return 'All'; // Default if none of the conditions match
  }

  getAgentNameFilterText(): string {
    if (this.selectedAgentName.length === 0) {
      return 'All'; // If no agents are selected
    } else if (this.selectedAgentName.length === 1 && !this.selectedAgentName.includes('All')) {
      const agent = this.validAgentNames.find((item: { agentCode: string; }) => item.agentCode === this.selectedAgentName[0]);
      return agent ? agent.agentName : 'All'; // Show agentName for the selected agentCode
    } else if (this.selectedAgentName.length > 1 && !this.selectedAgentName.includes('All')) {
      return 'Multiple'; // If more than one agent is selected
    } else if (this.selectedAgentName.includes('All')) {
      return 'All'; // If 'All' is selected
    }
    return 'All'; // Default if none of the conditions match
  }


  trackByIndex(index: number, item: any): string {
    return item.uniqueValue;
  }

  // Filter agent names based on search
  
  onAgentSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase().trim();

    if (searchValue === "") {
        // When input is cleared, reset to the full agent list by fetching again
        this.getAgentSummaryReport();
    } else {
        // Filter the validAgentNames (displayed list) based on the search value
        this.validAgentNames = this.agents.filter((agent: any) =>
            agent.agentName &&
            agent.agentName.toLowerCase().includes(searchValue) &&
            agent.agentName !== 'NULL' &&
            agent.agentName !== 'All'
        );
    }
}


  // Toggle agent name selection

  toggleAgentName(agentCode: string, event: any): void {
    if (agentCode === 'All') {
      if (event.checked) {
        // Select "All" and all agents
        this.selectedAgentName = ['All', ...this.validAgentNames.map((agent: { uniqueValue: any; }) => agent.uniqueValue)];
        this.callFilter.inAgentCode = this.validAgentNames.map((agent: { uniqueValue: any; }) => agent.uniqueValue).join(',');
      } else {
        // Deselect "All" and all agents
        this.selectedAgentName = [];
        this.callFilter.inAgentCode = '';
      }
    } else {
      if (event.checked) {
        // Add the individual agent to the selection
        if (!this.selectedAgentName.includes(agentCode)) {
          this.selectedAgentName.push(agentCode);
        }
  
        // If all agents are selected, include "All"
        if (this.selectedAgentName.length === this.validAgentNames.length) {
          this.selectedAgentName.push('All');
        }
      } else {
        // Remove the individual agent from the selection
        const index = this.selectedAgentName.indexOf(agentCode);
        if (index !== -1) {
          this.selectedAgentName.splice(index, 1);
        }
  
        // Deselect "All" if any individual agent is unchecked
        const allIndex = this.selectedAgentName.indexOf('All');
        if (allIndex !== -1) {
          this.selectedAgentName.splice(allIndex, 1);
        }
      }
  
      // Update the backend filter with selected agent codes
      this.callFilter.inAgentCode = this.selectedAgentName
        .filter(agent => agent !== 'All')
        .join(',');
    }
  }
  
  isAgentSelected(agentCode: string): boolean {
    return this.selectedAgents.includes(agentCode);
  }

toggleAgent(agentCode: string, event: any): void {
  if (agentCode === 'All') {
      if (event.checked) {
          // Select all currently filtered agents + 'All'
          this.selectedAgents = this.filteredAgents.map((agent: any) => agent.uniqueValue);
          this.selectedAgents.push('All');
      } else {
          // Deselect everything
          this.selectedAgents = [];
      }
  } else {
      if (event.checked) {
          if (!this.selectedAgents.includes(agentCode)) {
              this.selectedAgents.push(agentCode);
          }

          // Check if all filtered agents are selected, then add 'All'
          const allVisibleAgentCodes = this.filteredAgents.map((agent: { uniqueValue: any; }) => agent.uniqueValue);
          if (allVisibleAgentCodes.every((code: string) => this.selectedAgents.includes(code))) {
              if (!this.selectedAgents.includes('All')) {
                  this.selectedAgents.push('All');
              }
          }
      } else {
          const index = this.selectedAgents.indexOf(agentCode);
          if (index >= 0) {
              this.selectedAgents.splice(index, 1);
          }

          // Uncheck "All" if any agent is unchecked
          const allIndex = this.selectedAgents.indexOf('All');
          if (allIndex >= 0) {
              this.selectedAgents.splice(allIndex, 1);
          }
      }
  }

  this.callFilter.inAgentCode = this.selectedAgents
      .filter(agent => agent !== 'All')
      .join(',');
}

  onAgentIDSearchChange(event: Event): void {
    const input = (event.target as HTMLInputElement).value.trim().toLowerCase();

    if (input === "") {
        // When the search input is cleared, re-fetch or reset to the full original list
        this.getAgentSummaryReport();  // You need to have this method to re-fetch original data
    } else {
        // Filter the list based on search input
        this.filteredAgents = this.agents.filter((agent: any) =>
            agent.uniqueValue.toLowerCase().includes(input)
        );
    }
}



  isLoading = false;
  exportToFile(fileType: string) {
    this.isLoading = true; // Start loading

    const selectedCalls = this.selection.selected;

    // Function to safely handle null, undefined, 'NULL' strings, or empty string values
    const getSafeValue = (value: any) => {
      if (value === null || value === undefined || value === '' || value === 'NULL') {
        return 'No Data'; // Replace 'null', 'undefined', empty string, or 'NULL' with 'No Data'
      }
      return value; // Otherwise, return the original value
    };

    if (selectedCalls.length === 0) {
      this.callFilter.inPageNumber = null;
      this.callFilter.inRecordsPerPage = null;

      this.userApi.getAgentReport(this.callFilter).subscribe(
        (result: any) => {
          this.data = result.data[0];
          this.exportdata = result.data[0].map((item: any) => ({
            agentId: getSafeValue(item.agentCode),
            agentName: getSafeValue(item.agentName),
            callCount: getSafeValue(item.callCount),
            Duration: getSafeValue(item.totalDuration), // Changed to 'Duration'
            "Avg.Duration": getSafeValue(item.averageDuration),
            TotalWorkingDays: getSafeValue(item.totalWorkingDays),
            'Avg.Calls/Working Days': getSafeValue(item.averageCallsPerWorkingDay),
          }));

          this.SharedService.generateFile(fileType, this.exportdata, 'Agent Report');
          this.isLoading = false; // Stop loading after success
        },
        (error: any) => {
          console.error('Error exporting file:', error);
          this.isLoading = false; // Stop loading after failure
        }
      );
    } else {
      this.exportdata = selectedCalls.map(item => ({
        agentId: getSafeValue(item['agentCode']),
        agentName: getSafeValue(item['agentName']),
        callCount: getSafeValue(item['callCount']),
        Duration: getSafeValue(item['totalDuration']), // Changed to 'Duration'
        "Avg.Duration": getSafeValue(item['averageDuration']),
        TotalWorkingDays: getSafeValue(item['totalWorkingDays']),
        'Avg.Calls/Working Days': getSafeValue(item['averageCallsPerWorkingDay']),
      }));

      this.SharedService.generateFile(fileType, this.exportdata, 'Agent Report');
      this.isLoading = false; // Stop loading after success
    }
  }


   // Function for Pagination
   onItemsPerPageChange(event: MatSelectChange) {
    this.recordsPerPage = event.value;
    this.callFilter.inRecordsPerPage = this.recordsPerPage
    this.callFilter.inPageNumber = 1
    this.pageNumber = 1;
    this.updatePagedData()
    this.getAgentSummaryReport();
    this.updateDisplayedRange();
  }

  goToPage(event: MatSelectChange) {
    const selectedPage = event.value; // event.value directly provides the selected page number
    this.pageNumber = parseInt(selectedPage, 10);
    if (this.pageNumber < 1 || this.pageNumber > this.getTotalPages()) {
      return;
    }
    this.callFilter.inPageNumber = this.pageNumber;
    this.updateDisplayedRange();
    this.getAgentSummaryReport();
  }

  getPagesArray() {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }
  formatPageNumber(page: number): string {
    return page < 10 ? `0${page}` : `${page}`;
  }
  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.callFilter.inRecordsPerPage = this.recordsPerPage;
      this.callFilter.inPageNumber = this.pageNumber;
      this.getAgentSummaryReport();
      this.updateDisplayedRange();
    }
  }
  getTotalPages() {
    return Math.ceil(this.TotalRecords / this.recordsPerPage);
  }
  nextPage() {
    if (this.pageNumber < this.getTotalPages()) {
      this.pageNumber++;
      this.callFilter.inRecordsPerPage = this.recordsPerPage;
      this.callFilter.inPageNumber = this.pageNumber
      this.getAgentSummaryReport();
      this.updateDisplayedRange();
    }
  }
  updateDisplayedRange() {
    const startRecord = (this.pageNumber - 1) * this.recordsPerPage + 1;
    this.displayedRange = `${startRecord}`;
  }
  changePageSize(pageSize: number) {
    this.pageSize = pageSize;
    this.paginator.pageSize = pageSize;
    this.paginator.pageIndex = 0;
    this.paginator._changePageSize(pageSize);
  }
  updatePagedData() {
    const startIndex = this.currentPage * this.recordsPerPage;
    const endIndex = startIndex + this.recordsPerPage;
    this.pagedData = this.pagedData.slice(startIndex, endIndex);
    this.pageNumber = this.currentPage + 1;
  }
}

