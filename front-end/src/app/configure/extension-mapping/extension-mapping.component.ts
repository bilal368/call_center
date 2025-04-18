import { CSP_NONCE, Component, ElementRef, HostListener } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UserService } from '../../core/services/user/user.service';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { SelectionModel } from '@angular/cdk/collections';
import * as XLSX from 'xlsx';
import { AlertDialogComponent } from '../../shared/dialogComponents/alert-dialog/alert-dialog.component';
import { PageEvent } from '@angular/material/paginator';
import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectChange } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExtMappingPopupComponent } from '../../shared/dialogComponents/ext-mapping-popup/ext-mapping-popup.component';
import { SharedService } from '../../core/shared/share.service';
import { ConfirmationDialogComponent } from '../../shared/dialogComponents/confirmation-dialog/confirmation-dialog.component';
import { MatButtonModule } from '@angular/material/button';

interface TableData {
  employeeName: any;
  employeeID: any;
  firstname: any;
  userId: any;
  divisionName: any;
  departmentName: any;
  locationName: any;
  extensionId: any;
  extension: any;
  location: any;
  department: any;
  division: string;
  dialed: string;
  extensionLabel: string;
  agent: string;
  extensionNumber: any;
}
@Component({
  selector: 'app-extension-mapping',
  standalone: true,
  imports: [MatMenuModule, MatSelectModule, MatSelect, CommonModule, MatTooltipModule, MatToolbarModule,
    MatIconModule, MatTableModule, MatCheckboxModule, TranslateModule, FormsModule, MatButtonModule],
  templateUrl: './extension-mapping.component.html',
  styleUrl: './extension-mapping.component.css'
})
export class ExtensionMappingComponents {
  noDataFound: boolean | undefined;
  filteredExtensions: any[] = [];
  selectedExtensions: string[] = [];
  selectedExt: string = "";
  selectedAgents: string[] = [];
  selectedUser: string = "";
  NameString: string = "";
  selectedStatus: String = "";
  selectedStatusValue: string = "";
  searchText: string = '';
  extensionList: any = [];
  agentList: any = [];
  data: TableData[] = [];
  data1: TableData[] = [];
  exportdata: any;
  sortDirection: 'asc' | 'desc' = 'asc';
  filteredExtList: any[] = [];
  filteredUserList: any[] = this.agentList;
  pageSize = 5;
  pagedData: TableData[] = [];
  recordsPerPage: number = 10;
  currentPage: number = 0;
  pageNumber: number = 1;
  totalLength = 0;
  selection = new SelectionModel<TableData>(true, []);


  Body: any = {
    pageNumber: this.pageNumber,
    recordsPerPage: this.recordsPerPage,
    selExtensions: null,
    setAgents: null,
    status: 1,
    sortCol: null,
    sortOrder: null
  }
  displayedColumns: string[] = ['select', 'Extension', 'Location', 'Department', 'Division', 'EmployeeID', 'EmployeeName', 'Action'];
  TotalRecords: number = 0;
  searchQuery: any = "";
  extensionSearchQuery: any = "";
  constructor(private dialog: MatDialog, private userApi: UserService, private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private exportService: SharedService, private el: ElementRef
  ) {
  }



  ngOnInit() {
    this.selectedStatus = '1';
    this.selectedStatusValue = 'Mapped';
    this.getExtensionMappingData();
  }
  getExtensionMappingData() {
    this.userApi.getExtensionMapping(this.Body).subscribe(
      (result: any) => {
        this.data = result.response[0];
        // Remove null or undefined data from employees and extensions
        this.agentList = result.employees.filter((employee: any) => employee.firstname !== null && employee.firstname !== undefined);
        this.extensionList = result.extensions.filter((extension: any) => extension.extensionNumber !== null && extension.extensionNumber !== null !== undefined);
        this.TotalRecords = result.response[1][0].TotalRecords;
        this.totalLength = result.response[1][0].TotalRecords;
        this.filteredExtList = [...this.extensionList];

      }, ((error) => {
        console.log(error);
        if (error.status === 403) {
          this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' }, disableClose: true })
        }
        else if (error.status === 404) {
          this.noDataFound = true;
        }

      })
    )
  }

  // onSearchExtensionChange(): void {
  isDropdownOpen = false;
  isAgentDropdownOpen = false;
  toggleDropdown(event: Event): void {
    event.stopPropagation(); // Prevent HostListener from triggering
    this.isDropdownOpen = !this.isDropdownOpen;
    this.isAgentDropdownOpen = false; // Close other dropdown
  }

