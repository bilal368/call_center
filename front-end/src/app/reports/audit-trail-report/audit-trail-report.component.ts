import { Component, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckbox, MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CallReportService } from '../../core/services/callReport/call-report.service'
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog } from '@angular/material/dialog';
import { Sort, MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { concat } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { CustomDateComponent } from '../../shared/dialogComponents/custom-date/custom-date.component';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AlertDialogComponent } from '../../shared/dialogComponents/alert-dialog/alert-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as XLSX from 'xlsx';
import { SharedService } from '../../core/shared/share.service';
interface TableData {
  username: any;
  name: any;
  Description: any;
  Date: any;
  UserId: any;
  Module: any;
  Action: any;

}
@Component({
  selector: 'app-audit-trail-report',
  standalone: true,
  providers: [DatePipe],
  imports: [MatIconModule, MatMenuModule, HttpClientModule, MatToolbarModule, MatTableModule, MatCheckboxModule, FormsModule,
    MatInputModule, MatSelectModule, MatFormFieldModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, TranslateModule, CommonModule, MatTooltipModule],
  templateUrl: './audit-trail-report.component.html',
  styleUrl: './audit-trail-report.component.css'
})
export class AuditTrailReportComponent {
  toolTips: any = {
    XLS: 'Menu.CONFIGURE.EMPLOYEE MANAGER.XLS',
    TIFF: 'Menu.CONFIGURE.EMPLOYEE MANAGER.TIFF',
    View: 'Menu.CONFIGURE.EMPLOYEE MANAGER.View',
    "apply": 'Menu.Apply Changes',
    "download": 'Menu.Download Reports',
  }


  @ViewChild(MatSort) sort!: MatSort;
  selectedDateRange: string = 'Today';
  selectedDate: string = 'Today';
  selectedModule: string[] = [];
  selectedAction: any ;
  selectedUserID: string[] = [];
  selectedUserAction: string[] = [];
  moduleList: any = [];
  moduleName:any;
  actionList: any = [];
  userList: any = [];
  selectedUser: string[] = [];
  selectedUserName:any;
  customFromDate: Date | null = null;
  customToDate: Date | null = null;
  displayedRange: string = '';
  pagedData: TableData[] = [];
  totalLength = 0;
  pageNumber: number = 1;
  recordsPerPage = 10;
  pageSize = 10;
  displayedColumns: string[] = ['UserId', 'Module', 'Description', 'Date', 'Action'];
  data: TableData[] = [];
  selection = new SelectionModel<TableData>(true, []);
  exportdata: any;
  searchText:any='';
  noDataFound: boolean = false;
  currentPage: number = 0;
  dataSource = new MatTableDataSource<TableData>();
  
  auditReportBody: any = {
    dateType: 'Today',
    customFromDate: null,
    customToDate: null,
    module: null,
    action: null,
    userID: null,
    pageNo: this.pageNumber,
    recordPage: this.recordsPerPage,
    sortCol: null,
    sortOrder: null
  }
  filteredModuleList: any[] = this.moduleList;
  filteredActionList: any[] = this.actionList;
  filteredUserList: any[] = this.userList;

