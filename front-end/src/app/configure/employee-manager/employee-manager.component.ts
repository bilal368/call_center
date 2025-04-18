import { Component, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule, } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ViewEditEmpDetailsComponent } from '../../shared/dialogComponents/view-edit-emp-details/view-edit-emp-details.component';
import { UserService } from '../../core/services/user/user.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AlertDialogComponent } from '../../shared/dialogComponents/alert-dialog/alert-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';
import { SharedService } from '../../core/shared/share.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/authentication/auth.service';
import {MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule} from '@angular/material/tree';
 import { FilterEmployeemanagerComponent } from "../../filter-employeemanager/filter-employeemanager.component";
import { MatTooltipModule } from '@angular/material/tooltip';
import { saveAs } from 'file-saver';
import { ConfirmationDialogComponent } from '../../shared/dialogComponents/confirmation-dialog/confirmation-dialog.component';
import { SelectionModel } from '@angular/cdk/collections';
import { HttpClient } from '@angular/common/http';
import { PopUpComponent } from '../../shared/dialogComponents/pop-up/pop-up.component';
import { ExtMappingPopupComponent } from '../../shared/dialogComponents/ext-mapping-popup/ext-mapping-popup.component';
import { EmployeePopupComponent } from '../../shared/dialogComponents/employee-popup/employee-popup.component';


 

export interface employeeManagement {
  agentCode: any;
  departmentId: string;
  locationId: string;
  divisionId: string;
  employeeID: number;
  designation: string;
  extension: string;
  phone: number;
  lastname: string;
  middlename: string;
  roleId: number;
  userId: number;
  username: string;
  primaryEmail: string;
  firstname:string
}
let ELEMENT_DATA: employeeManagement[] = [
];
/**
 * @title Table with sorting
 */
interface Location {
  locationId: number;
  locationName: string;
  LDAPPropertyValue: string | null;
  locationAddress1: string | null;
  locationAddress2: string | null;
  countryId: number | null;
  stateId: number | null;
  cityId: number | null;
  createdDate: string;
  modifiedDate: string;
  active: number;
}

@Component({
  selector: 'app-employee-manager',
  standalone: true,
  imports: [MatIconModule, MatTreeModule, MatButtonModule, MatIconModule, MatToolbarModule, MatSidenavModule,
    MatMenuModule, MatCheckboxModule, MatExpansionModule, MatFormFieldModule,MatTooltipModule, CommonModule, MatTableModule, MatSortModule, MatButtonModule, MatSelectModule, MatPaginatorModule, MatProgressSpinnerModule, FormsModule, ReactiveFormsModule,
    TranslateModule],
  templateUrl: './employee-manager.component.html',
  styleUrl: './employee-manager.component.css'
})

export class EmployeeManagerComponent implements OnInit {
  buildDiv: string = 'hierarchy';
  displayedColumns: string[] = ['username', 'primaryEmail','employeeID'];
  dataSource = new MatTableDataSource(ELEMENT_DATA);
  dataStatus: boolean = false;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('checkboxElem') checkboxElem: any
  @ViewChild('status') status: any
  name: string = '';
  clickedStatus: any;
  element: any;
  addEmployees: any;
  userId!: number;
  allGroupsChecked: boolean = false;
  availableGroup: any = [];
  items: any = [];
  items1: any[] = [];
  departmentItems: any[] = [];
  divisionItems: any[] = [];
  location: any;
  addClick: boolean = false;
  addDepartmentClick: boolean = false;
  addDivisionClick: boolean = false;
  editClicked: boolean = false;
  myGroup: FormGroup | undefined;
  locationName: string = '';
  departmentName: string = '';
  divisionName: string = '';
  editLocationId: any;
  editingLocation: boolean = false;
  editingdivision: boolean = false;
  editedLocationName: string = '';
  selectedLocations: Set<number> = new Set();
  selectedDepartments: Set<{ departmentName: string, locationId: number, departmentId: number }> = new Set();
  selectedDivisions: Set<{ divisionName: string, departmentId: number, divisionId: number }> = new Set();
  selectedLocation: any;
  selectedLocationIds: number[] = [];
  editingdepartment: any;
  editedDivisionName: string = '';
  selectedDivision: any | null = null;
  selected: any = 'All'
  locationId: any = null; 
  departmentId: any = null;
  employeeDetails: any = []
  searchfilter: any
  excelService: any;
  keyMapping: any;
  departmentItem: any;
  divisionItem: any;
  //Pagination fields
  TotalRecords: number = 0;  
  recordsPerPage: number = 10;
  pagedData:  employeeManagement[] = [];
  pageNumber: number = 1;
  displayedRange: string = '';
  currentPage: number = 0;
  pageSize = 2;
  searchQuery: string = '';
  users: any;
  availableGroupNameUsers: any;
  offset: any;
  selection = new SelectionModel<employeeManagement>(true, []);
  data: any;
  exportdata: any;
  isLdapLocation: boolean = false;
LDAPPropertyValue: any;
employeeTab:boolean=false;

