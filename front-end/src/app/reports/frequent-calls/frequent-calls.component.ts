import { Component, ViewChild, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatOption, MatSelect, MatSelectChange } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { UserService } from '../../core/services/user/user.service';
import { CustomDateComponent } from '../../shared/dialogComponents/custom-date/custom-date.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { SharedService } from '../../core/shared/share.service';
import { TimelineConcurrentReportsService } from '../../core/services/timeLine&ConcurrentReports/timeline-concurrent-reports.service';



interface TableData {
  agents: string;
  extension: number,
  phonenumber: number | string,
  attndcalls: number | string;
  missedcalls: any;
  zerotofivesecs: any;
  sixtosixtysecs: any;
  onetothreemins: any;
  threeplusmins: any;
  in: any,
  out: any
  [key: string]: string | number;
  callerId: string;
  dialledNumber: string;
}


const ELEMENT_DATA: TableData[] = [];
@Component({
  selector: 'app-frequent-calls',
  standalone: true,
  imports: [MatButtonModule, MatSort, MatSortModule, MatTooltip, MatTooltipModule, TranslateModule, MatIconModule, MatInputModule, MatSlideToggleModule, MatCheckboxModule, MatTableModule,
    MatPaginatorModule, MatProgressBarModule, MatMenuModule, FormsModule, CommonModule, MatSelect, MatOption, MatRadioModule, MatToolbar, MatToolbarModule],
  providers: [DatePipe],
  templateUrl: './frequent-calls.component.html',
  styleUrl: './frequent-calls.component.css'
})

export class FrequentCallsComponent implements OnInit {
  selectedOptionp: any;
  exportdata: any;
  filteredAgents: any;
  onSearch() {
    console.log('Search Query:', this.searchQuery);
    console.log('Search By:', this.selectedOption);
    // Implement your search logic here
  }
  searchOptions: any = [];


  displayedRange: string = '';
  constructor(public dialog: MatDialog, private datePipe: DatePipe, private userApi: UserService, private SharedService: SharedService, private reportApi: TimelineConcurrentReportsService,) { }
  displayedColumns: string[] = ['agents', 'phonenumber', 'attndcalls', 'missedcalls', 'zerotofivesecs', 'sixtosixtysecs', 'onetothreemins', 'threeplusmins', 'inout',];
  dataSource = new MatTableDataSource<TableData>(ELEMENT_DATA);
  clickedRows = new Set<TableData>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  pageSizeOptions = [2, 10, 20];
  pageSize = 2;
  data: TableData[] = [];
  ELEMENT_DATA: TableData[] = [];
  columnHeading: string = 'Caller ID';
  phonenumber: any;
  selectedAgents: string[] = [];
  searchQuery: string = '';
  selectedPhoneNumbers: any = [];
  phonenumbers: string[] = [];
  agents: any = [];
  selectedOption: 'callerId' | 'dialledNumber' = 'callerId';
  selectedDirection: string = 'All';
  selectedAgent: [] = []
  agentCode: any = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  dataStatus: boolean = false;
  pagedData : TableData[] = [];
  recordsPerPage: number = 10;
  currentPage: number = 0;
  pageNumber: number = 1;
  TotalRecords: number = 0;
  selectedDateRange: string = 'Today';
  customFromDate: Date | null = null;
  customToDate: Date | null = null;
  languageId: any = 1
  selection = new SelectionModel<TableData>(true, []);