  data1: TableData[] = [];
  constructor(private datePipe: DatePipe,
    private reportApi: CallReportService,
    public dialog: MatDialog,
    private router: Router,
    private sharedService: SharedService,
    private exportService: SharedService,
  ) {

  }
  ngOnInit() {
    // Called when the component is initialized. It triggers the initial fetch of reports.
    this.fetchReports();
  }
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }
  fetchReports() {
    // Fetches the audittrail reports based on the current report body configuration.
    this.AuditTrailReports(this.auditReportBody);
  }
   onModuleChange(modules: string, isChecked: boolean): void {
    if(modules === 'All'){
      if (isChecked) {
        // Select all extension numbers
        this.selectedModule = this.moduleList.map((item: { moduleName: any; }) => item.moduleName);
        this.auditReportBody.module=null;
        this.moduleName='All'
      } else {
        // Deselect all extension numbers
        this.selectedModule = [];
        this.auditReportBody.module=null;
      }
    }
    else{
      if (isChecked) {
        this.selectedModule.push(modules);
      } else {
        const index = this.selectedModule.indexOf(modules);
        if (index > -1) {
          this.selectedModule.splice(index, 1);
        }
      }
    }
    if(this.selectedModule.length >1 && this.selectedModule.length != this.moduleList.length){
      this.moduleName = 'Multiple';
     }
     else if(this.selectedModule.length ==1){
      const module = this.moduleList.find((item: { moduleName: string; }) => item.moduleName === this.selectedModule[0]);
      this.moduleName = module.moduleName;

     }else{
      this.moduleName = 'All';
     }
        this.auditReportBody.module = this.selectedModule.length === this.moduleList.length ? null : this.selectedModule;
      }
    onUserNameChange(user:string,name:string,isChecked:boolean){      
       if(user==='All'){
        if (isChecked) {
          //Select all extension numbers
            this.selectedUser = this.userList.map((item: { userId: any; }) => item.userId);
            this.selectedUserName = 'All';
          } else {
          //Deselect all extension numbers
          this.selectedUser = [];
          this.auditReportBody.selectedUser = null;
        }
       }else{
        if (isChecked) {
          this.selectedUser.push(user);
        } else {
          const index = this.selectedUser.indexOf(user);
          if (index > -1) {
            this.selectedUser.splice(index, 1);
          }
        }
      }


           if(this.selectedUser.length >1 && this.selectedUser.length != this.userList.length){
            this.selectedUserName = 'Multiple';
           }else if(this.selectedUser.length ==1){
            const user = this.userList.find((item: { userId: string; }) => item.userId === this.selectedUser[0]);
            this.selectedUserName = user.username;
           }else{
            this.selectedUserName = 'All';
           }
          this.auditReportBody.userID =  this.selectedUser.length === this.userList.length ? null : this.selectedUser;
        }
    onActionChange(action: string,name:string, isChecked: boolean) {
      if (action === 'All') {
        if (isChecked) {
          // Select all extension numbers visually
          this.selectedUserAction = this.actionList.map((item: { moduleActionId: any }) => item.moduleActionId);
          this.auditReportBody.action = null;
          this.selectedAction = 'All';
          // Set the backend field to an empty string
        
        } else {
          // Deselect all extension numbers
          this.selectedUserAction = [];
          this.auditReportBody.action = null;
        }
      } else {
        if (isChecked) {
          this.selectedUserAction.push(action);
        } else {
          const index = this.selectedUserAction.indexOf(action);
          if (index > -1) {
            this.selectedUserAction.splice(index, 1);
          }
        }
    
      }
      if(this.selectedUserAction.length >1 && this.selectedUserAction.length != this.actionList.length){
        this.selectedAction = 'Multiple';
       }
       else if(this.selectedUserAction.length ==1){
        const action = this.actionList.find((item: { moduleActionId: string; }) => item.moduleActionId === this.selectedUserAction[0]);
         this.selectedAction = action.actionName;
       }else{
        this.selectedAction = 'All';
       }
      
         // Send the selectedUserAction to the backend unless "All" is selected
         this.auditReportBody.action = this.selectedUserAction.length === this.actionList.length ? null : this.selectedUserAction;
    }
    btnClick() {
      this.auditReportBody.dateType = this.selectedDateRange;
  
      // Set action to null if selectedUserAction is empty or matches all
      this.auditReportBody.action = 
        this.selectedUserAction.length === this.actionList.length || this.selectedUserAction.length === 0 
          ? null 
          : this.selectedUserAction.join(",");
    
      // Set module to null if selectedModule is empty or matches all
      this.auditReportBody.module = 
        this.selectedModule.length === this.moduleList.length || this.selectedModule.length === 0 
          ? null 
          : this.selectedModule.join(",");
    
      // Set userID to null if selectedUser is empty or matches all
      this.auditReportBody.userID = 
        this.selectedUser.length === this.userList.length || this.selectedUser.length === 0 
          ? null 
          : this.selectedUser.join(",");
    

      this.pageNumber =1;
      this.recordsPerPage=10
      this.auditReportBody.pageNo = this.pageNumber;
      this.auditReportBody.recordPage = this.recordsPerPage;
      this.fetchReports();
    }
  
  AuditTrailReports(body: any) { // Calls the report API to fetch AuditTrail reports and handles the response.
    console.log("result:",body);
    this.reportApi.AuditTrailReports(body).subscribe(
      (result: any) => {
       
        this.moduleList = result.module;
        this.userList = result.Users;
        this.actionList = result.Actions;
        this.data = result.report[0];
        this.dataSource.data  = this.data;
        this.totalLength = result.report[1][0].TotalRecords;

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
  //open dialog for edit employee data
  viewDetails(oldValue: any, newValue: any) {
    this.dialog.open(AlertDialogComponent, {
      data: {
        userData: { oldValue, newValue },
        clickedStatus: 'View'
      },
      height: '80vh',
      width: '90vw'
    }).afterClosed().subscribe((res: any) => {

    })
  }
  setUser(user: any) {
    this.selectedUserID = user;
  }
  setAction(action: any) {
    this.selectedAction = action;
  }

// Dowloading Excel or PDF
  isLoading = false;
  exportToFile(fileType: string) {
    this.isLoading = true; // Start loading
    const selectedCalls = this.data;
    // if (selectedCalls.length === 0) {
      this.auditReportBody.pageNo = null;
      this.auditReportBody.recordPage = null;
      this.fetchReports();
      this.reportApi.AuditTrailReports(this.auditReportBody).subscribe(
        (result: any) => {
          this.data1 = result.report[0];
       
          this.exportdata = this.data1.map(ext => ({
            'User Name': ext.username,
            'Module Name': ext.Module,
            'Description': this.capitalizeFirstLetter(ext.Description),
            'Action': ext.Action,
            'Date': this.datePipe.transform( ext.Date, 'dd-MM-yyyy HH:mm:ss a') || ''
  
          }));
          this.exportService.generateFile(fileType, this.exportdata, 'Audit Trail Report');
          this.isLoading = false; // Stop loading after success
          this.auditReportBody.pageNo = this.pageNumber;
          this.auditReportBody.recordPage =this.recordsPerPage;
          this.fetchReports();
        },
        (error) => {
          console.error('Error exporting file:', error);
          this.isLoading = false; // Stop loading after failure
        })

  }

  // sort based on Date
  setDateRange(range: string) {
    // Sets the selected date range for the report.
    this.selectedDate = range;
    this.selectedDateRange = range;
   this.customFromDate=null;
   this.customToDate=null
  }
  openCustomDateDialog(selectedDate:any) {
    this.selectedDate = selectedDate;
    // Opens a dialog to allow the user to select a custom date range and fetches the corresponding reports.
    const currentDate = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(currentDate.getMonth() + 1);
    const startDate = this.formatDate(currentDate);
    const endDate = this.formatDate(oneMonthFromNow);
    // Use previously selected custom dates if available, else use default
    const fromDate = this.customFromDate ? this.formatDate(new Date(this.customFromDate)) : startDate;
    const toDate = this.customToDate ? this.formatDate(new Date(this.customToDate)) : endDate;
    const dialogRef = this.dialog.open(CustomDateComponent, {
      minWidth: '30vw', height: '35vh',
      data: {
        fromDate: fromDate,
        toDate:toDate
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // If the user confirms the custom date selection, update the report body and fetch the reports.
        this.customFromDate = result.fromDate;
        this.customToDate = result.toDate;
        this.auditReportBody.customFromDate = this.customFromDate;
        this.auditReportBody.customToDate = this.customToDate;
        const datePipe = new DatePipe('en-US'); // Create an instance of DatePipe
        const formattedFromDate = datePipe.transform(this.customFromDate, 'dd-MM-yyyy');
        const formattedToDate = datePipe.transform(this.customToDate, 'dd-MM-yyyy');
        this.selectedDateRange ="Custom";
        this.selectedDate = formattedFromDate + " to " + formattedToDate;
        this.fetchReports();
      }
    });
  }





  
  formatDate(date: Date | null): string {
    // Formats a date object into a string of format 'dd/MM/yyyy'.

    return date ? this.datePipe.transform(date, 'dd-MM-yyyy') || '' : '';
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
    this.auditReportBody.recordPage = this.recordsPerPage
    this.auditReportBody.pageNo = 1
    this.pageNumber = 1;
    this.updatePagedData()
    this.fetchReports();
    this.updateDisplayedRange();
  }
  nextPage() {
    if (this.pageNumber < this.getTotalPages()) {
      this.pageNumber++;
      this.auditReportBody.recordPage = this.recordsPerPage;
      this.auditReportBody.pageNo = this.pageNumber;
      this.fetchReports();
      this.updateDisplayedRange();
    }
  }
  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.auditReportBody.recordPage = this.recordsPerPage;
      this.auditReportBody.pageNo = this.pageNumber;
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
    this.auditReportBody.pageNo = this.pageNumber;
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

  onSearchChange(event: Event,formName:string) {
    const input = (event.target as HTMLInputElement).value.toLowerCase();
    if (input === "") {
       this.fetchReports();
    } else {
      this.searchText = input;
        if(formName=="Action"){
          this.filteredActionList = this.actionList.filter((role:any) =>
          role.actionName.toLowerCase().includes(this.searchText)
        );
        this.actionList = this.filteredActionList;
        }
        if(formName=="Module"){
          this.filteredModuleList = this.moduleList.filter((role:any) =>
          role.moduleName.toLowerCase().includes(this.searchText)
        );
        this.moduleList = this.filteredModuleList;
        }
        if(formName=="User"){
          this.filteredUserList = this.userList.filter((role:any) =>
          role.firstname.toLowerCase().includes(this.searchText)
        );
        this.userList = this.filteredUserList;
        }
 
    }

   }

   capitalizeFirstLetter(description: string): string {
    if (!description) {
      return '';
    }
    return description.charAt(0).toUpperCase() + description.slice(1);
  }
  trimTheValue(value: string, maxLength: number = 10): string {
    if (!value) {
      return '';
    }
  
    return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
  }
  
}


