import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormGroup, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { MAT_DATE_LOCALE, MatOptionModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepicker, MatDatepickerModule, MatDatepickerToggle, MatDateRangeInput, MatDateRangePicker } from '@angular/material/datepicker';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatOption, MatSelect, MatSelectChange } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckbox } from '@angular/material/checkbox';
import { CallReportService } from '../../core/services/callReport/call-report.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CustomDateComponent } from '../../shared/dialogComponents/custom-date/custom-date.component';
import { MatButtonModule } from '@angular/material/button';
import { SelectionModel } from '@angular/cdk/collections';
import { SharedService } from '../../core/shared/share.service';
import { TimelineConcurrentReportsService } from '../../core/services/timeLine&ConcurrentReports/timeline-concurrent-reports.service';


interface deletedCallReportData {
  extensionNumber: number,
  callStartTime: number;
  dialedNumber: number,
  duration: number;
  notes: number;
  // deletedUserID: number;
  [key: string]: string | number;
}
let ELEMENT_DATA: deletedCallReportData[] = [];

@Component({
  selector: 'app-deleted-calls',
  standalone: true,
  imports: [TranslateModule, MatSortModule, MatButtonModule, MatMenuModule, MatCheckbox, MatTooltipModule, MatOptionModule, MatSort, MatSortModule, MatPaginatorModule, MatTableModule, FormsModule, MatDatepickerModule, ReactiveFormsModule, MatToolbarModule, MatIcon, MatSelect, MatOptionModule, MatOption, MatMenuTrigger, MatMenu, CommonModule],
  providers: [provideNativeDateAdapter(),
  { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    DatePipe
  ],
  templateUrl: './deleted-calls.component.html',
  styleUrl: './deleted-calls.component.css'
})
export class DeletedCallsComponent {
  @ViewChild(MatSort)
  sort!: MatSort;
  callerId: any;
  displayedColumns: string[] = ['extensionNumber', 'dialledNumber', 'CallStartTime', 'duration', 'notes', 'deletedUsername']
  selectedStatusValue: string = ''
  @ViewChild(MatPaginator) paginator!: MatPaginator;


  totalRecord: number = 0
  dataSource = new MatTableDataSource<deletedCallReportData>(ELEMENT_DATA);
  displayedRange: string = '';
  pageSizeOptions = [2, 10, 20];
  pageSize = 10;
  recordsPerPage: number = 10;
  pagedData: deletedCallReportData[] = [];
  currentPage: number = 0;
  pageNumber: number = 1;
  extensionList: any;
  extensionNumber: any;
  selectedExtensions: string[] = [];
  selectedDateRange: string = 'Today';
  customFromDate: Date | null = null;
  customToDate: Date | null = null;
  checked: any;
  deletedUsername: any;
  deletedlist: { deletedUsername: string }[] = [];
  selectedDeletedUsernames: string[] = [];
  dialedNumberList: any;
  selectedDialedNumbers: string[] = [];
  callerIdList: any;
  selectedCallerIDs: string[] = [];
  selection = new SelectionModel<deletedCallReportData>(true, []);
  data: any;
  exportdata: any;
  item: any;
  searchdialNumber: any = null;

  constructor(
    public dialog: MatDialog,
    private CallReportService: CallReportService,
    private datePipe: DatePipe,
    private SharedService: SharedService,
    private reportApi: TimelineConcurrentReportsService,
  ) { }

  reportBody: any = {
    inDialledNumber: null,
    inCallerId: null,
    inExtensionNumber: null,
    inDeletedUserId: null,
    inCallStartDateTime: new Date().toISOString().split('T')[0] + ' 00:00:00', // Default to today
    inCallEndDateTime: new Date().toISOString().split('T')[0] + ' 23:59:59',   // Default to today
    inCallStartTime: null,
    inCallEndTime: null,
    inPageNumber: this.pageNumber,
    inRecordsPerPage: this.recordsPerPage,
    inUserId: null,
    inSortColumn: null,
    inSortOrder: null,
  };
  selectedDialedNumbersAndCallerIds: string[] = [];
  selectAllDeletedUsernames: boolean = false;
  filteredDeletedUsernames: any;
  selectedDeletedUserIDs: any;
  dialedNumberCallerIdList: any[] = [];

  ngOnInit(): void {

    this.dataSource.paginator = this.paginator;
    this.deleteCallReport();
    this.getFilters();
    this.updateDisplayedRange();
    this.updatePagedData();
    this.getDeletedUserDetails();
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  toolTips: any = {
    Previous: 'Menu.REPORTS RECORDING.AGENTS.Previous',
    Next: 'Menu.REPORTS RECORDING.AGENTS.Next'
  }

  getExtensionFilterText(): string {
    if (this.selectedExtensions.length === 0) {
      return 'All'; // If no extensions are selected
    } else if (this.selectedExtensions.length === 1 && !this.selectedExtensions.includes('All')) {
      return this.selectedExtensions[0]; // If exactly one extension is selected
    } else if (this.selectedExtensions.length > 1 && !this.selectedExtensions.includes('All')) {
      return 'Multiple'; // If more than one extension is selected
    } else if (this.selectedExtensions.includes('All')) {
      return 'All'; // If 'All' is selected
    }
    return 'All'; // Default if none of the conditions match
  }


  toggleExtension(extension: string, event: any): void {

    const isChecked = event.checked;
    if (extension === 'All') {
      if (isChecked) {
        // If 'All' is selected, select all extensions
        this.selectedExtensions = this.filteredExtensions.map(ext => ext.uniqueValue);
        this.selectedExtensions.push('All'); // Include 'All' in the selected list
      } else {
        // If 'All' is deselected, clear all selections
        this.selectedExtensions = [];
      }
    } else {
      if (isChecked) {
        // Add the specific extension
        if (!this.selectedExtensions.includes(extension)) {
          this.selectedExtensions.push(extension);
        }
        // Remove 'All' from selected if present
        this.selectedExtensions = this.selectedExtensions.filter(ext => ext !== 'All');
      } else {
        // Remove the specific extension
        this.selectedExtensions = this.selectedExtensions.filter(ext => ext !== extension);

        // Deselect 'All' immediately if it's currently selected
        if (this.selectedExtensions.includes('All')) {
          this.selectedExtensions = this.selectedExtensions.filter(ext => ext !== 'All');
        }
      }
    }

    // Update the reportBody with the selected extensions as a comma-separated string
    this.reportBody.inExtensionNumber = this.selectedExtensions.join(',');

    // Update selectAllExtensions flag
    this.selectAllExtensions = this.selectedExtensions.length === this.filteredExtensions.length;
  }


  selectAllExtensions: boolean = false;
  filteredExtensions: any[] = [];
  extensions: any = [];

  toggleSelectAllExtensions(isChecked: boolean): void {
    if (isChecked) {
      this.selectedExtensions = this.filteredExtensions.map(ext => ext.uniqueValue);
      this.selectedExtensions.push('All');
    } else {
      this.selectedExtensions = [];
    }
    this.reportBody.inExtensionNumber = this.selectedExtensions.join(',');
  }
  onExtensionSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredExtensions = this.extensions.filter((agent: any) =>
      agent.uniqueValue.toLowerCase().includes(searchValue)
    );
  }
  isExtensionSelected(agentCode: string): boolean {
    return this.selectedExtensions.includes(agentCode);
  }


  applyFilters() {
    this.pageNumber = 1;
    this.recordsPerPage = 10;
    this.reportBody.inPageNumber = this.pageNumber;
    this.reportBody.inRecordsPerPage = this.recordsPerPage;
    this.deleteCallReport();
  }

  deleteCallReport(): void {
    let body = this.reportBody;
    body.inCallerId = this.searchdialNumber,
      body.inDialledNumber = this.searchdialNumber
    this.CallReportService.deleteCallReport(body).subscribe((result: any) => {
      if (result.status === true) {
        this.totalRecord = result.data[1][0].TotalRecords;
        this.dataSource.data = result.data[0].map((item: any) => ({
          extensionNumber: item.extensionNumber,
          dialledNumber: item.dialledNumber,
          callerId: item.callerId,
          CallStartTime: item.callStartTime,
          duration: item.talktime,
          notes: item.notes,
          deletedUsername: item.deletedUsername,
          deletedUserID: item.deletedUserID
        }));
        this.updatePagedData();
      }
    }, error => {
      console.error(error);
    });
  }


  //Function for Date Range Filter
  setDateRange(range: string): void {
    this.selectedDateRange = range;

    const today = new Date();
    let startDateTime: string = today.toISOString().split('T')[0] + ' 00:00:00'; // Default to today
    let endDateTime: string = today.toISOString().split('T')[0] + ' 23:59:59';   // Default to today

    switch (range) {
      case 'Today':
        // Today's range already set by default
        break;

      case 'This Week':
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        const endOfWeek = new Date(today.setDate(startOfWeek.getDate() + 6));
        startDateTime = startOfWeek.toISOString().split('T')[0] + ' 00:00:00';
        endDateTime = endOfWeek.toISOString().split('T')[0] + ' 23:59:59';
        break;

      case 'This Month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        startDateTime = startOfMonth.toISOString().split('T')[0] + ' 00:00:00';
        endDateTime = endOfMonth.toISOString().split('T')[0] + ' 23:59:59';
        break;

      case 'This Quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        startDateTime = startOfQuarter.toISOString().split('T')[0] + ' 00:00:00';
        endDateTime = endOfQuarter.toISOString().split('T')[0] + ' 23:59:59';
        break;

      case 'This Year':
        const startOfYear = new Date(today.getFullYear(), 0, 1); // January is month 0
        const endOfYear = new Date(today.getFullYear(), 11, 31); // December is month 11
        startDateTime = startOfYear.toISOString().split('T')[0] + ' 00:00:00';
        endDateTime = endOfYear.toISOString().split('T')[0] + ' 23:59:59';
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

    // Update the reportBody with the computed dates
    this.reportBody.inCallStartDateTime = startDateTime;
    this.reportBody.inCallEndDateTime = endDateTime;
  }



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

  //Report file download
  isLoading = false;
  exportToFile(fileType: string) {
    this.isLoading = true; // Start loading

    const selectedCalls = this.selection.selected;


    if (selectedCalls.length === 0) {
      this.reportBody.inPageNumber = null;
      this.reportBody.inRecordsPerPage = null;

      this.CallReportService.deleteCallReport(this.reportBody).subscribe(
        (result: any) => {
          this.data = result.data[0];
          this.exportdata = result.data[0].map((item: any) => ({
            extensionNumber: item.extensionNumber,
            dialledNumber: item.dialledNumber,
            callerId: item.callerId,
            CallStartTime: this.datePipe.transform(item.callStartTime, 'dd-MM-yyyy hh:mm:ss a') || '',
            duration: item.duration,
            notes: item.notes,
            deletedUsername: item.deletedUsername

          }));
          this.SharedService.generateFile(fileType, this.exportdata, 'Deleted Call Report');
          this.isLoading = false; // Stop loading after success
        },
        (error: any) => {
          console.error('Error exporting file:', error);
          this.isLoading = false; // Stop loading after failure
        }
      );
    } else {
      this.exportdata = selectedCalls.map(item => ({
        extensionNumber: item.extensionNumber,
        dialledNumber: item['dialledNumber'],
        callerId: item['callerId'],
        CallStartTime: this.datePipe.transform(item.callStartTime, 'dd-MM-yyyy hh:mm:ss a') || '',
        duration: item.duration,
        notes: item.notes,
        deletedUsername: item['deletedUsername']

      }));
      this.SharedService.generateFile(fileType, this.exportdata, 'Deleted Call Report');
      this.isLoading = false; // Stop loading after success
    }
  }


  // Function for Pagination
  onItemsPerPageChange(event: MatSelectChange) {
    this.recordsPerPage = event.value;
    this.reportBody.inRecordsPerPage = this.recordsPerPage
    this.reportBody.inPageNumber = 1
    this.pageNumber = 1;

    this.updatePagedData()
    this.deleteCallReport();
    this.updateDisplayedRange();
  }

  goToPage(event: MatSelectChange) {
    const selectedPage = event.value;
    this.pageNumber = parseInt(selectedPage, 10);
    if (this.pageNumber < 1 || this.pageNumber > this.getTotalPages()) {
      return;
    }
    this.reportBody.inPageNumber = this.pageNumber;
    this.updateDisplayedRange();
    this.deleteCallReport();
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
      this.reportBody.inRecordsPerPage = this.recordsPerPage;
      this.reportBody.inPageNumber = this.pageNumber;
      this.deleteCallReport();
      this.updateDisplayedRange();
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
      this.deleteCallReport();
      this.updateDisplayedRange();
    }
  }

  updateDisplayedRange() {
    const startRecord = (this.pageNumber - 1) * this.recordsPerPage + 1;
    this.displayedRange = `${startRecord}`;
  }
  changePageSize(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.recordsPerPage = +selectElement.value;
    this.pageNumber = 1;
    this.currentPage = 0;
    this.updatePagedData();
  }

  updatePagedData() {
    const startIndex = this.currentPage * this.recordsPerPage;
    const endIndex = startIndex + this.recordsPerPage;
    this.pagedData = this.pagedData.slice(startIndex, endIndex);
  }
  allowOnlyDigits(event: KeyboardEvent): void {
    const charCode = event.charCode || event.keyCode;
    // Allow only digits (char codes 48-57)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }


    // Toggle individual deleted usernames
    toggleDeletedUsername(deletedUser: any, event: any): void {
      const isChecked = event.checked;
      // Ensure arrays are defined
      this.selectedDeletedUsernames = this.selectedDeletedUsernames || [];
      this.selectedDeletedUserIDs = this.selectedDeletedUserIDs || [];
      
      if (deletedUser === 'All') {
        if (isChecked) {
          // If 'All' is selected, select all usernames
          this.selectedDeletedUsernames = this.filteredDeletedUsernames.map(
            (user: { uniqueValue: string }) => user.uniqueValue
          );
          this.selectedDeletedUsernames.push('All'); // Add 'All' explicitly
    
          this.selectedDeletedUserIDs = this.filteredDeletedUsernames.map(
            (user: { deletedUserID: number }) => user.deletedUserID
          );
          
        } else {
          // If 'All' is deselected, clear all selections
          this.selectedDeletedUsernames = [];
          this.selectedDeletedUserIDs = [];
        }
      } else {
        if (isChecked) {
          // Add the specific username and ID
          if (!this.selectedDeletedUsernames.includes(deletedUser.uniqueValue)) {
            this.selectedDeletedUsernames.push(deletedUser.uniqueValue);
            this.selectedDeletedUserIDs.push(deletedUser.deletedUserID);
          }
        } else {
          // Remove the specific username and ID
          this.selectedDeletedUsernames = this.selectedDeletedUsernames.filter(
            (name) => name !== deletedUser.uniqueValue
          );
          this.selectedDeletedUserIDs = this.selectedDeletedUserIDs.filter(
            (id: any) => id !== deletedUser.deletedUserID
          );
        }
      }
    
      
      // Update the reportBody with the selected IDs
      this.reportBody.inDeletedUserId = this.selectedDeletedUserIDs.join(',');
    
      // Update selectAll flag
      this.selectAllDeletedUsernames =
        this.selectedDeletedUsernames.length === this.filteredDeletedUsernames.length;
    }

  // Toggles the selection of all usernames
  toggleSelectAllDeletedUsernames(isChecked: boolean): void {
    this.selectAllDeletedUsernames = isChecked;
    if (isChecked) {
      // Select all usernames
      this.selectedDeletedUsernames = this.filteredDeletedUsernames.map(
        (user: { uniqueValue: any }) => user.uniqueValue
      );
    
      this.selectedDeletedUsernames.push('All'); // Add 'All' explicitly
  
      this.selectedDeletedUserIDs = this.filteredDeletedUsernames.map(
        (user: { deletedUserID: number }) => user.deletedUserID
      );
    } else {
      // Clear all selections
      this.selectedDeletedUsernames = [];
      this.selectedDeletedUserIDs = [];
    }
    // Update reportBody with all selected IDs
    this.reportBody.inDeletedUserId = this.selectedDeletedUserIDs.join(',');
  }
  // Updates the filtered usernames based on the search value
  onDeletedUsernameSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase().trim();

    if (searchValue) {
      this.filteredDeletedUsernames = this.deletedlist.filter((user: any) =>
        user.uniqueValue.toLowerCase().includes(searchValue)
      );
    } else {
      this.filteredDeletedUsernames = [...this.deletedlist]; // Reset to full list if search is empty
    }
  }

  selectAllDeletedUsernamess(): boolean {
    return (
      Array.isArray(this.selectedDeletedUsernames) &&
      Array.isArray(this.filteredDeletedUsernames) &&
      Array.isArray('')&&
      this.selectedDeletedUsernames.length === this.filteredDeletedUsernames.length
    );
  }

  isDeletedUsernameSelected(uniqueValue: string): boolean {
    return this.selectedDeletedUsernames.includes(uniqueValue);
  }
  trackByDeletedUser(index: number, deletedUser: any): string {
    return deletedUser.uniqueValue; // Ensure 'uniqueValue' is unique in the list
  }

  //Auto Delete
  isAutoDelete: boolean = false;
  toggleAutoDelete(isChecked: boolean): void {
    this.isAutoDelete = isChecked;
  
    if (isChecked) {
      // When AutoDelete is checked
      if (this.selectAllDeletedUsernames) {
        // If both All and AutoDelete are checked, pass null to backend.
        this.selectedDeletedUserIDs = [null];
        this.selectedDeletedUsernames = [];
        this.reportBody.inDeletedUserId = null;
      } else {
        // Only AutoDelete is checked: pass zero value.
        this.selectedDeletedUserIDs = [0];
        this.selectedDeletedUsernames = ['AutoDelete'];
        this.reportBody.inDeletedUserId = '0';
      }
    } else {
      // If AutoDelete is unchecked, pass null.
      this.selectedDeletedUserIDs = [null];
      this.selectedDeletedUsernames = [];
      this.reportBody.inDeletedUserId = null;
    }
  }
  
  
  
  // Check if AutoDelete is selected
  isAutoDeleteSelected(): boolean {
    return this.isAutoDelete;
  }

  getFilters(): void {
    // Step 1: Fetch Filters Data
    this.reportApi.getFilters({}).subscribe(
      (result: any) => {
        
        
        if (result.status === true) {
          // Collect unique values
          const uniqueValues = new Set();
          result.callReports.forEach((item: any) => {
            uniqueValues.add(item);
          });

          // Convert Set to Array
          const uniqueValuesArray = [...uniqueValues];

          // Step 2: Process Extensions, Dialed Numbers, Caller IDs
          this.extensions = uniqueValuesArray.filter((value: any) =>
            value.valueType.startsWith('extensionNumber')
          );

          this.dialedNumberCallerIdList = uniqueValuesArray.filter(
            (value: any) =>
              value.valueType === 'dialledNumber' || value.valueType === 'callerId'
          );

          // Step 3: Fetch Deleted Usernames from getDeletedUserDetails
          this.reportApi.getDeletedUserDetails({}).subscribe(
            (deletedUserResult: any) => {
              if (deletedUserResult.status === true) {
                this.filteredDeletedUsernames = deletedUserResult.data.map(
                  (user: any) => ({
                    uniqueValue: user.name || '', // Ensure name is available
                    deletedUserID: user.deletedUserID || null, // Ensure ID is available
                  })
                ).filter((user: { uniqueValue: any; deletedUserID: null; }) => user.uniqueValue && user.deletedUserID !== null);
                this.filteredDeletedUsernames.push({uniqueValue:'AutoDelete',deletedUserID:'0'})

                // Filter Deleted Usernames (Combine with existing data if needed)
                this.deletedlist = [...this.filteredDeletedUsernames]; // Initialize deleted list
              }
            },
            (error) => {
              console.error('Error fetching deleted user details:', error);
            }
          );

          // Initialize other filtered lists
          this.filteredExtensions = [...this.extensions];
          this.dialedNumberList = [...this.dialedNumberCallerIdList];
        }
      },
      (error) => {
        console.error(error);
      }
    );
  }

  getDeletedUserDetails() {
    let body = this.reportBody;
    // Make the API call to get employee data
    this.reportApi.getDeletedUserDetails(body).subscribe(
      (result: any) => {

        if (result.status === true) {
        }
      }
    )
  }

  getDeletedUsernameFilterText(): string {
    if (this.selectedDeletedUsernames.includes('All')) {
      return 'All'; // Explicitly handle when 'All' is selected
    }
    const selectedCount = this.selectedDeletedUsernames.length;

    if (selectedCount === 0) {
      return 'All'; // Default when nothing is selected
    } else if (selectedCount === 1) {
      return this.selectedDeletedUsernames[0]; // Show the single selected username
    } else if (selectedCount > 1) {
      return 'Multiple'; // Show 'Multiple' for more than one selection
    }

    return 'All'; // Fallback (default case)
  }
}