  callFilter: any = {
    inReportType: null,
    inExtensionNumber: null,
    inCallDirection: null,
    inAgentCode: null,
    inCallerId: null,
    inDialledNumber: null,
    inCallStartDateTime: new Date().toISOString().split('T')[0] + ' 00:00:00',
    inCallEndDateTime: new Date().toISOString().split('T')[0] + ' 23:59:59',
    inCallStartTime: null,
    inCallEndTime: null,
    inPageNumber: this.pageNumber,
    inRecordsPerPage: this.recordsPerPage,
    inUserId: null,
    inSortColumn: null,
    inSortOrder: null
  };
  toolTips: any = {
    Previous: 'Menu.REPORTS RECORDING.FREQUENT CALLS.Previous',
    Next: 'Menu.REPORTS RECORDING.FREQUENT CALLS.Next'
  }
  ngOnInit(): void {
    this.dataStatus = true
    this.searchOptionsFunction();
    this.getFrequentCallSummaryReport();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  // Function for get filters - agents, phonenumber
  searchOptionsFunction() {
    if (this.languageId == 1) {
      this.searchOptions = [
        { label: 'Caller ID', value: 'callerId' },
        { label: 'Dialed Number', value: 'dialledNumber' }
      ];
    }
    else if (this.languageId == 2) {
      this.searchOptions = [
        { label: 'Caller ID', value: 'callerId' },
        { label: 'Dialed Number', value: 'dialledNumber' }
      ];
    }

  }

  getFilters(): void {
    this.reportApi.getFilters({}).subscribe(
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
      (error: any) => {
        console.error(error);
      }
    );
  }

  // Function for get Frequent Report
  getFrequentCallSummaryReport(): void {
    // Ensure the report type matches the selected option
    this.callFilter.inReportType = this.selectedOption;
    // Call the API
    this.userApi.getfrequentCallReports(this.callFilter).subscribe(
      (result: any) => {
        if (result.status === true) {
          this.dataStatus = true;

          // Handle empty or missing data gracefully
          if (!result.data || result.data.length === 0) {
            this.dataSource.data = []; // Clear the table for no results
            this.TotalRecords = 0;
            return;
          }

          this.TotalRecords = result.data[1][0]?.TotalRecords || 0;

          // Map the result data with search filters
          this.dataSource.data = result.data[0].map((item: any) => ({
            agents: item.agentCode || 'No Data',
            agentName: item.agentName !== 'NULL' && item.agentName?.trim() ? item.agentName : 'No Data',
            attndcalls: item.attendedCalls,
            phonenumber:
              this.selectedOption === 'callerId' ? item.callerId : item.dialledNumber,
            missedcalls: item.missedCalls,
            zerotofivesecs: item.zeroToFiveSecCalls,
            sixtosixtysecs: item.sr6,
            onetothreemins: item.oneToThreeMinCalls,
            threeplusmins: item.aboveThreeMinCalls,
            out: item.totalOutgoingCalls,
            in: item.totalIncomingCalls,
          }));

          // Filter mapped data if the searched number is not found
          if (this.numberTosearch) {
            const searchNumber = this.numberTosearch.trim();

            this.dataSource.data = this.pagedData.filter((item) => {
              const phoneNumber = item.phonenumber?.toString(); // Convert to string
              return phoneNumber?.includes(searchNumber);
            });
            // If no match, create an empty row to indicate no data
            if (this.dataSource.data.length === 0) {
              this.dataSource.data = [{
                agents: '',
                agentName: '',
                attndcalls: '',
                phonenumber: '',
                missedcalls: '',
                zerotofivesecs: '',
                sixtosixtysecs: '',
                onetothreemins: '',
                threeplusmins: '',
                out: '',
                in: '',
                extension: 0,
                callerId: '',
                dialledNumber: ''
              }];
            }
          }
          // Update the table view
          this.updatePagedData();
        }
      },
      (error: any) => {
        console.error("API error:", error);
      }
    );
  }

  sortAgents() {
    const data = this.dataSource.data as TableData[];
    if (data && Array.isArray(data)) {
      if (this.sortDirection === 'asc') {
        this.dataSource.data = data.sort((a, b) => a.agents.localeCompare(b.agents));
        this.sortDirection = 'desc';
      } else {
        this.dataSource.data = data.sort((a, b) => b.agents.localeCompare(a.agents));
        this.sortDirection = 'asc';
      }
    }
  }

  filterData(data: TableData[]): TableData[] {
    // Apply filtering logic based on the phone number
    return data.filter(item => {
      const phoneNumber = this.selectedOption === 'callerId' ? item.callerId : item.dialledNumber;
      return phoneNumber.includes(this.selectedPhoneNumbers[0]);
    });
  }

  updateCallFilter(): void {
    if (this.selectedOption === 'callerId') {
      this.callFilter.inCallerId = this.selectedPhoneNumbers.includes('All') ? null : this.selectedPhoneNumbers.join(',');
      this.callFilter.inDialledNumber = null;
    } else {
      this.callFilter.inDialledNumber = this.selectedPhoneNumbers.includes('All') ? null : this.selectedPhoneNumbers.join(',');
      this.callFilter.inCallerId = null;
    }
    this.getFrequentCallSummaryReport();
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

  onAgentSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredAgents = this.agents.filter((agent: any) =>
      agent.uniqueValue.toLowerCase().includes(searchValue)
    );
  }
  isAgentSelected(agentCode: string): boolean {
    return this.selectedAgents.includes(agentCode);
  }


  // Function to toggle agent selection
  onAgentChange(agentCode: string, isChecked: boolean): void {
    if (agentCode === 'All') {
      if (isChecked) {
        // Select all agents
        this.selectedAgents = this.agents.map((agent: any) => agent.uniqueValue);
      } else {
        // Deselect all agents
        this.selectedAgents = [];
      }
    } else {
      if (isChecked) {
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

      // Update "All" checkbox based on individual selections
      if (this.selectedAgents.length === this.agents.length) {
        // If all agents are selected, check the "All" box
        this.selectedAgents.push('All');
      } else {
        // If not all agents are selected, uncheck "All"
        const allIndex = this.selectedAgents.indexOf('All');
        if (allIndex >= 0) {
          this.selectedAgents.splice(allIndex, 1);
        }
      }
    }

    // Update the filter input with selected agents
    this.callFilter.inAgentCode = this.selectedAgents.filter(agent => agent !== 'All').join(',');
  }

  trackByAgent(index: number, agent: any): string {
    return agent.uniqueValue; // Track by unique value for optimal rendering
  }


  // Function to toggle agent selection
  toggleAgent(agentCode: string, event: any): void {
    if (agentCode === 'All') {
      if (event.checked) {
        // Select all agents
        // this.selectedAgents = event.checked ? this.agents.map((agent:any) => agent.uniqueValue) : [];
        this.selectedAgents = this.agents.map((agent: any) => agent.uniqueValue);
        this.selectedAgents.push('All'); // Include "All" in the selection

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

        // Check "All" if all agents are selected
        if (this.selectedAgents.length === this.agents.length) {
          this.selectedAgents.push('All');
        }
      } else {
        // Remove individual agent from selectedAgents
        const index = this.selectedAgents.indexOf(agentCode);
        if (index >= 0) {
          this.selectedAgents.splice(index, 1);
        }

        // Uncheck "All" if not all agents are selected
        const allIndex = this.selectedAgents.indexOf('All');
        if (allIndex >= 0) {
          this.selectedAgents.splice(allIndex, 1);
        }
      }
    }

    // Update the filter input with selected agents
    this.callFilter.inAgentCode = this.selectedAgents.filter(agent => agent !== 'All').join(',');
  }

  isAllAgentsSelected(): boolean {
    return this.selectedAgents.length > 0 && this.selectedAgents.length === this.agents.length;
  }



  // Function for Date Range
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

          this.callFilter.inCallStartDateTime = startDateTime;
          this.callFilter.inCallEndDateTime = endDateTime;
        }
      });
    }, 500);
  }

  formatDate(date: Date | null): string {
    return date ? this.datePipe.transform(date, 'dd-MM-yyyy') || '' : '';
  }

  // Function for apply filters
  numberTosearch: string = '';
  applyFilters() {
    const searchVariable = this.numberTosearch.trim(); // Trim the input to avoid issues with spaces
    // Clear previous filter settings
    this.callFilter.inCallerId = null;
    this.callFilter.inDialledNumber = null;

    // Set search filters based on dropdown selection
    if (this.selectedOption === 'callerId') {
      this.callFilter.inCallerId = searchVariable;
    } else {
      this.callFilter.inDialledNumber = searchVariable;
    }

    // Override pagination settings to fetch all data
    this.callFilter.inPageNumber = null;
    this.callFilter.inRecordsPerPage = null;

    // Fetch the updated filtered data
    this.getFrequentCallSummaryReport();
  }
  onDropdownChange() {
    // Update the phone number dynamically based on the selected dropdown value
    this.pagedData = this.ELEMENT_DATA.map((item: TableData) => ({
      ...item,
      phonenumber: this.selectedOption === 'callerId' ? item.callerId : item.dialledNumber

    }));
    this.getFrequentCallSummaryReport();

    // Optionally reset the search box for consistency
    this.numberTosearch = '';
  }

  updatePhoneNumberField() {
    if (!this.ELEMENT_DATA) {
      console.error('ELEMENT_DATA is undefined 1');
      return;
    }
    if (this.selectedOption === 'callerId') {
      this.pagedData = this.ELEMENT_DATA.map((item: TableData) => ({
        ...item,
        phonenumber: item.callerId
      }));
    } else if (this.selectedOption === 'dialledNumber') {

      this.pagedData = this.ELEMENT_DATA.map((item: TableData) => ({
        ...item,
        phonenumber: item.dialledNumber
      }));
    }
  }

  onRadioChange(event: any) {
    this.selectedOption = event;
    this.selectedPhoneNumbers = ['All'];
    this.updateCallFilter();
    this.getFrequentCallSummaryReport();
    this.updatePhoneNumberField();
  }

  setOption(option: string): void {
    if (option === 'callerId' || option === 'dialledNumber') {
      this.selectedOption = option;
      this.columnHeading = option === 'callerId' ? 'Caller ID' : 'Dialled Number';
      this.updatePhoneNumberField();
    } else {
      console.error('Invalid option:', option);
    }
  }

  setDirection(direction: string) {
    // Update selected direction and filter based on input
    if (direction === '') {
      this.selectedDirection = 'All';
      this.callFilter.inCallDirection = '0,1'; // Set to include both directions
    } else if (direction === '0') {
      this.selectedDirection = 'Incoming';
      this.callFilter.inCallDirection = '0';
    } else if (direction === '1') {
      this.selectedDirection = 'Outgoing';
      this.callFilter.inCallDirection = '1';
    } else {
      console.warn("Unexpected direction value: ", direction);
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

      this.userApi.getfrequentCallReports(this.callFilter).subscribe(
        (result: any) => {
          this.data = result.data[0];
          this.exportdata = result.data[0].map((item: any) => ({
            "Agent ID": getSafeValue(item.agentCode),
            agentName: getSafeValue(item.agentName),
            'Dialed Number/Caller ID': this.selectedOption === 'callerId' ? getSafeValue(item.callerId) : getSafeValue(item.dialledNumber),
            AttendedCalls: getSafeValue(item.attendedCalls),
            missedCalls: getSafeValue(item.missedCalls),
            '0-5 Secs': getSafeValue(item.zeroToFiveSecCalls),
            '6-60 Secs': getSafeValue(item.sr6),
            '1-3 Mins': getSafeValue(item.oneToThreeMinCalls),
            '3+ Mins': getSafeValue(item.aboveThreeMinCalls),
            out: getSafeValue(item.totalOutgoingCalls),
            in: getSafeValue(item.totalIncomingCalls)
          }));

          // Log the exportdata for debugging purposes

          this.SharedService.generateFile(fileType, this.exportdata, 'Frequent Call Report');
          this.isLoading = false; // Stop loading after success
        },
        (error: any) => {
          console.error('Error exporting file:', error);
          this.isLoading = false; // Stop loading after failure
        }
      );
    } else {
      this.exportdata = selectedCalls.map(item => ({
        'Agent ID': getSafeValue(item['agentCode']),
        agentName: getSafeValue(item['agentName']),
        'Dialed Number/Caller ID': this.selectedOption === 'callerId' ? getSafeValue(item.callerId) : getSafeValue(item.dialledNumber),
        AttendedCalls: getSafeValue(item['attendedCalls']),
        missedCalls: getSafeValue(item['missedCalls']),
        '0-5 Secs': getSafeValue(item['zeroToFiveSecCalls']),
        '6-60 Secs': getSafeValue(item['sr6']),
        '1-3 Mins': getSafeValue(item['oneToThreeMinCalls']),
        '3+ Mins': getSafeValue(item['aboveThreeMinCalls']),
        out: getSafeValue(item['totalOutgoingCalls']),
        in: getSafeValue(item['totalIncomingCalls'])
      }));

      this.SharedService.generateFile(fileType, this.exportdata, 'Frequent Call Report');
      this.isLoading = false; // Stop loading after success
    }
  }
  //Pagination
  getTotalPages() {
    return Math.ceil(this.TotalRecords / this.recordsPerPage);
  }
  getPagesArray() {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }
  onItemsPerPageChange(event: MatSelectChange) {
    this.recordsPerPage = event.value;
    this.callFilter.inRecordsPerPage = this.recordsPerPage
    this.callFilter.inPageNumber = 1
    this.pageNumber = 1;
    this.updatePagedData()
    this.getFrequentCallSummaryReport();
    this.updateDisplayedRange();
  }
  nextPage() {
    if (this.pageNumber < this.getTotalPages()) {
      this.pageNumber++;
      this.callFilter.inRecordsPerPage = this.recordsPerPage;
      this.callFilter.inPageNumber = this.pageNumber
      this.getFrequentCallSummaryReport();
      this.updateDisplayedRange();
    }
  }
  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.callFilter.inRecordsPerPage = this.recordsPerPage;
      this.callFilter.inPageNumber = this.pageNumber;
      this.getFrequentCallSummaryReport();
      this.updateDisplayedRange();
    }
  }
  updateDisplayedRange() {
    const startRecord = (this.pageNumber - 1) * this.recordsPerPage + 1;
    this.displayedRange = `${startRecord}`;
  }
  goToPage(event: MatSelectChange) {
    const selectedPage = event.value; // event.value directly provides the selected page number
    this.pageNumber = parseInt(selectedPage, 10);
    if (this.pageNumber < 1 || this.pageNumber > this.getTotalPages()) {
      return;
    }
    this.callFilter.inPageNumber = this.pageNumber;
    this.updateDisplayedRange();
    this.getFrequentCallSummaryReport();
  }
  updatePagedData() {
    const startIndex = (this.pageNumber - 1) * this.recordsPerPage;
    const endIndex = startIndex + this.recordsPerPage;
    this.pagedData = this.dataSource.data.slice(startIndex, endIndex);
    this.dataSource.data = [...this.pagedData];
  }
  changePageSize(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.recordsPerPage = +selectElement.value;
    this.pageNumber = 1;
    this.currentPage = 0;
    this.updatePagedData();
  }
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.recordsPerPage = event.pageSize;
    this.updatePagedData();
  }
  formatPageNumber(page: number): string {
    return page < 10 ? `0${page}` : `${page}`;
  }
}