  constructor(private _liveAnnouncer: LiveAnnouncer,
    public dialog: MatDialog,
    private userApi: UserService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private SharedService: SharedService,
    private authService: AuthService,
    private translate:TranslateService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) { }
  toolTips:any={
    XLS:'Menu.CONFIGURE.EMPLOYEE MANAGER.XLS',
    TIFF:'Menu.CONFIGURE.EMPLOYEE MANAGER.TIFF',
    View:'Menu.CONFIGURE.EMPLOYEE MANAGER.View',
    Action:'Menu.CONFIGURE.EMPLOYEE MANAGER.Action',
    Addlocation:'Menu.CONFIGURE.EMPLOYEE MANAGER.Addlocation',
    Editlocation:'Menu.CONFIGURE.EMPLOYEE MANAGER.Editlocation',
    Savelocation:'Menu.CONFIGURE.EMPLOYEE MANAGER.Savelocation',
    Add:'Menu.CONFIGURE.EMPLOYEE MANAGER.Add',
    UploadFile:'Menu.CONFIGURE.EMPLOYEE MANAGER.UploadFile',
    Delete:'Menu.CONFIGURE.EMPLOYEE MANAGER.Delete',
    DeleteLocation:'Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteLocation',
    DeleteDepartment:'Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteDepartment',
    DeleteDivision:'Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteDivision',
    Edit:'Menu.CONFIGURE.EMPLOYEE MANAGER.Edit',
    Previous:'Menu.CONFIGURE.EMPLOYEE MANAGER.Previous',
    Next:'Menu.CONFIGURE.EMPLOYEE MANAGER.Next',
    AddDepartment:'Menu.CONFIGURE.EMPLOYEE MANAGER.AddDepartment',
    EditDepartment:'Menu.CONFIGURE.EMPLOYEE MANAGER.EditDepartment',
    SaveDepartment:'Menu.CONFIGURE.EMPLOYEE MANAGER.SaveDepartment',
    AddDivision:'Menu.CONFIGURE.EMPLOYEE MANAGER.AddDivision',
    EditDivision:'Menu.CONFIGURE.EMPLOYEE MANAGER.EditDivision',
    SaveDivision:'Menu.CONFIGURE.EMPLOYEE MANAGER.SaveDivision',
  }
  callFilter: any = {
    inLocationId: null,
    inDepartmentId: null,
    inDivisionId: null,
    inPageNumber: this.pageNumber,
    inRecordsPerPage: this.recordsPerPage,
    inUserId: null,
    inSortColumn: null,
    inSortOrder: null
  };

  ngOnInit(): void {
    // Retrieve query params
    this.route.queryParams.subscribe(params => {
      this.employeeTab = params['employee'];
      this.employeeTab?this.buildDiv='employeeDetails':this.buildDiv='hierarchy'
    });
    this.getLocationDepartmentDivision();
    this.getEmployeesDetails();
    this.extractId();
    this.dataSource.paginator = this.paginator;
    

  }
 
  hierarchyNames() {
    let body = {};
    this.userApi.hierarchyNames(body).subscribe((result: any) => {
      if (result && result.status === true) {
        const { Location, Department, Division } = result.Data;
  
        // Map to quickly find Location by ID
        const locationMap = new Map(Location.map((loc: any) => [loc.locationId, loc.locationName]));
  
        // Map to quickly find Department by ID
        const departmentMap = new Map(Department.map((dept: any) => [dept.departmentId, dept.departmentName]));
  
        // Add location name to each department
        const enrichedDepartments = Department.map((dept: any) => ({
          ...dept,
          locationName: locationMap.get(dept.locationId) || 'Unassigned',
        }));
  
        // Add department name and location name to each division
        const enrichedDivisions = Division.map((div: any) => ({
          ...div,
          departmentName: departmentMap.get(div.departmentId) || 'Unassigned',
          locationName: locationMap.get(
            Department.find((dept: any) => dept.departmentId === div.departmentId)?.locationId
          ) || 'Unassigned',
        }));

        // Now you can use `enrichedDepartments` and `enrichedDivisions` in your application logic
      } else {
        console.error('Unexpected response format:', result);
      }
    });
  }
  
  
  packageId: any = [];
  // extract id from token
  extractId() {
    const extractData=this.authService.extractDataFromToken(localStorage.getItem('token')) //extract name from token     
    this.packageId = extractData.combinedPackageID  }
  // function to set UI
  privileagedUI(input: any) {
    const status = input.some((item: number) => {
      return this.packageId.includes(item)
    })
    return status
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }


  divFunction(arg: string) {
    this.buildDiv = arg
    this.getEmployeesDetails();
  }
 
 
  isLoading = false;
  exportToFile(fileType: string) {
    this.isLoading = true; // Start loading
  
    const selectedCalls = this.selection.selected;
  
    // Check if no specific calls are selected
    if (selectedCalls.length === 0) {
      this.callFilter.inPageNumber = null;
      this.callFilter.inRecordsPerPage = null;
      this.getEmployeesDetails();
  
      this.userApi.getEmployees(this.callFilter).subscribe(
        async (result: any) => {

          const hierarchyData = await this.fetchHierarchyData(); // Fetch hierarchy data
  
          const locationMap = new Map(hierarchyData.Location.map((loc: any) => [loc.locationId, loc.locationName]));
          const departmentMap = new Map(hierarchyData.Department.map((dept: any) => [dept.departmentId, dept.departmentName]));
          const divisionMap = new Map(hierarchyData.Division.map((div: any) => [div.divisionId, div.divisionName]));
  
          this.data = result.data[0];
          this.exportdata = result.data[0].map((element: any) => ({
            
            firstName: element.firstname,
            middleName: element.middlename,
            lastName: element.lastname,
            Email: element.primaryEmail,
            phone: element.phone,
            designation: element.designation,
            employeeID: element.employeeID,
            agentID: element.agentCode,
            locationName: locationMap.get(element.locationId) || 'Unassigned',
            departmentName: departmentMap.get(element.departmentId) || 'Unassigned',
            divisionName: divisionMap.get(element.divisionId) || 'Unassigned',
          }));
  
          this.SharedService.generateFile(fileType, this.exportdata, 'Employee Details');
          this.isLoading = false; // Stop loading after success
        },
        (error: any) => {
          console.error('Error exporting file:', error);
          this.isLoading = false; // Stop loading after failure
        }
      );
    } else {
      this.fetchHierarchyData().then((hierarchyData) => {
        const locationMap = new Map(hierarchyData.Location.map((loc: any) => [loc.locationId, loc.locationName]));
        const departmentMap = new Map(hierarchyData.Department.map((dept: any) => [dept.departmentId, dept.departmentName]));
        const divisionMap = new Map(hierarchyData.Division.map((div: any) => [div.divisionId, div.divisionName]));
  
        this.exportdata = selectedCalls.map((element: any) => ({
         
          firstname: element.firstname,
          middlename: element.middlename,
          lastname: element.lastname,
          primaryEmail: element.primaryEmail,
          phone: element.phone,
          designation: element.designation,
          employeeID: element.employeeID,
          agentcode: element.agentCode,
          locationName: locationMap.get(element.locationId) || 'Unassigned',
          departmentName: departmentMap.get(element.departmentId) || 'Unassigned',
          divisionName: divisionMap.get(element.divisionId) || 'Unassigned',
        }));
  
        this.SharedService.generateFile(fileType, this.exportdata, 'Employee Details');
        this.isLoading = false; // Stop loading after success
      }).catch((error: any) => {
        console.error('Error fetching hierarchy data:', error);
        this.isLoading = false; // Stop loading after failure
      });
    }
  }
  
  // Helper function to fetch hierarchy data
  private fetchHierarchyData(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.userApi.hierarchyNames({}).subscribe(
        (result: any) => {
          if (result && result.status === true) {
            resolve(result.Data);
          } else {
            reject('Unexpected hierarchy data response');
          }
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }
  

  // open dialog for view employee data
  openDetails(userData: any) {
    this.dialog.open(ViewEditEmpDetailsComponent, {
      data: {
        userData: userData,
        clickedStatus: 'view'
      },
      // height: '515px',
      width: '1000px'
    });

  }
  saveEditedLocation() {

  }
  // open dialog for edit employee data
  editDetails(userData: any) {
    this.dialog.open(ViewEditEmpDetailsComponent, {
      data: {
        userData: userData,
        clickedStatus: 'edit'
      },
        height: 'auto',
      width: '1000px'
    }).afterClosed().subscribe((res: any) => {
      this.getEmployeesDetails();
      this.getLocationDepartmentDivision();
    })
  }

  applyFilters(){
    this.getEmployeesDetails();
  }

  // open dialog for edit insert data
  addDetails() {
    this.dialog.open(ViewEditEmpDetailsComponent, {
      data: {
        userData: '',
        clickedStatus: 'add'
      },
      height: 'auto',
      width: '1000px'
    }).afterClosed().subscribe((res: any) => {
      this.getEmployeesDetails();
      this.getLocationDepartmentDivision();
    })
  }

  // open dialog for edit data
  importEmployeeDetails() {
    this.dialog.open(AlertDialogComponent, {
      data: {
        userData: { 'Name': 'Shehina' },
        clickedStatus: 'importEmployeeDetails'
      },
      height: '215px',
      width: '390px'
    });
  }

  // Function for get employee details
  getEmployeesDetails() {
    let body = this.callFilter;
    // const body = { body:this.callFilter, limit: this.recordsPerPage, offset: this.offset }
    // Make the API call to get employee data
    this.userApi.getEmployees(body).subscribe(
      (result: any) => { 
        if (result.status === true) {
            this.employeeDetails=result.data[0]
          // Set total records for pagination
          this.TotalRecords = result.data[1][0]?.TotalRecords || 0;
          // Use setTimeout to simulate a delay of 1500ms before updating data
          setTimeout(() => {
            this.dataStatus = true; // Set dataStatus as true after the delay
            // Map the received data to pagedData after delay
            this.pagedData = result.data[0].map((element: any) => ({
              userId:element.userId,
              roleId:element.roleId,
              name: element.firstname,
              primaryEmail: element.primaryEmail,
              firstname:element.firstname,
              middlename:element.middlename,
              lastname:element.lastname,
              phone:element.phone,
              designation:element.designation,
              agentcode:element.agentCode,
              employeeID:element.employeeID,
              divisionId:element.divisionId,
              locationId:element.locationId,
              departmentId:element.departmentId

            }));
            // Update the table data and pagination after delay
            this.updatePagedData();
          }, 1000); // Delay of 1000ms
        }
      },
      (error: any) => {
        // Handle specific error statuses
        if (error.status === 403) {
          this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true });
        } else if (error.status === 401) {
          this.router.navigateByUrl(''); // Redirect to login if unauthorized
        } else {
          console.error("An unexpected error occurred:", error);
        }
      }
    );
  }

