import { Component, Inject, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { UserService } from '../../../core/services/user/user.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PopUpComponent } from '../pop-up/pop-up.component';


@Component({
  selector: 'app-view-edit-emp-details',
  standalone: true,
  imports: [MatIconModule, MatToolbarModule, MatSidenavModule,
    MatDialogModule, FormsModule, ReactiveFormsModule, MatTooltipModule,
    MatMenuModule, MatCheckboxModule, TranslateModule, MatExpansionModule, MatFormFieldModule,
    CommonModule, MatTableModule, MatSortModule, MatButtonModule, MatSelectModule, MatPaginatorModule, MatInputModule],
  templateUrl: './view-edit-emp-details.component.html',
  providers: [UserService],
  styleUrl: './view-edit-emp-details.component.css'
})


export class ViewEditEmpDetailsComponent implements OnInit {
  connectionStatus: any;
  locationDepartmentDivisionForm: FormGroup;
  clickedName: string = '';
  clickedStatus: boolean = false;
  f: any;
  selectedLocation: any;
  selectedDepartment: any;
  selectedDivision: any;
  items1: any;
  departmentItems: any;
  divisionItems: any;
  locationIdForEdit: any
  departmentIdForEdit: any
  dataCheck: any
  divisionList: any;
  locationList: any;
  departments: any;
  department: any;
  divisionName: any;


  // form for update user
  userUpdateForm = this.fb.group({
    username: [''],
    userId: [''],
    roleId: [''],
    firstname: ['', Validators.required],
    middlename: [''],
    lastname: [''],
    primaryEmail: ['', [Validators.required, Validators.email]],  // Added email validation
    phone: ['', [Validators.pattern('^[0-9]{7,15}$')]],
    extension: [''],
    designation: [''],
    agentcode: [''],
    employeeID: ['', [Validators.required, Validators.pattern('^.{4,}$')]], // Minimum 4 characters, no upper limit
    location: [''],
    department: [''],
    divisionId: [''],
    locationId: [''],
    locationName: [''],
    departmentId: [''],
    departmentName: [''],
    divisionName: ['']
  })

  addEmployees = this.fb.group({
    username: [''],
    userId: [''],
    roleId: [''],
    firstname: ['', Validators.required],
    middlename: [''],
    lastname: [''],
    primaryEmail: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]],
    phone: ['', [Validators.pattern('^[0-9]{7,15}$')]],
    extension: [''],
    designation: [''],
    agentcode: [''],
    employeeID: ['', [Validators.required, Validators.pattern('^.{4,}$')]], // Minimum 4 characters, no upper limit
    location: [''],
    department: [''],
    divisionId: [''],
    locationId: [''],
    locationName: [''],
    departmentId: [''],
    departmentName: [''],
    divisionName: ['']
  })

  // form for view  employee details
  viewEmployeeDetails = this.fb.group({
    firstname: [{ value: '', disabled: true }, Validators.required],
    middlename: [{ value: '', disabled: true }],
    lastname: [{ value: '', disabled: true }],
    primaryEmail: [{ value: '', disabled: true }, Validators.email],
    phone: [{ value: '', disabled: true }],
    extension: [{ value: '', disabled: true }],
    designation: [{ value: '', disabled: true }],
    employeeID: [{ value: '', disabled: true }],
    agentcode: [{ value: '', disabled: true }],
    locationId: [{ value: '', disabled: true }],
    departmentId: [{ value: '', disabled: true }],
    divisionId: [{ value: '', disabled: true }],
  })

  toolTips: any = {
    Update: 'Menu.CONFIGURE.EMPLOYEE MANAGER.Update',
    Close: 'Menu.CONFIGURE.EMPLOYEE MANAGER.CLOSE',
    Saveemployee: 'Menu.CONFIGURE.EMPLOYEE MANAGER.Saveemployee'
  }

  tableData: any[] = []; // This holds the table's data

  constructor(@Inject(MAT_DIALOG_DATA) public data: { userData: object, clickedStatus: string },
    public matdialoge: MatDialog, private fb: FormBuilder, private userApi: UserService, private router: Router,
    private snackBar: MatSnackBar,
    private translate:TranslateService,
  ) {
    this.locationDepartmentDivisionForm = this.fb.group({
      divisionId: new FormControl(''),
      locationId: new FormControl(''),
      departmentId: new FormControl(''),
      locationName: new FormControl(''),
      departmentName: new FormControl(''),
      divisionName: new FormControl('')
    })
  }

  ngOnInit(): void {
    this.clickedName = this.data.clickedStatus;
    this.dataCheck = this.data.userData
    this.locationIdForEdit = this.dataCheck.locationId

        // Initialize form data
        this.viewEmployeeDetails.patchValue({
          ...this.dataCheck,
          locationId: this.dataCheck.locationId || null, // Default to "Unassigned"
          departmentId: this.dataCheck.departmentId || null, // Default to "Unassigned"
          divisionId: this.dataCheck.divisionId || '0', // Default to "Unassigned"
        });
        this.userUpdateForm.patchValue({
          ...this.dataCheck,
          locationId: this.dataCheck.locationId || null, // Default to "Unassigned"
          departmentId: this.dataCheck.departmentId || null, // Default to "Unassigned"
          divisionId: this.dataCheck.divisionId || '0', // Default to "Unassigned"
        });

      this.getLocation();

    if (this.clickedName == 'edit' || this.clickedName == 'view') {
      this.dataCheck = this.data.userData      
      this.locationIdForEdit = this.dataCheck.locationId
      this.departmentIdForEdit = this.dataCheck.departmentId
      this.userUpdateForm.patchValue(this.dataCheck);
      this.viewEmployeeDetails.patchValue(this.dataCheck);
      this.getDepartmentByLocation(this.locationIdForEdit)
      this.getDivisionByDept(this.departmentIdForEdit)
      this.getLocationDepartmentDivision();
    }

  }

  resultLocDepDivi: any = {};

  // Function for get location
  getLocationDepartmentDivision() {
    let body = {};
    this.userApi.getLocationDepartmentDivision(body).subscribe((result: any) => {
      if (result) {
        // Check if Location, Department, and Division data are arrays
        if (
          Array.isArray(result.Data.Location) &&
          Array.isArray(result.Data.Department) &&
          Array.isArray(result.Data.Division)
        ) {
          this.resultLocDepDivi = result.Data;
        } else {
          console.error('Location, Department, or Division data is not an array or is missing.');
        }
      } else {
        console.error('Unexpected response format:', result);
      }
    });
  }

  getLocation() {
    let body = {};
    this.userApi.getLocationDepartmentDivision(body).subscribe((result: any) => {
      if (result) {
        if (Array.isArray(result.Data.Location)) {
          this.items1 = result.Data.Location;
        }
      } else {
        console.error('Unexpected response format:', result);
      }
    });
  }

  getDepartmentByLocation(locationId: number) {
    let body = { locationId: locationId };
    this.userApi.getDepartmentByLocation(body).subscribe((result: any) => {
      if (result) {
        this.departmentItems = result.Data;
      } else {
        console.error('Failed to fetch departments by location:', result);
        this.departmentItems = [];
      }
    }, (error) => {
      console.error('Error fetching departments:', error);
      this.departmentItems = [];
    }
    );
  }

  getDivisionByDept(deartmentId: any) {

    let body = { deartmentId: deartmentId };
    this.userApi.getDivisionByDept(body).subscribe((result: any) => {
      this.divisionItems = result.Data;
    },
      (error) => {
        console.error('Error fetching division:', error);
        this.divisionItems = [];
      }
    );

  }

  onLocationSelectionChange(event: Event) {
    const selectedLocationId = (event.target as HTMLSelectElement).value;
      this.getDepartmentByLocation(Number(selectedLocationId));
      this.departmentItems = [];
      this.divisionItems = [];
  }

  onDepartmentSelectionChange(event: any) {
    const selectedDepartmentId = (event.target as HTMLSelectElement).value;    
      this.getDivisionByDept(Number(selectedDepartmentId));
      this.divisionItems = [];
  }


  // Method for input event to control phone number format
  onPhoneInput(event: any): void {
    // Remove all non-numeric characters
    let cleanedValue = event.target.value.replace(/[^0-9]/g, '');

    // Limit the length of the phone number to 15 characters
    if (cleanedValue.length > 15) {
      cleanedValue = cleanedValue.substring(0, 15);
    }

    // Set the cleaned value back to the input field
    event.target.value = cleanedValue;

    // Update the form control value
    this.addEmployees.get('phone')?.setValue(cleanedValue);
  }

  addEmployeesData() {
    const mandatoryFields = ['firstname', 'primaryEmail', 'employeeID'];
    mandatoryFields.forEach(field => {
      const control = this.addEmployees.get(field);
      control?.markAsTouched({ onlySelf: true });
    });

    ['middlename', 'lastname', 'designation', 'phone', 'agentcode'].forEach(field => {
      const control = this.addEmployees.get(field);
      control?.clearValidators();
      control?.updateValueAndValidity();
    });

    if (this.addEmployees.valid) {
      const formData = { ...this.addEmployees.value };

      // Assuming the fields are named `location`, `division`, and `department`
       if (!formData.locationId || !formData.divisionId || !formData.departmentId) {
       formData.divisionId = '0'; // Set divisionid to 0
      }
   
      this.userApi.addEmployees(formData).subscribe({
        next: (result: any) => {
          if (result.status === true) {
            this.matdialoge.closeAll();
            this.matdialoge.open(PopUpComponent, {
              width: "500px",
              height: "290px",
              data: {  message: this.translate.instant('Menu.CONFIGURE.EMPLOYEE MANAGER.Success')},

            });
            this.addEmployees.reset(); // Reset the form after successful submission
          }
        },
        error: (error) => {
          console.error("Error adding employee:", error);

          if (error.status === 400 && error.error && error.error.statusText) {
            const backendErrors = error.error.statusText;

            if (Array.isArray(backendErrors)) {
              let errorMessage = "";
              backendErrors.forEach((err: any) => {
                const fieldName = err.field;
                const message = err.message;
                errorMessage += `${message}`;

                const control = this.addEmployees.get(fieldName);
                if (control) {
                  control.setErrors({ backendError: message });
                }
              });

              this.matdialoge.closeAll();
              this.matdialoge.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: { message: `${errorMessage}` }
              });
            } else if (typeof backendErrors === 'object') { // Handle single error object
                const fieldName = backendErrors.field;
                const message = backendErrors.message;
                const control = this.addEmployees.get(fieldName);
                if (control) {
                  control.setErrors({ backendError: message });
                }
                this.matdialoge.closeAll();
                this.matdialoge.open(PopUpComponent, {
                  width: "500px",
                  height: "290px",
                  data: { message: message}
                });
            }
            else {
              this.matdialoge.closeAll();
              this.matdialoge.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: { message: backendErrors}
              });
            }
          } else {
            this.matdialoge.closeAll();
            this.matdialoge.open(PopUpComponent, {
              width: "500px",
              height: "290px",
              data: { message: `${error.error?.statusText || 'Unknown error'}` }
            });
          }
        }
      });
    } else {
      console.log("Form is invalid. Please correct the highlighted fields.");
    }
  }

  UpdateEmployeesDetails() {
    // Check if the form is valid
    if (this.userUpdateForm.valid) {      
      // Make the API call to update the employee details
      this.userApi.updateEmployees(this.userUpdateForm.value).subscribe(
        (result: any) => {   
          console.log("updateEmployees function",this.userUpdateForm.value);
          
          if (result.status === true) {
            console.log("Employee updated successfully");
            const message = 'The employee details updated successfully';
            this.matdialoge.open(PopUpComponent, {
              disableClose: true,
              width: "500px",
              height: "290px",
              data: {
                message: message,
                clickedStatus: 'employeeUpdated',
                okButtonClass: 'okButtons',
              }
            }).afterClosed().subscribe(() => {
              this.matdialoge.closeAll();
            });
          }
        },
        (error) => {
          let errorMessage = 'An error occurred while updating the employee details.';
          if (error.status === 400 && error.error.statusText === 'Employee ID already exists') {
            errorMessage = 'Employee ID already exists.';
          }
          console.log("Error updating employee details:", error);
          this.matdialoge.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: errorMessage },
          }).afterClosed().subscribe(() => {
            this.matdialoge.closeAll();
          });
        }
      );
    }
  }

}