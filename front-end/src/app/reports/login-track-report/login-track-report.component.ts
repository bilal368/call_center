import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepicker, MatDatepickerInputEvent, MatDatepickerModule, MatDateRangeInput } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuPanel, MatMenuTrigger } from '@angular/material/menu';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { LoginTrackReportServiceComponent } from '../../core/services/login-track-report-service/login-track-report-service.component';
import { MatButtonModule } from '@angular/material/button';
import { CustomDateComponent } from '../../shared/dialogComponents/custom-date/custom-date.component';
import { MatDialog } from '@angular/material/dialog';
import { SharedService } from '../../core/shared/share.service';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TimelineConcurrentReportsService } from '../../core/services/timeLine&ConcurrentReports/timeline-concurrent-reports.service';





interface loginTrackData {
  name: string;
  loginStatus: string;
  loginTime: number;
  logoutTime: number;
  ipaddress:string;
  [key: string]: string | number;
}
let ELEMENT_DATA: loginTrackData[] = [];

@Component({
  selector: 'app-login-track-report',
  standalone: true,
  imports: [MatIconModule, MatSelectModule,MatButtonModule, MatCheckbox, FormsModule,
     MatSortModule, MatTableModule, CommonModule, MatMenuTrigger, MatSelectModule, 
     MatMenuModule, TranslateModule, MatToolbarModule, MatDatepickerModule, MatTooltipModule],
  templateUrl: './login-track-report.component.html',
  styleUrl: './login-track-report.component.css',
  providers: [DatePipe]
})
export class LoginTrackReportComponent {

  displayedColumns: string[] = ['name', 'loginStatus', 'loginTime', 'logoutTime','ipaddress'];
  dataSource = new MatTableDataSource<loginTrackData>(ELEMENT_DATA);
  // dataSource = new MatTableDataSource<loginTrackData>(); // Replace with your data model

  selectedLoginStatuses: string[] = [];
  authenticated: any;
  items: any;
  selection = new SelectionModel<loginTrackData>(true, []);
  exportdata: any;
  data: any;
  @ViewChild(MatSort)
  sort!: MatSort;
  toolTips: any = {
    "apply": 'Menu.Apply Changes',
    "download": 'Menu.Download Reports',
    Previous: 'Menu.REPORTS RECORDING.AGENTS.Previous',
    Next: 'Menu.REPORTS RECORDING.AGENTS.Next'
  }
  sortDirection: 'asc' | 'desc' = 'asc';
  filteredLoginUsernames: any;
  loginUserList: { name: string }[] = [];
  selectedLoginUsernames: string[] = [];
  // selectedLoginUserIDs: any;
  selectAllLoginUsernamesFlag: boolean =false;
  selectAllLoginUsername: boolean = false;
  selectedLoginUserIDs: number[] = []; // Ensure this is initialized

trackByUsername: any;


  constructor(private router: Router, private userApi: LoginTrackReportServiceComponent,public dialog: MatDialog,private datePipe: DatePipe,private SharedService: SharedService,    private reportApi: TimelineConcurrentReportsService,
  ) { }
  pageSizeOptions = [10, 20];
  pageSize = 2;
  TotalRecords: number = 0;
  recordsPerPage: number = 10;
  currentPage: number = 0;
  pageNumber: number = 1;
  menu3: MatMenuPanel<any> | null | undefined;
  displayedRange: string | undefined;
  selectedDateRange: string ='Today';
  customFromDate: Date | null = null;
  customToDate: Date | null = null;


  selectedDeletedUsernames: string[] = [];
  deletedUsername: any;
  deletedlist: { deletedUsername: string }[] = [];
  dialedNumberList: any;
  selectedDialedNumbersAndCallerIds: string[] = [];
  selectAllDeletedUsernames: boolean = false;
  filteredDeletedUsernames: any;
  selectedDeletedUserIDs: any;


  reportBody: any = {
    inLoginStatus: null,
    inLoginTrackUserId: null,
    inCallStartDateTime: new Date().toISOString().split('T')[0] + ' 00:00:00', // Default to today
    inCallEndDateTime: new Date().toISOString().split('T')[0] + ' 23:59:59',   // Default to today
    inPageNumber: this.pageNumber,
    inRecordsPerPage: this.recordsPerPage,
    inSortColumn: null,
    inSortOrder: null,
  };
 
