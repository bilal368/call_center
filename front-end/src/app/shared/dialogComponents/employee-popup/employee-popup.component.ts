import { Component, Inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';

import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, AbstractControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../core/services/user/user.service';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PopUpComponent } from '../pop-up/pop-up.component';


@Component({
  selector: 'app-employee-popup',
  standalone: true,
  imports: [TranslateModule,MatSelectModule,MatFormFieldModule,MatDialogModule, FormsModule, ReactiveFormsModule,MatTooltipModule],
  templateUrl: './employee-popup.component.html',
  styleUrl: './employee-popup.component.css'
})
export class EmployeePopupComponent {
  locationList: any[] = [];
  departmentList: any[] = [];
  divisiomList: any[] = [];
  filteredLocationList: any[] = this.locationList;
  filteredDivisionList: any ;
  filteredDepartmentList: any[] = this.locationList;
  extensionList: any[] = [];
  employeeList: any[] = [];


  constructor(
    public dialog: MatDialog,
    private userApi: UserService,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<EmployeePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      heading: any; userData: any, clickedStatus: string
    },
    private snackBar: MatSnackBar,
    private translate:TranslateService,
    
  ) {

    this.mappingForm = this.formBuilder.group({
      location: ['', [Validators.required]],
      department: ['', [Validators.required]],
      division: ['', [Validators.required]],
    })

  }

  toolTips:any={
    Save:'Menu.CONFIGURE.EMPLOYEE MANAGER.Save',
  }
  mappingForm: FormGroup;

  get f1(): { [key: string]: AbstractControl } {
    return this.mappingForm.controls;
  }

  ngOnInit() {
    this.fetchData();
  }
  fetchData() {
    this.userApi.getHierachyMappingDetails().subscribe(
      (result: any) => {

        if (result.status) {
          // Update data lists from API response
          this.locationList = result.location || [];
          this.departmentList = result.department || [];
          this.employeeList = result.getEmployees || [];

        const departmentId = this.departmentList.length > 0 ? this.departmentList[0].departmentId : null;

          if (this.data.clickedStatus === 'Map') {
            const locationId = this.locationList.length > 0 ? this.locationList[0].locationId : null;
          
            // Pass locationId to setupMappingData
            this.setupMappingData(locationId,departmentId,);          }
        } else {
          console.error("Failed to fetch data:", result.message);
        }
      },
      (error) => {
        console.error("Error fetching data:", error);
      }
    );
  }
  setupMappingData(locationId: any,departmentId: any) {
    // Ensure the data structure is valid
    if (this.employeeList && this.locationList && this.departmentList) {

      this.employeeList = [
        {
          userId: this.data.userData,
          locationId: locationId , // Use the passed locationId
          departmentId: departmentId   
        },
      ];

      this.getDepartmentsByLocation(locationId);
          // Avoid calling getDivisionByDept on initial load
    if (departmentId) {
      this.getDivisionByDept(departmentId);  // Call only when departmentId is available
    }

    } else {
      console.warn("No valid user data for mapping setup.");
    }
  }
  getDepartmentsByLocation(locationId: any) {
    this.mappingForm.get('department')?.setValue(null); // Clear department
    this.mappingForm.get('division')?.setValue(null); 
    let body = { locationId: locationId };

    this.userApi.getDepartmentByLocation(body).subscribe((result: any) => {
      if (result && result.status && Array.isArray(result.Data)) {
        this.departmentList = result.Data;
        this.divisiomList = [];
      } else {
        console.error('Failed to fetch departments by location:', result);
        this.departmentList = [];
      }    
    },
      (error) => {
        console.error('Error fetching departments:', error);
        this.departmentList = [];
      }
    );
  }
  getDivisionByDept(departmentId: any) {
    let body = { deartmentId: departmentId };

    this.userApi.getDivisionByDept(body).subscribe((result: any) => {

      if (result) {
        this.divisiomList = result.Data;// Update department items with fetched data
      } else {
        console.error('Failed to fetch division by department:', result);
        this.divisiomList = []; // Clear departments or handle error as needed
      }      
    },
      (error) => {
        console.error('Error fetching division:', error);
        this.divisiomList = []; // Clear departments or handle error as needed
      }
    );
  }

    // Function for searching locations
    onSearchLocation(event: Event): void {
      const input = (event.target as HTMLInputElement).value.toLowerCase();
      this.filteredLocationList = this.locationList.filter(location =>
        location.locationName?.toLowerCase().includes(input)
      );
      this.locationList = this.filteredLocationList;
    }
  
    // Function for searching departments
    onSearchDepartment(event: Event): void {
      const input = (event.target as HTMLInputElement).value.toLowerCase();
      if (input == "") {
        this.getDepartmentsByLocation(this.mappingForm.value.location);
      } else {
        this.filteredDepartmentList = this.departmentList.filter(department =>
          department.departmentName?.toLowerCase().includes(input)
        );
        this.departmentList = this.filteredDepartmentList;
      }
  
    }
    // Function for searching divisions
    onSearchDivision(event: Event): void {
      const input = (event.target as HTMLInputElement).value.toLowerCase();
      if (input == "") {
        this.getDivisionByDept(this.mappingForm.value.department)
      } else {
        this.filteredDivisionList = this.divisiomList.filter(division =>
          division.divisionName?.toLowerCase().includes(input)
        );
        this.divisiomList = this.filteredDivisionList;
      }
    }

  onSubmitHeirarchy(): void {
    const data = this.mappingForm.value;

    // Prepare the request payload
    const body = {
      userData: this.data.userData,
      Location: data.location,
      Department: data.department,
      Division: data.division,
    };
  
    if (this.mappingForm.valid) {
      this.userApi.MappingHeirarchyEmployee(body).subscribe(
        (result: any) => {

          if (result.status) {
            this.dialog.open(PopUpComponent, {
              data: {message: this.translate.instant('Hierarchymapping')},
              width: '350px',
            });
            this.closeDialog();
          }
        },
        (error) => {
          console.error("Error Adding Mapping:", error);
        }
      );
    } else {
      let errorMessage = 'Please fill all the required fields: ';
      if (this.mappingForm.get('location')?.invalid) errorMessage += 'Location, ';
      if (this.mappingForm.get('department')?.invalid) errorMessage += 'Department, ';
      if (this.mappingForm.get('division')?.invalid) errorMessage += 'Division, ';
      this.snackBar.open(errorMessage, 'Close', {
        duration: 3000,
        verticalPosition: 'top',
      });
    }
  }
   closeDialog(): void {
    this.dialogRef.close(false);
  }
  
}
