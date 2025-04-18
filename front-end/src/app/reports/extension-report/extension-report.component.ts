import { Component, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CallReportService } from '../../core/services/callReport/call-report.service'
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { concat } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { CustomDateComponent } from '../../shared/dialogComponents/custom-date/custom-date.component';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../core/shared/share.service';
import { MatTooltipModule } from '@angular/material/tooltip';

interface TableData {
  totalOutgoingCalls: any;
  totalIncomingCalls: any;
  avgCallsPerDay: any;
  totalDaysCallsMade: any;
  averageDuration: any;
  totalDuration: any;
  extensionNumber: string;
  extension: string;
  callCount: string;
  duration: string;
  avrDuration: string;
  totWrkDays: string;
  avgWrkDays: string;
  extensionLabel: string;
}
@Component({
  selector: 'app-extension-report',
  standalone: true,
  imports: [MatIconModule, MatMenuModule, HttpClientModule, MatToolbarModule, MatTableModule, MatCheckboxModule, FormsModule,
    MatInputModule, MatSelectModule, MatFormFieldModule, MatSortModule, MatPaginatorModule,
    MatTooltipModule, MatButtonModule, TranslateModule, CommonModule, MatSort],
  templateUrl: './extension-report.component.html',
  providers: [CallReportService, DatePipe],
  styleUrl: './extension-report.component.css'
})
export class ExtensionReportComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  selectedDateRange: string = 'Today';
  selectedDate: string = 'Today';
  searchText:any;
  selectedDirection: string = 'All';
  extensionList: any = [];
  filteredExtensionList: any[] = this.extensionList;
  pagedData: TableData[] = [];
  totalLength = 0;
  pageNumber: number = 1;
  recordsPerPage = 10;
  displayedColumns: string[] = ['extensionNumber', 'callCount','totalIncomingCalls','totalOutgoingCalls','totalDuration', 'averageDuration', 'totalDaysCallsMade', 'avgCallsPerDay'];
  noDataFound: boolean = false;
  data: TableData[] = [];
  exportdata: any;
  PageNumberValue: any;
  sortDirection: 'asc' | 'desc' = 'asc';
  isAscending = true;
  selectedExtensionNumbersMap: { [key: string]: boolean } = {};
  selectedExtensionNumbers: string[] = [];
  selectedExtension:any;
  customFromDate: Date | null = null;
  customToDate: Date | null = null;
  extensionReportBody: any = {
    dateType: 'Today',
    customFromDate: null,
    customToDate: null,
    extension: null,
    direction: null,
    pageNo: this.pageNumber,
    recordPage: this.recordsPerPage,
    inUserId: null,
    sortCol: null,
    sortOrder: null
  }
  displayedRange: string = '';
  currentPage: number = 0;
  constructor(private callReportApi: CallReportService, private datePipe: DatePipe,
    public dialog: MatDialog,
    private sharedService: SharedService,
    private exportService: SharedService,
    private router: Router,) {
  }
  dataSource = new MatTableDataSource<TableData>();
  selection = new SelectionModel<TableData>(true, []);
  ngOnInit() {
    // Called when the component is initialized. It triggers the initial fetch of reports.
    this.fetchReports();

  }
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }
  fetchReports() {
    // Fetches the extension reports based on the current report body configuration.
    this.ExtensionReports(this.extensionReportBody);
  }
  ExtensionReports(body: any) {
    // Calls the report API to fetch extension reports and handles the response.
    this.callReportApi.ExtensionReports(body).subscribe(
      (result: any) => {
        this.extensionList = result.extensions;
        this.data = result.extReports[1];
        this.dataSource.data = this.data;
        this.totalLength = result.extReports[2][0].TotalRecords;
      }, ((error) => {
        console.log(error);
        if (error.status === 403) {
          this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true });
        } else if (error.status === 401) {
          this.router.navigateByUrl('');
        }
        else if (error.status === 404) {
          this.noDataFound = true;
        }
      })
    )
  }