  ngOnInit(): void {
    this.updatePagedData();
    this.getLoginTrackReport();
    this.getFiltersloginTrack();
    this.updateDisplayedRange();
    this.getloginUserDetails();
  }
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  getloginUserDetails() {
    let body = this.reportBody;
    // Make the API call to get employee data
    this.reportApi.getloginUserDetails(body).subscribe(
      (result: any) => {
        if (result.status === true) {
        }
      }
    )
  }

  getLoginTrackReport(): void {
    let body = this.reportBody;
    this.userApi.getloginTrackReports(body).subscribe((result: any) => {
      if (result.status === true) { 
        this.TotalRecords = result.data[1][0].TotalRecords;
        this.dataSource.data = result.data[0].map((item: any) => ({
          // name: item.name.split(' ')[0], // Extract only the first name
          name: item.username, // Extract only the first name

          loginStatus: item.loginStatus,
          loginTime: item.loginTime,
          logoutTime: item.logoutTime,
          ipAddress:item.ipAddress

        }));
        this.updatePagedData();
      }
    }, (error: any) => {
      console.error(error);
    });
  }
  selectedLoginUser: { userId: number | null, username: string } | null = null;

  // Function for Filters
  getFiltersloginTrack(): void {
    let body = {};
  
    // Step 1: Fetch Login Track Filters Data
    this.userApi.getFiltersloginTrack(body).subscribe(
      (result: any) => {
        if (result.status === true) {
          this.authenticated = result.authenticated;
          // Step 2: Fetch Login User Details (instead of Deleted User Details)
          this.reportApi.getloginUserDetails({}).subscribe(
            (loginUserResult: any) => {           
              if (loginUserResult.status === true) {
                // Extract both userId and username
                this.filteredLoginUsernames = loginUserResult.data
                  .map((user: any) => ({
                    userId: user.userId || null, // Ensure userId is available
                    username: user.username || '' // Ensure username is available
                  }))
                  .filter((user: { username: string; userId: null; }) => user.username.trim() !== '' && user.userId !== null); // Remove empty or invalid values
          
                // Initialize the login user list
                this.loginUserList = [...this.filteredLoginUsernames];
              }
            },
            (error: any) => {
              console.error('Error fetching login user details:', error);
            }
          );
          
          
        }
      },
      (error) => {
        console.error('Error fetching login track filters:', error);
      }
    );
  }

  applyFilters() {
    this.pageNumber =1;
    this.recordsPerPage=10
    this.reportBody.inPageNumber = this.pageNumber;
    this.reportBody.inRecordsPerPage = this.recordsPerPage;
    this.getLoginTrackReport();
  }
  
  
  // Checkbox function 

  toggleLoginStatus(loginStatus: string, event: MatCheckboxChange): void {
    if (event.checked) {
      // Add the login status if it's not already in the array
      if (!this.selectedLoginStatuses.includes(loginStatus)) {
        this.selectedLoginStatuses.push(loginStatus);
      }
    } else {
      // Remove the login status if it's unchecked
      const index = this.selectedLoginStatuses.indexOf(loginStatus);
      if (index >= 0) {
        this.selectedLoginStatuses.splice(index, 1);
      }
    }

    // Update the callFilter or other property to use the selected login statuses
    this.reportBody.inLoginStatus = this.selectedLoginStatuses.join(',');
  }