  deleteConfirmation() {
    this.dialog.open(AlertDialogComponent, {
      data: {
        userData: { 'Name': 'Shehina' },
        clickedStatus: 'deleteConfirmation', height: '190px'
      },
      height: '190px',
      width: '350px',
    }).afterClosed().subscribe((res: any) => {
      this.getEmployeesDetails();
    })
  }

  // Function for delete Employee Details
  DeleteDetails() {
    // Dismiss any open snack bars to avoid overlap
    this.snackBar.dismiss();
  
    // Check if any employees are selected
    if (this.items.length === 0) {
    
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { 
          // message: "Please select an employee to delete"
          message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.ConfirmSelect')
        },
      });
      return; // Exit the function if no employees are selected
    }
  
    // Open confirmation dialog for deletion
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '20%',
      height: '30%',
      data: {
        clickedStatus: "deleteConfirmation",
        // Localized delete confirmation message
        message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteConfirm')

      }
    });
  
    // Handle the dialog close event
    dialogRef.afterClosed().subscribe(result => {
      if (result) { // User confirmed the deletion
        // Iterate through selected employees and delete each
        const deletionRequests = this.items.map((data: any) => {
          const body = { userId: data.userId };
          return this.userApi.deleteEmployees(body).toPromise(); // Convert to promise for better control
        });
  
        // Wait for all delete requests to complete
        Promise.all(deletionRequests).then((results: any) => {
          const allSuccessful = results.every((result: any) => result.status === true);
          if (allSuccessful) {
            // Refresh employee details and clear selections
            this.getEmployeesDetails();  // Reload employees after deletion
            this.items = [];             // Clear selected items after deletion
            this.allGroupsChecked = false; // Reset the master checkbox state
            this.dialog.open(PopUpComponent, {
              width: "500px",
              height: "290px",
              data: {  message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.Employee(s) deleted successfully')},
            });
          } else {
       
            this.dialog.open(PopUpComponent, {
              width: "500px",
              height: "290px",
              data: {  message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.failedDeletion')},
            });
          }
        }).catch((error) => {
          console.error('Error during deletion:', error);
   
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: {  message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.ErrorDelete')},

          });
        });
      } 
      
      
    });
  }
  
  filter() {
    const query = this.searchQuery.trim();
  
    if (query) {
      const body = { query: query }; // No pagination parameters
  
      this.userApi.searchData(body).subscribe(
        (result: any) => {
          if (result.status === true) {
            // Map and display all matched records
            this.pagedData = result.groups.map((element: any) => ({
              name: element.firstname,
              primaryEmail: element.primaryEmail || "N/A",
              phone: element.phone || "N/A",
              firstname:element.firstname,
              middlename:element.middlename,
              lastname:element.lastname,
              extension:element.extension,
              designation:element.designation,
              agentcode:element.agentCode,
              employeeID:element.employeeID,
              divisionId:element.divisionId,
              locationId:element.locationId,
              departmentId:element.departmentId
            }));
  
            // Update total records count based on the full result
            this.TotalRecords = this.pagedData.length;
  
            // Handle displayed pagination range for front-end if necessary
            this.pageNumber = 1;
            this.getTotalPages();
            this.updateDisplayedRange();
          } else {
            // Handle no results gracefully
            this.pagedData = [];
            this.TotalRecords = 0;
          }
        },
        (error) => {
          console.error("Error during search:", error);
  
          // Clear the table and pagination in case of an error
          this.pagedData = [];
          this.TotalRecords = 0;
        }
      );
    } else {
      // Reload all employees when the search query is cleared
      this.getEmployeesDetails();
    }
  }
 

  isAllSelected(): boolean {
    // Returns true if all rows are selected
    return this.items.length === this.pagedData.length && this.items.length > 0;
  }
  
  isIndeterminate(): boolean {
    // Returns true if some rows are selected, but not all
    return this.items.length > 0 && this.items.length < this.pagedData.length;
  }
    toggleAllGroups(event: any): void {
      this.allGroupsChecked = event.checked;
      if (this.allGroupsChecked) {
        // If master checkbox is checked, select all
        this.items = [...this.pagedData]; // Clone all data into selected items
      } else {
        // If unchecked, clear the selection
        this.items = [];
      }      
      }
    checkboxdataAdding(element: any, event: any): void {
      const isChecked = event.checked; // Correct way to access 'checked'
      if (isChecked) {
        // Avoid adding duplicate elements
        if (!this.items.some((item: { userId: any; }) => item.userId === element.userId)) {
          this.items.push(element);
        }
      } else {
        // Remove the unchecked employee from the selection list
        this.items = this.items.filter((item: { userId: any; }) => item.userId !== element.userId);
      }
      }

      

  handleClickLocation() {
    this.addClick = true
  }
  handleClickDepartment() {
    this.addDepartmentClick = true;
  }
  handleClickDivision() {
    this.addDivisionClick = true;
  }
  hasLdapDepartmentItems(): boolean {
    return this.departmentItems.some(item => item.LDAPPropertyValue);
    
  }
  hasLdapDivisionItems(): boolean {
    return this.divisionItems.some(item => item.LDAPPropertyValue);
  }
  

  // Function for hierarchy updated alertbox
  hierarchyUpdated() {
    this.dialog.open(AlertDialogComponent, {
      data: {
        userData: { 'Name': 'Shehina' },
        clickedStatus: 'hierarchyUpdated', height: '190px'
      },
      height: '190px',
      width: '350px',

    });
  }



  editlocation(item: any) {
    if (!item) {
      console.error('Item is undefined:', item);
      return;
    }
  
    // Prevent editing for any row named "Unassigned" (case-insensitive)
    if (item.locationName.toLowerCase() === 'unassigned' || item.LDAPPropertyValue) {
      console.warn('Editing is disabled for "Unassigned" locations.');
      return; // Do nothing if the row is "Unassigned"
    }
  
    this.selectedLocation = item;
    this.editingLocation = item.locationId;
    this.editedLocationName = item.locationName;
  }
  



  editDepartment(item: any) {
    if (!item) {
      console.error('Item is undefined:', item);
      return;
    }
    // Prevent editing for "Unassigned" (case-insensitive)
    if (item.departmentName.toLowerCase() === 'unassigned' || item.LDAPPropertyValue) {
      console.warn('Editing is disabled for "Unassigned" departments.');
      return;
    }  
    this.editingdepartment = item.departmentId;
    this.departmentName = item.departmentName;
  }
  


  editDivision(item: any) {
    if (!item) {
      console.error('Item is undefined:', item);
      return;
    }
  
    // Prevent editing for "Unassigned" (case-insensitive)
    if (item.divisionName.toLowerCase() === 'unassigned' || item.LDAPPropertyValue) {
      console.warn('Editing is disabled for "Unassigned" divisions.');
      return;
    }
  
    this.editingdivision = item.divisionId;
    this.editedDivisionName = item.divisionName;
  }
  

  getDivisionBylocation(locationId: number) {

    this.userApi.getDivisionBylocation({ locationId }).subscribe((result: any) => {
      if (result) {
        this.divisionItems = result.Data;
      } else {
        console.error('Unexpected response format:', result);
      }
    });
  }

  // Function for get Department by locationID
  getDepartmentByLocation(locationId: number) {
    this.userApi.getDepartmentByLocation({ locationId }).subscribe((result: any) => {
      if (result) {
        this.departmentItems = result.Data
          .filter((dep: any) => dep.departmentName && typeof dep.departmentName === "string") // Ensure valid department names
          .map((dep: { LDAPPropertyValue: any; CreatedAt: string }) => ({
            ...dep,
            LDAPPropertyValue: dep.LDAPPropertyValue ?? false, // Default false for non-LDAP
          }))
          .sort((a: any, b: any) => {
            // Sort LDAP departments on top
            if (b.LDAPPropertyValue && !a.LDAPPropertyValue) return 1;
            if (a.LDAPPropertyValue && !b.LDAPPropertyValue) return -1;
            // Sort by most recent department added (NEWEST FIRST)
            return new Date(a.CreatedAt).getTime() < new Date(b.CreatedAt).getTime() ? 1 : -1;
          });
      }
    });
  }
  
  // Function for get Division by departmentId
  getDivisionByDept(deartmentId: number) {
    this.userApi.getDivisionByDept({ deartmentId }).subscribe((result: any) => {
      if (result) {
        this.divisionItems = result.Data;
      } else {
        console.error('Unexpected response format:', result);
      }
    });
  }
  // Function for get Location,Department,Division
  getLocationDepartmentDivision() {
    let body = {};
    this.userApi.getLocationDepartmentDivision(body).subscribe((result: any) => {
      if (result) {
        if (Array.isArray(result.Data.Location)) {
        this.items1 = result.Data.Location
          .filter((loc: any) => loc.locationName && typeof loc.locationName === "string") // Ensure valid locations only
          .map((loc: { LDAPPropertyValue: any }) => ({
            ...loc,
            LDAPPropertyValue: loc.LDAPPropertyValue ?? false, // Default false for non-LDAP
          }))
          .sort((a: any, b: { LDAPPropertyValue: any }) => (b.LDAPPropertyValue ? 1 : -1)); // Sort LDAP on top
      }
        if (Array.isArray(result.Data.Department)) {
          this.departmentItem = result.Data.Department;
        }
        if (Array.isArray(result.Data.Division)) {
          this.divisionItem = result.Data.Division;
        }

      } else {
        console.error('Unexpected response format:', result);
      }
    },Error=>{
      if (Error.status === 403) {
        // opens dialog for logout message
        this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true })
      }
      else if (Error.status === 401) {
        this.router.navigateByUrl('')
        // this.dialogRef.open(LogoutSpinnerComponent,{data:{clickedType:'logOut'}})
      }
    });
  }
  
  // Function to handle selection of a location
  toggleLocationSelection(event: any, location: any) {
   
    
    if (!location || !location.locationId) {
      return;
    }
    this.locationId = location.locationId;
    if (event.checked) {
      this.selectedLocations.clear();
      this.selectedLocations.add(this.locationId);
      this.getDepartmentByLocation(this.locationId);
      this.getDivisionBylocation(this.locationId);
    } else {
      this.selectedLocations.delete(this.locationId);
      this.departmentItems = [];
      this.divisionItems=[];
    }
  }
  shouldDisableLocationCheckbox(): boolean {
    return this.hasLdapDepartmentItems() || this.hasLdapDivisionItems();
  }
  
  // Function for checkbox selection department
  toggleDepartmentSelection(event: any, department: any) {
    if (!department || !department.departmentId) {
      console.error('Department or departmentId is undefined:', department);
      return;
    }
    this.departmentId = department.departmentId
    const { departmentId, departmentName, locationId } = department;

    if (event.checked) {
      this.selectedDepartments.clear();
      this.selectedDepartments.add({ departmentId, departmentName, locationId });
      this.getDivisionByDept(departmentId);
    } else {
      this.selectedDepartments.delete({ departmentId, departmentName, locationId });
      this.divisionItems = [];
    }
  }
  // Method to check if a department is selected
  isDepartmentSelected(departmentId: number): boolean {
    for (let dept of this.selectedDepartments) {
      if (dept.departmentId === departmentId) {
        return true;
      }
    }
    return false;
  }
  toggleDivisionSelection(event: any, item: any) {
    if (event.checked) {
      this.selectedDivisions.add({ divisionId: item.divisionId, divisionName: item.divisionName, departmentId: item.departmentId });
    } else {
      this.selectedDivisions.delete({ divisionId: item.divisionId, divisionName: item.divisionName, departmentId: item.departmentId });
    }
  }
  // Function for Save Location
  saveLocation() {
    // Check if the location name already exists in the local items1 array
    const duplicateLocation = this.items1.some(item =>
      item.locationName?.trim().toLowerCase() === this.locationName.trim().toLowerCase()
    );
    let body = { locationName: this.locationName.trim() };
    // Call the API to add the location
    this.userApi.addLocation(body).subscribe(
      (result: any) => {
        if (result.status === true) {
          this.getLocationDepartmentDivision(); // Ensure the method name is correct
          this.locationName = '';
          this.addClick = false;
        } else {
          console.error("Failed to add location:", result.statusText);
        }
      },
      (error) => {
        console.error("Error adding Location:", error.error);
     
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message:  error.error.statusText},
        });
      }
    );
  }


  saveDepartment() {
    // Get the selected location if available, assuming it's a number
    const selectedLocation = this.selectedLocations.size > 0 ? Array.from(this.selectedLocations)[0] : null;
  
    // If no location is selected, show a snack bar notification and reset fields
    if (!selectedLocation) {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteLocationSelect') }
      }).afterClosed().subscribe(() => {
        this.departmentName = '';
        this.addDepartmentClick = false;
      });
      return;
    }
    
  
    // Prepare the request body using the selected location (which is a number)
    const body = { departmentName: this.departmentName, locationId: selectedLocation };
  
    // Call the API to add the department
    this.userApi.addDepartment(body).subscribe(
      (result: any) => {
        if (result.status === true) {
          // On success, refresh the department list for the selected location and reset fields
          this.getDepartmentByLocation(selectedLocation);
          this.departmentName = '';
          this.addDepartmentClick = false;
          // this.selectedLocations.clear(); // Clear selected locations after saving
        }
      },
      (error) => {
        // Handle errors during the API call and show a snack bar with the error message
        console.error("Error adding Department:", error.error);
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message:  error.error.statusText},
        });
      }
    );
  }
  
  // Function for Save Division
  saveDivision() {

    const selectedDepartment = this.selectedDepartments.size > 0 ? Array.from(this.selectedDepartments)[0] : null;
    const departmentId = selectedDepartment ? selectedDepartment.departmentId : null;
    if (!departmentId) {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteDepartmentSelect') }
      }).afterClosed().subscribe(() => {
        this.divisionName = '';
        this.addDivisionClick = false;
      });
      return;
    }
    
    const body = { divisionName: this.divisionName, departmentId: departmentId };

    this.userApi.addDivision(body).subscribe(
      (result: any) => {
        if (result.status === true) {
          this.getDivisionByDept(departmentId);
          this.divisionName = '';
          this.addDivisionClick = false;
          // this.selectedDepartments.clear();
        }

      },
      (error) => {
        console.log("Error adding Division:", error.error);
    
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message:  error.error.statusText},
        });
      }
    );
  }
  // Function for delete location
  // DeleteLocation() {
  //   if (this.selectedLocations.size === 0) {
  //     this.dialog.open(PopUpComponent, {
  //       width: "500px",
  //       height: "290px",
  //       data: {  message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.No location selected')},
  //     });
  //     return; // Exit if no location is selected
  //   }

  //   // Validate if any selected location has the name "Unassigned"
  //   const unassignedLocation = this.items1.find(item => 
  //     this.selectedLocations.has(item.locationId) && 
  //     item.name?.trim().toLowerCase() === "Unassigned"
  //   );
    
  //   if (unassignedLocation) {
  //     this.dialog.open(PopUpComponent, {
  //       width: "500px",
  //       height: "290px",
  //       data: {  message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.The location Unassigned cannot be deleted')},
  //     });
  //     return; // Exit if "Unassigned" is found
  //   }

  //   // Show Snackbar for confirmation
  //   const snackBarRef = this.snackBar.open(
  //     'Are you sure you want to delete the selected location(s)?',
  //     'Delete',
  //     {
  //       duration: 5000,
  //       verticalPosition: 'top',
  //       panelClass: ['delete-snackbar'],
  //     }
  //   );
  
  //   snackBarRef.onAction().subscribe(() => {
  //     const locationsToDelete = Array.from(this.selectedLocations);
  
  //     locationsToDelete.forEach((locationId) => {
  //       this.userApi.deleteLocation({ locationId }).subscribe(
  //         (result: any) => {
  //           if (result.status === true) {
  //             this.items1 = this.items1.filter(item => item.locationId !== locationId);
  //           }
  
  //           this.dialog.open(PopUpComponent, {
  //             width: "500px",
  //             height: "290px",
  //             data: { message: 'Location deleted successfully' },
  //           });
  
  //         },
  //         (error) => {
  //           console.error("Error deleting Location:", error.error);
  //           this.dialog.open(PopUpComponent, {
  //             width: "500px",
  //             height: "290px",
  //             data: { message: error.error.statusText || 'An error occurred while deleting location.' },
  //           });
  //         }
  //       );
  //     });
  
  //     this.selectedLocations.clear();
  //   });
  // }

  DeleteLocation() {
    if (this.selectedLocations.size === 0) {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteLocationSelect') },
      });
      return; // Exit if no location is selected
    }
  
    // Validate if any selected location has the name "Unassigned"
    const unassignedLocation = this.items1.find(item =>
      this.selectedLocations.has(item.locationId) &&
      item.name?.trim().toLowerCase() === "unassigned"
    );
  
    if (unassignedLocation) {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.UnassignedLocation') },
      });
      return; // Exit if "Unassigned" is found
    }
  
    // Show confirmation dialog instead of snackbar
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '20%',
      height: '30%',
      data: {
        clickedStatus: "deleteConfirmation",
        message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteLocationConfirm')
      }
    });
  
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        const locationsToDelete = Array.from(this.selectedLocations);
  
        locationsToDelete.forEach((locationId) => {
          this.userApi.deleteLocation({ locationId }).subscribe(
            (result: any) => {
              if (result.status === true) {
                this.items1 = this.items1.filter(item => item.locationId !== locationId);
              }
  
              this.dialog.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: { message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteLocationSuccess') },
              });
  
            },
            (error) => {
              console.error("Error deleting Location:", error.error);
              this.dialog.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: { message: error.error.statusText || this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.An error occurred while deleting location') },
              });
            }
          );
        });
  
        this.selectedLocations.clear();
      }
    });
  }
  
  
  // Function for delete department
  deleteDepartment() {
    if (this.selectedDepartments.size === 0) {

      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: {  message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteDepartmentSelect')},

      });
      return; // Exit if no department is selected
    }
  
    // Show confirmation Snackbar
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '20%',
      height: '30%',
      data: {
        clickedStatus: "deleteConfirmation",
        message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteDepartmentConfirm')
      }
    });
  
    dialogRef.afterClosed().subscribe(() => {
      // User confirmed deletion by clicking "DELETE"
      const departmentsToDelete = Array.from(this.selectedDepartments);
  
      departmentsToDelete.forEach((dept) => {
        this.userApi.deleteDepartment({
          departmentName: dept.departmentName,
          departmentId: dept.departmentId
        }).subscribe(
          (result: any) => {
            if (result.status === true) {
              // Remove the deleted department from the list
              this.departmentItems = this.departmentItems.filter(
                item => item.departmentName !== dept.departmentName || item.departmentId !== dept.departmentId
              );

              this.dialog.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: {  message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteDepartmentSuccess')},

              });
            }
          },
          (error) => {
            console.error("Error deleting Department:", error.error);
            this.dialog.open(PopUpComponent, {
              width: "500px",
              height: "290px",
              data: { message:  error.error.statusText || 'An error occurred while deleting department.'},
            });
          }
        );
      });
  
      // Clear selected departments
      this.selectedDepartments.clear();
    });
  }
  // Function for delete division
  deleteDivision() {
    if (this.selectedDivisions.size === 0) {

      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: {  message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteDivisionSelect')},
      });
      return; // Exit if no divisions are selected
    }
  
    // Show confirmation Snackbar
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '20%',
      height: '30%',
      data: {
        clickedStatus: "deleteConfirmation",
        message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteDivisionConfirm')
      }
    });


  
    dialogRef.afterClosed().subscribe(() => {
      // Proceed with deletion after confirmation
      const divisionsToDelete = Array.from(this.selectedDivisions);
  
      divisionsToDelete.forEach((div) => {
        this.userApi
          .deleteDivision({
            divisionId: div.divisionId,
            divisionName: div.divisionName,
          })
          .subscribe(
            (result: any) => {
              if (result.status === true) {
                // Remove the deleted division from divisionItems
                this.divisionItems = this.divisionItems.filter(
                  (item) =>
                    item.divisionName !== div.divisionName ||
                    item.divisionId !== div.divisionId
                );

                this.dialog.open(PopUpComponent, {
                  width: "500px",
                  height: "290px",
                  data: {  message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.DeleteDivisionSuccess')},

                });
              }
            },
            (error) => {
              console.error('Error deleting Division:', error.error);
              this.dialog.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: { message: error.error.statusText ||
                  'An error occurred while deleting the division.'},
              });
            }
          );
      });
  
      // Clear the selected divisions
      this.selectedDivisions.clear();
    });
  }
  
  // Function for save updated location,department,division
  saveEditedLocationDepartmentDivision() {
    const locationUpdateData = this.selectedLocation ? {
      locationId: this.selectedLocation.locationId,
      locationName: this.editedLocationName
    } : null;

    const departmentUpdateData = this.editingdepartment ? {
      departmentId: this.editingdepartment,
      departmentName: this.departmentName
    } : null;

    const divisionUpdateData = this.editingdivision ? {
      divisionId: this.editingdivision,
      divisionName: this.editedDivisionName
    } : null;



    // Call the API to update the location if a location is being edited
    if (this.selectedLocation && this.selectedLocation.locationId === this.editingLocation) {
      this.userApi.updateLocation(locationUpdateData).subscribe(
        (response: any) => {

          if (response.status === true) {
            // Update the location name in the local items1 array
            if (this.selectedLocation && 'locationName' in this.selectedLocation) {
              this.selectedLocation.locationName = this.editedLocationName;
            }
            this.hierarchyUpdated();
            this.getLocationDepartmentDivision();
          } else {
            if (response.statusText === "Location name already exists") {
         
              this.dialog.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: {  message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.Location name already exists')},

              });
            } else {
          
              this.dialog.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: {  message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.Failed to update location')},

              });
            }
          }
        },
        (error) => {
          console.error('Error updating location:', error.error);
       
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: error.error.statusText},
          });
        }
      );
    }

    // Call the API to update the department if a department is being edited
    if (this.editingdepartment) {
      this.userApi.updateDepartment(departmentUpdateData).subscribe(
        (response: any) => {

          if (response.status === true) {
            // Update the department name in the local items1 array if needed
            this.hierarchyUpdated();
            this.getLocationDepartmentDivision();
            this.getDepartmentByLocation(this.locationId);
          } else {
            console.error('Error updating department:', response);
   
            this.dialog.open(PopUpComponent, {
              width: "500px",
              height: "290px",
              data: { message: response.statusText},
            });
          }
        },
        (error) => {
          console.error('Error updating department:', error.error);
   
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: error.error.statusText},
          });
        }
      );
    }

    // Call the API to update the division if a division is being edited
    if (this.editingdivision) {
      this.userApi.updateDivision(divisionUpdateData).subscribe(
        (response: any) => {

          if (response.status === true) {
            // Update the division name in the local items1 array if needed
            this.hierarchyUpdated();
            this.getLocationDepartmentDivision();
            this.getDivisionByDept(this.departmentId)
          } else {
            console.error('Error updating division:', response);
 
            this.dialog.open(PopUpComponent, {
              width: "500px",
              height: "290px",
              data: { message: response.statusText},
            });
          }
        },
        (error) => {
          console.error('Error updating division:', error.error);

          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: error.error.statusText},
          });
        }
      );
    }

    // Disable editing mode and clear the fields
    this.editingLocation = false;
    this.editedLocationName = '';
    this.editingdepartment = false;
    this.departmentName = '';
    this.editingdivision = false;
    this.editedDivisionName = '';
    this.selectedLocation = null;
  }
  // Function for clear slected fields
  cancelEdit() {
    this.editingLocation = false;
    this.editedLocationName = '';
    this.addClick = false;
    this.addDepartmentClick = false;
    this.addDivisionClick = false;
    this.editingdepartment = false;
    this.editingdivision = false;
  }
  
  mapping(): void {
    // Map the selected items to their IDs
    const selectedIds = this.items.map((item: { userId: any; }) => item.userId); // Assuming 'userId' is the ID field
  
    // Check if no IDs are selected
    if (selectedIds.length === 0) {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { 
          message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.SelectAtLeastOneEmployee')
        },
      });
      return;
    }
    // Open the dialog with the selected IDs
    this.dialog.open(EmployeePopupComponent, {
      data: {
        userData: selectedIds,
        clickedStatus: 'Map',
      },
      
      height: '70vh',
      width: '45vw',
      panelClass: 'custom-dialog', // Add custom class here
      
    }).afterClosed().subscribe((res: any) => {
      this.getEmployeesDetails();
    });
    
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
      this.getEmployeesDetails();
      this.updateDisplayedRange();
    }
    nextPage() {
      if (this.pageNumber < this.getTotalPages()) {
        this.pageNumber++;
        this.callFilter.inRecordsPerPage = this.recordsPerPage;
        this.callFilter.inPageNumber = this.pageNumber
        this.getEmployeesDetails();
        this.updateDisplayedRange();
      }
    }
    previousPage() {
      if (this.pageNumber > 1) {    
        this.pageNumber--;
        this.callFilter.inRecordsPerPage = this.recordsPerPage;
        this.callFilter.inPageNumber = this.pageNumber;
        this.getEmployeesDetails();
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
      this.getEmployeesDetails();
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


    openFilter() {
      this.dialog.open(FilterEmployeemanagerComponent, {
        disableClose: true,data:{callFilter:this.callFilter}
      }).afterClosed().subscribe((result: any) => {
        if (result) {
          // Pass the selected location, department, and division IDs into callFilter
          this.callFilter.inLocationId = result.locationId || null;
          this.callFilter.inDepartmentId = result.departmentId || null;
          this.callFilter.inDivisionId = result.divisionId || null;
    
          // Trigger the API call to get filtered employee data
          this.getEmployeesDetails();
        }
      });
    }   
}