// Dowloading Excel or PDF
  isLoading = false;
  exportToFile(fileType: string) {
    this.isLoading = true; // Start loading
    this.extensionReportBody.pageNo = null;
     this.extensionReportBody.recordPage = null;
     this.callReportApi.ExtensionReports(this.extensionReportBody).subscribe(
      (result: any) => {
        this.data = result.extReports[1];
        this.exportdata = this.data.map(ext => ({
          'Extension Number': ext.extensionNumber,
          'Call Count': ext.callCount,
          'Incoming':ext.totalIncomingCalls,
          'Outgoing':ext.totalOutgoingCalls,
          'Total Duration': ext.totalDuration,
          'Avg Duration': ext.averageDuration,
          'Total Working Days': ext.totalDaysCallsMade,
          'Avg Calls per Day': this.trimValue(ext.avgCallsPerDay)

      }));
      this.exportService.generateFile(fileType, this.exportdata, 'Extension Report');
      this.isLoading = false; // Stop loading after success
      },
      (error) => {
              console.error('Error exporting file:', error);
              this.isLoading = false; // Stop loading after failure
            } )
  }
  //fetch report details by btn click
  btnClick() {
    this.extensionReportBody.dateType = this.selectedDateRange;
    if (this.selectedExtension != "All") {
      this.extensionReportBody.extension = this.selectedExtensionNumbers;
    }else{
      this.extensionReportBody.extension=null;
    }
    this.extensionReportBody.extension = 
    this.selectedExtensionNumbers.length === this.extensionList.length ? null : this.selectedExtensionNumbers.join(",");
    if (this.selectedDirection != "All") {
      this.extensionReportBody.direction = this.selectedDirection;
    }else{
      this.extensionReportBody.direction = 'All';
    }

    this.extensionReportBody.pageNo = this.pageNumber;
    this.extensionReportBody.recordPage = this.recordsPerPage;
    // Fetch reports with updated filters.
    this.fetchReports();
  }
  // sort based on extemsion
  sortExtension() {
    // Sorts the paged data based on the extension number in ascending or descending order.
    const data = [...this.pagedData]; // Create a new array reference
    if (this.sortDirection === 'asc') {
      this.pagedData = data.sort((a, b) => a.extensionNumber.localeCompare(b.extensionNumber));
      this.sortDirection = 'desc';
    } else {
      this.pagedData = data.sort((a, b) => b.extensionNumber.localeCompare(a.extensionNumber));
      this.sortDirection = 'asc';
    }
  }
  sortCount() {
    this.extensionReportBody.sortCol = 'callCount';
    if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
      this.extensionReportBody.sortOrder = 'asc';
      this.fetchReports();
    }
    else {
      this.sortDirection = 'asc';
      this.extensionReportBody.sortOrder = 'desc';
      this.fetchReports();
    }
  }
  sortDuration() {
    this.extensionReportBody.sortCol = 'totalDuration';
    if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
      this.extensionReportBody.sortOrder = 'asc';
      this.fetchReports();
    }
    else {
      this.sortDirection = 'asc';
      this.extensionReportBody.sortOrder = 'desc';
      this.fetchReports();
    }
  }
  avgDurationSort() {
    this.extensionReportBody.sortCol = 'averageDuration';
    if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
      this.extensionReportBody.sortOrder = 'asc';
      this.fetchReports();
    }
    else {
      this.sortDirection = 'asc';
      this.extensionReportBody.sortOrder = 'desc';
      this.fetchReports();
    }
  }
  avgWorkingDaysSort() {
    this.extensionReportBody.sortCol = 'avgCallsPerDay';
    if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
      this.extensionReportBody.sortOrder = 'asc';
      this.fetchReports();
    }
    else {
      this.sortDirection = 'asc';
      this.extensionReportBody.sortOrder = 'desc';
      this.fetchReports();
    }
  }
  totalWorkingDaysSort() {
    this.extensionReportBody.sortCol = 'totalDaysCallsMade';
    if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
      this.extensionReportBody.sortOrder = 'asc';
      this.fetchReports();
    }
    else {
      this.sortDirection = 'asc';
      this.extensionReportBody.sortOrder = 'desc';
      this.fetchReports();
    }
  }
  // sort based on Date
  setDateRange(range: string) {
    // Sets the selected date range for the report.
    this.selectedDateRange = range;
    this.selectedDate= range;
    this.customFromDate=null;
    this.customToDate=null
  }
  setExtension(extension: any): void {
    // Sets the selected extension filter for the report.
    this.selectedExtension = extension;
  }
  setDirection(direction: string) {
    // Sets the selected direction filter for the report.
    if (direction == 'Incoming') {
      this.selectedDirection = 'Incoming';
    }
    else if (direction == 'Outgoing') {
      this.selectedDirection = 'Outgoing';
    }
    else if(direction =='All'){
      this.selectedDirection = 'All';
    }
    else {
      this.selectedDirection = 'All';
    }
  
  }
  //Pagination
  getTotalPages() {
    return Math.ceil(this.totalLength / this.recordsPerPage);
  }
  getPagesArray() {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }
  onItemsPerPageChange(event: MatSelectChange) {
    this.recordsPerPage = event.value;
    this.extensionReportBody.recordPage = this.recordsPerPage
    this.extensionReportBody.pageNo = 1
    this.pageNumber = 1;
    this.updatePagedData()
    this.fetchReports();
    this.updateDisplayedRange();
  }
  nextPage() {
    if (this.pageNumber < this.getTotalPages()) {
      this.pageNumber++;
      this.extensionReportBody.recordPage = this.recordsPerPage;
      this.extensionReportBody.pageNo = this.pageNumber
      this.fetchReports();
      this.updateDisplayedRange();
    }
  }
  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.extensionReportBody.recordPage = this.recordsPerPage;
      this.extensionReportBody.pageNo = this.pageNumber;
      this.fetchReports();
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
    this.extensionReportBody.pageNo = this.pageNumber;
    this.updateDisplayedRange();
    this.fetchReports();
  }
  updatePagedData() {
    const startIndex = this.currentPage * this.recordsPerPage;
    const endIndex = startIndex + this.recordsPerPage;
    this.pagedData = this.pagedData.slice(startIndex, endIndex);
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
  updateSelectedExtensionNumbers() {
    // Updates the list of selected extension numbers based on user input.
    this.selectedExtensionNumbers = Object.keys(this.selectedExtensionNumbersMap).filter(key => this.selectedExtensionNumbersMap[key]);
    // Optionally, filter the data based on selected extension numbers.
    // this.filterExtensionData();
  }
  onExtensionChange(extension: string, isChecked: boolean): void {
    if (extension === 'All') {
      if (isChecked) {
        // Select all extension numbers
        this.selectedExtensionNumbers = this.extensionList.map((item: { extensionNumber: any; }) => item.extensionNumber);
        this.selectedExtension ='All'
      } else {
        // Deselect all extension numbers
        this.selectedExtensionNumbers = [];
      }
    } else {
      if (isChecked) {
        this.selectedExtensionNumbers.push(extension);
      } else {
        const index = this.selectedExtensionNumbers.indexOf(extension);
        if (index > -1) {
          this.selectedExtensionNumbers.splice(index, 1);
        }
      }
      // Update "All" checkbox based on individual selections
      if (this.selectedExtensionNumbers.length >1 && this.selectedExtensionNumbers.length != this.extensionList.length) {
        this.selectedExtension ='Multiple'
      } else if (this.selectedExtensionNumbers.length ==1) {
        this.selectedExtension =extension;
      }
      else{
        this.selectedExtension ='All'
      }
    }
  }
  openCustomDateDialog(selectedDate:any) {
    // Opens a dialog to allow the user to select a custom date range and fetches the corresponding reports.
     this.selectedDate = selectedDate;
    const currentDate = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(currentDate.getMonth() + 1);
    const startDate = this.formatDate(currentDate);
    const endDate = this.formatDate(oneMonthFromNow);
    // Use previously selected custom dates if available, else use default
    const fromDate = this.customFromDate ? this.formatDate(new Date(this.customFromDate)) : startDate;
    const toDate = this.customToDate ? this.formatDate(new Date(this.customToDate)) : endDate;
    const dialogRef = this.dialog.open(CustomDateComponent, {
      minWidth: '300px', height: '245px',
      data: {
        fromDate: fromDate,
        toDate: toDate
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // If the user confirms the custom date selection, update the report body and fetch the reports.
        this.customFromDate = result.fromDate;
        this.customToDate = result.toDate;
        this.extensionReportBody.customFromDate = this.customFromDate;
        this.extensionReportBody.customToDate = this.customToDate;
        const datePipe = new DatePipe('en-US'); // Create an instance of DatePipe
        const formattedFromDate = datePipe.transform(this.customFromDate, 'dd-MM-yyyy');
        const formattedToDate = datePipe.transform(this.customToDate, 'dd-MM-yyyy');
        this.selectedDateRange ="Custom";
        this.selectedDate = formattedFromDate+" to "+formattedToDate;
        this.fetchReports();
      }
    });
  }
  formatDate(date: Date | null): string {
    // Formats a date object into a string of format 'dd/MM/yyyy'.
    return date ? this.datePipe.transform(date, 'dd-MM-yyyy') || '' : '';
  }
  onSearchChange(event:Event){
    const input = (event.target as HTMLInputElement).value;
    if (input === "") {
       this.fetchReports();
    } else {
      this.searchText = input;
      this.filteredExtensionList = this.extensionList.filter((role:any) =>
      role.extensionNumber.includes(this.searchText)
    );
    this.extensionList = this.filteredExtensionList;
    }
  }
  trimValue(val: string): string {
    const numericValue = parseFloat(val); // Convert the string to a number
    if (isNaN(numericValue)) {
      return val; // Return the original value if it's not a valid number
    }
    return numericValue.toFixed(2); // Format to 2 decimal places
  }
  
}  