    // Function for Date Range
    setDateRange(range: string) {
      this.selectedDateRange = range;
      const today = new Date();
      let startDateTime: string = '0000-00-00 00:00:00';
      let endDateTime: string = '0000-00-00 23:59:59';
    
      switch (range) {
        case 'Today':
          startDateTime = today.toISOString().split('T')[0] +' '+'00:00:00';
          endDateTime = today.toISOString().split('T')[0] + ' '+'23:59:59';
          break;
        case 'This Week':
          const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
          const endOfWeek = new Date(today.setDate(startOfWeek.getDate() + 6));
          startDateTime = startOfWeek.toISOString().split('T')[0] +' '+'00:00:00';
          endDateTime = endOfWeek.toISOString().split('T')[0] + ' '+'23:59:59';
          break;
        case 'This Month':
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 2);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          startDateTime = startOfMonth.toISOString().split('T')[0] +' '+'00:00:00';
          endDateTime = endOfMonth.toISOString().split('T')[0] +' '+ '23:59:59';
          break;
        case 'This Quarter':
          const quarter = Math.floor(today.getMonth() / 3);
          const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
          const endOfQuarter = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
          startDateTime = startOfQuarter.toISOString().split('T')[0] +' '+ '00:00:00';
          endDateTime = endOfQuarter.toISOString().split('T')[0] +' '+'23:59:59';
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
    
    
     // Function openCustomDateDialog Date Range
     openCustomDateDialog(selectedDateRange:any) {

      this.selectedDateRange=selectedDateRange;
      const currentDate = new Date();
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(currentDate.getMonth() + 1);
      const startDate = this.formatDate(currentDate);
      const endDate = this.formatDate(oneMonthFromNow);
      let dialogRef :any;

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
      
            const startDateTime = customFromDate.toISOString().split('T')[0] +' '+'00:00:00';
            const endDateTime = customToDate.toISOString().split('T')[0] +' '+ '23:59:59';
      
            this.reportBody.inCallStartDateTime = startDateTime;
            this.reportBody.inCallEndDateTime = endDateTime;
          }
        });
      }, 500);
    }
    formatDate(date: Date | null): string {
      return date ? this.datePipe.transform(date, 'dd/MM/yyyy') || '' : '';
    }

    isLoading = false;
    exportToFile(fileType: string) {
      this.isLoading = true; // Start loading
  
      const selectedCalls = this.selection.selected;
  
  
      if (selectedCalls.length === 0) {
        this.reportBody.inPageNumber = null;
        this.reportBody.inRecordsPerPage = null;
        this.getLoginTrackReport();
  
        this.userApi.getloginTrackReports(this.reportBody).subscribe(
          (result: any) => {
            this.data= result.data[0];
            this.exportdata = result.data[0].map((item: any) => ({
              name: item.name,
              loginStatus: item.loginStatus,
              loginTime: this.datePipe.transform(item.loginTime, 'dd-MM-yyyy hh:mm:ss a') || '',
              logoutTime: this.datePipe.transform(item.logoutTime, 'dd-MM-yyyy hh:mm:ss a') || '',
    
            }));
            this.SharedService.generateFile(fileType, this.exportdata, 'Login Track Report');
            this.isLoading = false; // Stop loading after success
          },
          (error) => {
            console.error('Error exporting file:', error);
            this.isLoading = false; // Stop loading after failure
          }
        );
      } else {
        this.exportdata = selectedCalls.map(item => ({
          name: item.name,
              loginStatus: item.loginStatus,
              loginTime: this.datePipe.transform(item.loginTime, 'dd-MM-yyyy hh:mm:ss a') || '',
              logoutTime: this.datePipe.transform(item.logoutTime, 'dd-MM-yyyy hh:mm:ss a') || '',
        }));
        this.SharedService.generateFile(fileType, this.exportdata, 'Login Track Report');
        this.isLoading = false; // Stop loading after success
      }
    }

    sortIPAddresses() {
      const data = this.dataSource.data as loginTrackData[]; // Ensure Agent[] has an ipAddress property
    
      if (data && Array.isArray(data)) {
        if (this.sortDirection === 'asc') {
          this.dataSource.data = data.sort((a, b) => a.ipaddress.localeCompare(b.ipaddress));
          this.sortDirection = 'desc';
        } else {
          this.dataSource.data = data.sort((a, b) => b.ipaddress.localeCompare(a.ipaddress));
          this.sortDirection = 'asc';
        }
      }
    }
    
    getUsernameFilterText(): string {
      if (this.selectedLoginUsernames.includes('All')) {
        return 'All'; // Explicitly handle when 'All' is selected
      }
      const selectedCount = this.selectedLoginUsernames.length;
    
      if (selectedCount === 0) {
        return 'All'; // Default when nothing is selected
      } else if (selectedCount === 1) {
        return this.selectedLoginUsernames[0]; // Show the single selected username
      } else if (selectedCount > 1) {
        return 'Multiple'; // Show 'Multiple' for more than one selection
      }
    
      return 'All'; // Fallback (default case)
    }
    
    onLoginUsernameSearchChange(event: Event): void {
      const searchValue = (event.target as HTMLInputElement).value.toLowerCase().trim();
      
      if (searchValue) {
        this.filteredLoginUsernames = this.loginUserList.filter((user: any) =>
          user.username.toLowerCase().includes(searchValue)
        );
      } else {
        this.filteredLoginUsernames = [...this.loginUserList]; // Reset to full list if search is empty
      }

    }
    
    selectAllLoginUsernames(): boolean {
      return (
        Array.isArray(this.selectedLoginUsernames) &&
        Array.isArray(this.filteredLoginUsernames) &&
        this.selectedLoginUsernames.length === this.filteredLoginUsernames.length
      );
    }

    
    isLoginUsernameSelected(uniqueValue: string): boolean {
      return this.selectedLoginUsernames.includes(uniqueValue);
    }
    
    
    trackByLoginUser(index: number, loginUser: any): string {
      return loginUser.uniqueValue; // Ensure 'uniqueValue' is unique in the list
    }
    
    toggleSelectAllLoginUsernames(isChecked: boolean): void {
      this.selectAllLoginUsernamesFlag = isChecked;
    
      if (isChecked) {
        this.selectedLoginUsernames = this.filteredLoginUsernames.map((user: { username: any; }) => user.username);
        this.selectedLoginUserIDs = this.filteredLoginUsernames.map((user: { userId: any; }) => user.userId);
        this.selectedLoginUsernames.push('All');
        this.reportBody.inLoginTrackUserId = null; // Set to null for backend
      } else {
        this.selectedLoginUsernames = [];
        this.selectedLoginUserIDs = [];
        this.reportBody.inLoginTrackUserId = null;
      }
    }
    
    toggleLoginUsername(loginUser: any, event: any): void {
      const isChecked = event.checked;
    
      // Ensure arrays are initialized
      this.selectedLoginUsernames = this.selectedLoginUsernames || [];
      this.selectedLoginUserIDs = this.selectedLoginUserIDs || [];
    
      if (loginUser === 'All') {
        if (isChecked) {
          // If 'All' is selected, clear other selections and set `null`
          this.selectedLoginUsernames = ['All'];
          this.selectedLoginUserIDs = [];
          this.reportBody.inLoginTrackUserId = null; // Set to null for backend
        } else {
          // If 'All' is unchecked, clear selections
          this.selectedLoginUsernames = [];
          this.selectedLoginUserIDs = [];
          this.reportBody.inLoginTrackUserId = null;
        }
      } else {
        if (isChecked) {
          // Add selected username and userId
          if (!this.selectedLoginUsernames.includes(loginUser.username)) {
            this.selectedLoginUsernames.push(loginUser.username);
            this.selectedLoginUserIDs.push(loginUser.userId);
          }
        } else {
          // Remove deselected username and userId
          this.selectedLoginUsernames = this.selectedLoginUsernames.filter(name => name !== loginUser.username);
          this.selectedLoginUserIDs = this.selectedLoginUserIDs.filter((id: any) => id !== loginUser.userId);
          this.selectedLoginUsernames = [];
        }
      }
    
      // If no usernames are selected, set `inLoginTrackUserId` to null for backend
      this.reportBody.inLoginTrackUserId = this.selectedLoginUserIDs.length > 0 ? this.selectedLoginUserIDs.join(',') : null;
      // Update the "Select All" flag only if all individual users are selected
      this.selectAllLoginUsernamesFlag = this.selectedLoginUserIDs.length === this.filteredLoginUsernames.length;
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
    this.reportBody.inRecordsPerPage = this.recordsPerPage
    this.reportBody.inPageNumber = 1
    this.pageNumber = 1;
    this.updatePagedData()
    this.getLoginTrackReport();
    this.updateDisplayedRange();
  }
  nextPage() {
    if (this.pageNumber < this.getTotalPages()) {
      this.pageNumber++;
      this.reportBody.inRecordsPerPage = this.recordsPerPage;
      this.reportBody.inPageNumber = this.pageNumber
      this.getLoginTrackReport();
      this.updateDisplayedRange();
    }
  }
  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.reportBody.inRecordsPerPage = this.recordsPerPage;
      this.reportBody.inPageNumber = this.pageNumber;
      this.getLoginTrackReport();
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
    this.reportBody.inPageNumber = this.pageNumber;
    this.updateDisplayedRange();
    this.getLoginTrackReport();
  }

  updatePagedData() {
    const startIndex = this.currentPage * this.recordsPerPage;
    const endIndex = startIndex + this.recordsPerPage;
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


  formatTableTime(time: any): string {
  
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const date = new Date();
  
    // Set the time in UTC
    date.setUTCHours(hours, minutes, seconds);
  
    // Convert to local time and format it
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  
  
  
}