  toggleAgentDropdown(event: Event): void {
    event.stopPropagation(); // Prevent HostListener from triggering
    this.isAgentDropdownOpen = !this.isAgentDropdownOpen;
    this.isDropdownOpen = false; // Close other dropdown
  }

  // Close both dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  closeDropdowns(event: Event): void {
    if (!this.el.nativeElement.querySelector('.extension-dropdown')?.contains(event.target)) {
      this.isDropdownOpen = false;
    }
    if (!this.el.nativeElement.querySelector('.agent-dropdown')?.contains(event.target)) {
      this.isAgentDropdownOpen = false;
    }
  }
  onSearchExtensionChange(): void {
    const query = this.extensionSearchQuery?.trim();
    if (query && /^\d+$/.test(query)) {
      this.filteredExtList = this.extensionList.filter((item: { extensionNumber: string }) =>
        item.extensionNumber.toLowerCase().includes(query.toLowerCase())
      );
    } else {
      this.filteredExtList = [...this.extensionList];
    }
  }



  onSearchAgnetChange(event: Event) {
    const input = (event.target as HTMLInputElement).value.toLowerCase();
    if (input === "") {
      this.getExtensionMappingData(); // Reset to original data
    } else {
      this.searchText = input;

      this.filteredUserList = this.agentList.filter((role: any) =>
        role.firstname?.toLowerCase().includes(this.searchText) // Use optional chaining
      );
    }

    // Ensure the displayed list is updated
    this.agentList = this.filteredUserList;
  }


  onExtensionChange(extension: string, isChecked: boolean): void {
    if (extension === 'All') {
      if (isChecked) {
        this.selectedExtensions = this.extensionList.map((item: { extensionId: any }) => item.extensionId);
        this.selectedExt = 'All';
        this.Body.selExtensions = null;
      } else {
        this.selectedExtensions = [];
        this.Body.selExtensions = null; // Set to null instead of an empty array
      }
    } 
    else {
      if (isChecked) {
        this.selectedExtensions.push(extension);
      } else {
        const index = this.selectedExtensions.indexOf(extension);
        if (index > -1) {
          this.selectedExtensions.splice(index, 1);
        }
      } 
      // ✅ Ensure that `this.Body.selExtensions` is `null` if there are no selected extensions
      this.Body.selExtensions = this.selectedExtensions.length > 0 ? this.selectedExtensions.join(",") : null;
    }
    // ✅ Handle the display of selected extensions
    if (this.selectedExtensions.length === this.extensionList.length) {
      this.selectedExt = "All";
    } else if (this.selectedExtensions.length === 1) {
      // Use type conversion for comparison
      const ext = this.extensionList.find(
        (item: { extensionId: string | number }) =>
          String(item.extensionId) === String(this.selectedExtensions[0])
      );
      this.selectedExt = ext ? ext.extensionNumber : "Unknown";
    } else {
      this.selectedExt = "Multiple";
    }
  }
  

 
  onAgentsChange(agents: string, isChecked: boolean): void {
    if (agents === 'All') {
      if (isChecked) {
        // Select all agents
        this.selectedAgents = this.agentList.map((item: { employeeID: any }) => item.employeeID);
        this.selectedUser = 'All';
        this.Body.setAgents = null;
      } else {
        // Deselect all agents
        this.selectedAgents = [];
        this.Body.setAgents = null; // Set to null instead of an empty array
      }
    } else {
      if (isChecked) {
        this.selectedAgents.push(agents);
      } else {
        const index = this.selectedAgents.indexOf(agents);
        if (index > -1) {
          this.selectedAgents.splice(index, 1);
        }
      }
  
      // ✅ Ensure that `this.Body.setAgents` is `null` if there are no selected agents
      this.Body.setAgents = this.selectedAgents.length > 0 ? this.selectedAgents.join(",") : null;
    }
    // ✅ Handle the display of selected agents    
    if (this.selectedAgents.length === this.agentList.length) {
      this.selectedUser = "All";
    } else if (this.selectedAgents.length === 1) {
      const user = this.agentList.find((item: { employeeID: string; }) => item.employeeID === this.selectedAgents[0]);
      this.selectedUser = user?.firstname.length > 6
        ? user.firstname.substring(0, 3) + "..."
        : user.firstname; // Show first 6 characters with "..." if lengthy
      this.NameString = user.firstname + user.lastname;
    } else {
      this.selectedUser = "Multiple";
    }
  }
  

  sortExtension() {
    // Sorts the paged data based on the extension number in ascending or descending order.
    this.Body.sortCol = 'extensionNumber';
    if (this.sortDirection === 'asc') {
      this.Body.sortOrder = 'asc';
      this.sortDirection = 'desc';
    } else {
      this.Body.sortOrder = 'desc';
      this.sortDirection = 'asc';
    }
    this.getExtensionMappingData();
  }
  sortLocation() {
    this.Body.sortCol = 'locationName';
    if (this.sortDirection === 'asc') {
      this.Body.sortOrder = 'asc';
      this.sortDirection = 'desc';
    } else {
      this.Body.sortOrder = 'desc';
      this.sortDirection = 'asc';
    }
    this.getExtensionMappingData();
  }
  sortDepartment() {
    this.Body.sortCol = 'departmentName';
    if (this.sortDirection === 'asc') {
      this.Body.sortOrder = 'asc';
      this.sortDirection = 'desc';
    } else {
      this.Body.sortOrder = 'desc';
      this.sortDirection = 'asc';
    }
    this.getExtensionMappingData();
  }
  sortDivision() {
    this.Body.sortCol = 'divisionName';
    if (this.sortDirection === 'asc') {
      this.Body.sortOrder = 'asc';
      this.sortDirection = 'desc';
    } else {
      this.Body.sortOrder = 'desc';
      this.sortDirection = 'asc';
    }
    this.getExtensionMappingData();
  }

  sortEmployeeID() {
    this.Body.sortCol = 'employeeID';
    if (this.sortDirection === 'asc') {
      this.Body.sortOrder = 'asc';
      this.sortDirection = 'desc';
    } else {
      this.Body.sortOrder = 'desc';
      this.sortDirection = 'asc';
    }
    this.getExtensionMappingData();
  }
  sortEmployee() {
    this.Body.sortCol = 'employeeName';
    if (this.sortDirection === 'asc') {
      this.Body.sortOrder = 'asc';
      this.sortDirection = 'desc';
    } else {
      this.Body.sortOrder = 'desc';
      this.sortDirection = 'asc';
    }
    this.getExtensionMappingData();
  }
  //add
  addExtMapping() {
    this.dialog.open(ExtMappingPopupComponent, {
      data: {
        userData: '',
        clickedStatus: 'add'
      },
      height: '72vh',
      width: '72vw',
      panelClass: 'custom-dialog' // Add custom class here

    }).afterClosed().subscribe((res: any) => {
      this.getExtensionMappingData();
    })
  }
  mapping() {
    const selectedIds = this.selection.selected.map(row => row);
    const extensionIds = selectedIds.map(item => item.extensionId);
    const employeeId = selectedIds.map(item => item.employeeID);
    if (extensionIds.length === 0) {
      this.snackBar.open(`Select atleast one extension to set the hierarchy`, 'Close', {
        duration: 3000,
        verticalPosition: 'top'
      });
      return;
    }
    this.dialog.open(ExtMappingPopupComponent, {
      data: {
        userData: extensionIds,
        clickedStatus: 'Map'
      },
      height: '70vh',
      width: '45vw',
      panelClass: 'custom-dialog' // Add custom class here

    }).afterClosed().subscribe((res: any) => {
      this.selection.clear();
      this.getExtensionMappingData();
    })
  }
  // Function for location edit checkbox 
  edit(editData: any) {
    this.dialog.open(ExtMappingPopupComponent, {
      data: {
        userData: editData,
        clickedStatus: 'edit'
      },
      height: '73vh',
      width: '72vw',
      panelClass: 'custom-dialog' // Add custom class here
    }).afterClosed().subscribe((res: any) => {
      this.getExtensionMappingData();
    })
  }
  //Delete the Selected Extensiom
  DeleteExt() {
    const selectedIds = this.selection.selected.map(row => row);
    const extensionIds = selectedIds.map(item => item.extensionId);
    const body = { extensionIds: extensionIds }
    // Validate if extensionIds is empty
    if (extensionIds.length === 0) {

      this.snackBar.open(`Select the extension mapping `, 'Close', {
        duration: 3000,
        verticalPosition: 'top'
      });
      return;
    }
    const message = 'Are you sure you want to remove the selected extension mapping?'
    this.dialog.open(ConfirmationDialogComponent, {
      data: { clickedStatus: "deleteConfirmation", message },
    }).afterClosed().subscribe((value: any) => {

      if (value == true) {
        this.userApi.deleteExtension(body).subscribe((result: any) => {
          if (result.status) {
            // Filter out the deleted rows from your table's data source
            this.data = this.data.filter((row: any) => !extensionIds.includes(row.extensionId));
            // Optionally, clear the selection
            this.selection.clear();
            this.snackBar.open(`Extension mapping deleted successfully`, 'Close', {
              duration: 3000,
              verticalPosition: 'top'
            });
          }
        });
      }
    })
  }
  //Apply button
  btnClick() {

    this.getExtensionMappingData();
  }

  //all extension Check box Selection
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.data ? this.data.length : 0;
    return numSelected === numRows && numRows !== 0;
  }
  //Any extension selected
  isAnySelected() {
    return this.selection.selected.length > 0;
  }
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.data.forEach(row => this.selection.select(row));

  }
  setStatus(status: string) {
    if (status == 'Mapping') {
      this.selectedStatus = '1';
      this.selectedStatusValue = 'Mapped';
    } else {
      this.selectedStatus = '2';
      this.selectedStatusValue = 'Unmapped';
    }
    this.Body.status = this.selectedStatus;
  }
  //dialogue box for insert users deails
  openDialog(): void {
    const dialogRef = this.dialog.open(AlertDialogComponent, {
      disableClose: true,
      data: {
        userData: {},
        clickedStatus: 'extensionUpload'
      },
      height: '215px',
      width: '390px'
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getExtensionMappingData();
    });
  }
  //Dowloading into records in to Excel 
  downloadRecordings() {
    let extensionMapping = this.data.map(ext => ({
      'Extension': ext.extensionNumber,
      'Location': ext.locationName,
      'Department': ext.departmentName,
      'Division': ext.divisionName,
      'EmployeeID': ext.userId,
      'Employee name': ext.firstname
    }));
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(extensionMapping);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Extension Mapping');
    XLSX.writeFile(wb, 'Extension Mapping.xlsx');
  }
  // Dowloading Excel or PDF
  isLoading = false;
  exportToFile(fileType: string) {
    this.isLoading = true; // Start loading   
    this.Body.pageNumber = null;
    this.Body.recordsPerPage = null;
    this.userApi.getExtensionMapping(this.Body).subscribe(
      (result: any) => {
        this.data1 = result.response[0];
        this.exportdata = this.data1.map(ext => ({
          'Extension': ext.extensionNumber,
          'Location': ext.locationName,
          'Department': ext.departmentName,
          'Division': ext.divisionName,
          'EmployeeID': ext.employeeID,
          'Employee name': ext.employeeName
        }));
        this.exportService.generateFile(fileType, this.exportdata, 'Extension Mapping Report');
        this.isLoading = false; // Stop loading after success
      },
      (error) => {
        console.error('Error exporting file:', error);
        this.isLoading = false; // Stop loading after failure
      })
    
  }
  // sort based on extemsion
  //Pagination
  getTotalPages() {
    return Math.ceil(this.totalLength / this.recordsPerPage);
  }
  getPagesArray() {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }
  onItemsPerPageChange(event: MatSelectChange) {
    this.recordsPerPage = event.value;  // `event.value` will directly give you the selected value
    this.pageNumber = 1;
    this.updatePagedData();
    this.Body.recordsPerPage = this.recordsPerPage
    this.getExtensionMappingData();
  }
  nextPage() {
    if (this.pageNumber < this.getTotalPages()) {
      this.pageNumber++;
      this.Body.pageNumber = this.pageNumber;
      this.getExtensionMappingData();
    }
  }
  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.Body.pageNumber = this.pageNumber;
      this.getExtensionMappingData();
    }
  }
  goToPage(event: MatSelectChange) {
    const selectElement = event.value; // event.value directly provides the selected page number
    if (this.pageNumber < 1 || this.pageNumber > this.getTotalPages()) {
      return;
    }
    this.pageNumber = parseInt(selectElement.value, 10);
    this.getExtensionMappingData();;
  }
  updatePagedData() {
    const startIndex = this.currentPage * this.recordsPerPage;
    const endIndex = startIndex + this.recordsPerPage;
    this.data = this.data.slice(startIndex, endIndex);
    // this.pageNumber = this.currentPage + 1;
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
