import { Component, Inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { UserService } from '../../../core/services/user/user.service';
import { HttpClient } from '@angular/common/http';
import { AlertDialogComponent } from '../../../shared/dialogComponents/alert-dialog/alert-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
HttpClient
interface TableData {

}
@Component({
  selector: 'app-ext-mapping-popup',
  standalone: true,
  imports: [FormsModule, TranslateModule,MatTableModule, ReactiveFormsModule, MatDialogModule, MatTooltipModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatAutocompleteModule],
  templateUrl: './ext-mapping-popup.component.html',
  providers: [UserService],
  styleUrl: './ext-mapping-popup.component.css'
})

export class ExtMappingPopupComponent {
  myForm: FormGroup;
  mappingForm: FormGroup;
  extensionList: any[] = [];
  agentList: any[] = [];
  locationList: any[] = [];
  departmentList: any[] = [];
  divisiomList: any[] = [];
  employeeList: any[] = [];
  dataTable: TableData[] = [];
  searchText: string = '';
  checkMessage: string = '';
  searchId: string = "";
  filteredExtensionList: any[] = this.extensionList;
  filteredLocationList: any[] = this.locationList;
  filteredDivisionList: any[] = this.extensionList;
  filteredDepartmentList: any[] = this.locationList;
  filteredEmployeeList: any[] = this.employeeList;
  btnStatus:boolean = false;
  seletedId: any = '';
  selectedEmployeeName: string = "";
  pagedData: TableData[] = [];
  toolTips: any;
  selection = new SelectionModel<TableData>(true, []);
  displayedColumns: string[] = [ 'Extension','EmployeeID'];
  constructor(
    public dialog: MatDialog,
    private userApi: UserService,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<ExtMappingPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      uploadedData(arg0: string, userData: any, arg2: string, uploadedData: any): unknown;
action: any;
heading: any; userData: any, clickedStatus: string 
},
    private snackBar: MatSnackBar,
  ) {
    this.myForm = this.formBuilder.group({
      extension: ['', [Validators.required]],
      location: ['', [Validators.required]],
      department: ['', [Validators.required]],
      division: ['', [Validators.required]],
      employeeID: [''],
      employeeName: [''],
      searchText: [''],
      locationText: [''],
      employeeText: ['']
    });
    this.mappingForm = this.formBuilder.group({
      location: ['', [Validators.required]],
      department: ['', [Validators.required]],
      division: ['', [Validators.required]],
    })
  }
  ngOnInit() {
    this.fetchDta();
  }
  closeDialog(): void {
    this.dialogRef.close(false);
  }
  replace(): void {
    let body ={datas:this.data.userData}
            this.userApi.updateFileUploadedExtension(body).subscribe(
              (result: any) => {
                if (result.message === "success") {
                  this.employemappingdialouge(`Extension(s) assigned successfully”`, "150px");
                  this.dialogRef.close(true);
                 
                } else if(result.message==="invalid"){
                  this.data.userData = result.extension;
                  this.data.heading ="invalid employeeeId";
                  this.btnStatus = true;
                }          
              })
  //  this.dialogRef.close(true);
  }
  skip() {
    // Convert objects to arrays
    const userDataArray = Object.values(this.data.userData) as { extension: any; employeeID: any }[];
    const uploadedDataArray = Object.values(this.data.uploadedData) as { extension: any; employeeID: any }[];
    // Remove common data
    const filteredArray = uploadedDataArray.filter(
      (item2) =>
        !userDataArray.some(
          (item1) =>
            item1.extension === item2.extension && item1.employeeID === item2.employeeID
        )
    );
    let body = { 'excelKeys': '', 'datas': filteredArray}
    this.userApi.fileUploadExtension(body).subscribe(
      (result: any) => {
        if (result.message === "success") {
          // Success case
          // this.employemappingdialouge(`Extension(s) skiped successfully`, "150px");
          this.closeDialog();
        }
        else if(result.message === "Extensions already exist"){
          this.dialog.open(ExtMappingPopupComponent, {
            data: {
              userData: result.existingExtensions,
              clickedStatus: 'importStatus',
              action:'Replace',
              heading:'Do you want to replace the mapping'
            },
            height: '72vh',
            width: '52vw',
            panelClass: 'custom-dialog' // Add custom class here    
          }).afterClosed().subscribe((res: any) => {
             if(res==true){       
              this.closeDialog();
             }else{
              this.employemappingdialouge(`Extension(s) replace Failed`, "150px");
             }
          })
        }
        else{
        }
      }
    )
  }
  employemappingdialouge(message: string, height: string) {
    this.dialog.open(AlertDialogComponent, {
      disableClose: true,
      width: '350px',
      // height: '130px',
      data: {
        message: message,
        clickedStatus: 'activeD',
        height: height
      }

    })
  }
  //form validation for insertion
  get f(): { [key: string]: AbstractControl } {


    return this.myForm.controls;
  }
  get f1(): { [key: string]: AbstractControl } {
    return this.mappingForm.controls;
  }
  fetchDta() {  
    this.userApi.getMappingDetails().subscribe(
      (result: any) => {
        this.extensionList = result.extensions;
        this.locationList = result.location;
        this.employeeList = result.getEmployees;
        if (this.data.clickedStatus === 'edit') {
          this.extensionList = [];
          this.employeeList = [{
            userId: this.data.userData.employeeID, 
            employeeID: this.data.userData.employeeID 
          }];
          this.extensionList.push({ 
            extensionId: this.data.userData.extensionId, 
            extensionNumber: this.data.userData.extensionNumber 
          });
  
          this.getDepartmentsByLocation(this.data.userData.locationId);
          this.getDivisionByDept(this.data.userData.departmentId);
          this.myForm.patchValue({
            extension: this.data.userData.extensionNumber,
            location: this.data.userData.locationId,
            department: this.data.userData.departmentId,
            division: this.data.userData.divisionId,
            employeeID: this.data.userData.employeeID, // Check this log
           employeeName: this.data.userData.employeeName
          });
        }
       
      }
    );
  }
  departmentAndEmployeeList(body:any) {
    this.userApi.getDepartmentByLocation(body).subscribe((result: any) => {
      if (result && result.status && Array.isArray(result.Data)) {
        this.departmentList = result.Data;
       this.employeeList = result.employeeList;
        this.employeeList = (result.employeeList || []).filter((employee: { employeeID: null; }) => employee.employeeID !== null);
        this.selectedEmployeeName = "";

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
  getDepartmentsByLocation(locationId: any) {
    this.myForm.get('department')?.setValue(null); // Clear department
    this.myForm.get('division')?.setValue(null); 
    this.myForm.get('employeeID')?.setValue(null); 
    this.myForm.get('employeeName')?.setValue(null); 
    let body = { locationId: locationId };
   this.departmentAndEmployeeList(body);
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
  getEmployeeByID(id: any) {
    let body = { userID: id };
    this.userApi.getEmployeesByUserID(body).subscribe((result: any) => {
      if (result) {
        this.selectedEmployeeName = result.Data[0].firstname + " " + result.Data[0].lastname;// Update department items with fetched data
      } else {
        console.error('Failed to fetch employeeName:', result);
        this.selectedEmployeeName = ""; // Clear departments or handle error as needed
      }
    },
      (error) => {
        console.error('Error fetching employeeName:', error);
        this.selectedEmployeeName = ""; // Clear departments or handle error as needed
      }
    );
  }
  onSubmit(): void {
    const formValue = this.myForm.value;
    // Ensure fields are explicitly set to null if they are empty
    const payload = {
      extension: formValue.extension,
      location: formValue.location || null,
      department: formValue.department || null,
      division: formValue.division || null,
      employeeID: formValue.employeeID || null,
      employeeName: formValue.employeeName || null,
      searchText: formValue.searchText || null,
      locationText: formValue.locationText || null,
      employeeText: formValue.employeeText || null
    };
    const selectedExtension = this.extensionList.find(ext => ext.extensionId === formValue.extension);
   // if (this.myForm.get('extension')?.value) { // Validate only the extension field
      if (this.data.clickedStatus === 'add') {
        payload.extension = selectedExtension.extensionNumber;
        this.addExtension(payload);
      } else {
        this.updateExtension(payload);
      }
  }
  addExtension(body: any) {
    if (this.myForm.valid) {  // Check if the entire form is valid
      this.userApi.addExtension(body).subscribe(
        (result: any) => {
          if (result.status === true) {
            this.snackBar.open(`Extension mapping added successfully`, 'Close', {
              duration: 3000,
              verticalPosition: 'top'
            });
            this.closeDialog();
          }
        },
        error => {
          console.error("Error adding extension", error);
        }
      );
    } else {
      // If the form is not valid, show error message for the specific invalid field
      let errorMessage = 'Please fill all the required fields: ';
      if (this.myForm.get('extension')?.invalid) errorMessage += 'Extension, ';
      if (this.myForm.get('location')?.invalid) errorMessage += 'Location, ';
      if (this.myForm.get('department')?.invalid) errorMessage += 'Department, ';
      if (this.myForm.get('division')?.invalid) errorMessage += 'Division, ';

      // Remove last comma and space
      errorMessage = errorMessage.slice(0, -2);

      this.snackBar.open(errorMessage, 'Close', {
        duration: 3000,
        verticalPosition: 'top'
      });
    }
  }
  updateExtension(body: any) {
    console.log("form:",this.myForm.value);
    if (this.myForm.valid) {
    this.userApi.updateExtension(body).subscribe((result: any) => {
      if (result.status === true) {
        this.snackBar.open(`Extension mapping updated successfully`, 'Close', {
          duration: 3000,
          verticalPosition: 'top'
        });

        this.closeDialog();
      }
    }, error => {
      console.error("Error adding extension", error);
    });
  }
  else {
    // If the form is not valid, show error message for the specific invalid field
    let errorMessage = 'Please fill all the required fields: ';
    if (this.myForm.get('extension')?.invalid) errorMessage += 'Extension, ';
    if (this.myForm.get('location')?.invalid) errorMessage += 'Location, ';
    if (this.myForm.get('department')?.invalid) errorMessage += 'Department, ';
    if (this.myForm.get('division')?.invalid) errorMessage += 'Division, ';

    // Remove last comma and space
    errorMessage = errorMessage.slice(0, -2);

    this.snackBar.open(errorMessage, 'Close', {
      duration: 3000,
      verticalPosition: 'top'
    });
  }
  }
  onSubmitHeirarchy(): void {
    let data = this.mappingForm.value;
   const body={Extension:this.data.userData,Location:data.location,Department:data.department,Division:data.division}

   if (this.mappingForm.valid) {
     this.userApi.mappingHierarchy(body).subscribe(
       (result: any) => {
         if (result.status === true) {
           this.snackBar.open(`Hierarchy applied successfully`, 'Close', {
             duration: 3000,
             verticalPosition: 'top'
           });
           this.closeDialog();
         }
       },
       error => {
         console.error("Error adding extension", error);
       }
     );
   } else {
     let errorMessage = 'Please fill all the required fields: ';
     if (this.myForm.get('location')?.invalid) errorMessage += 'Location, ';
     if (this.myForm.get('department')?.invalid) errorMessage += 'Department, ';
     if (this.myForm.get('division')?.invalid) errorMessage += 'Division, ';
   }


 }
  // Function for searching extensions
  onSearchExtension(event: Event): void {
    const input = (event.target as HTMLInputElement).value.toLowerCase();
    if (!input) {
      this.fetchDta();
      return;
    }
    this.filteredExtensionList = this.extensionList.filter(extension =>
      extension.extensionNumber?.toLowerCase().includes(input)
    );
    this.extensionList = this.filteredExtensionList;

    if (this.extensionList.length === 0) {
      this.checkMessage = "To add this extension, press the Enter key on your keyboard";
    }
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
      this.getDepartmentsByLocation(this.myForm.value.location);
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
      this.getDivisionByDept(this.myForm.value.department)
    } else {
      this.filteredDivisionList = this.divisiomList.filter(division =>
        division.divisionName?.toLowerCase().includes(input)
      );
      this.divisiomList = this.filteredDivisionList;
    }
  }
  // Function for searching employees
  onSearchEmployee(event: Event): void {
    const input = (event.target as HTMLInputElement).value.toLowerCase();
    if (input == "") {
     let body = { locationId: this.myForm.value.location };
     this.departmentAndEmployeeList(body);
    } else {
      this.filteredEmployeeList = this.employeeList.filter(employee =>
        String(employee.employeeID)?.toLowerCase().includes(input)
      );
      this.employeeList = this.filteredEmployeeList;
    }
  }
  displayFun(event: any) {
    const input = (event.target as HTMLInputElement).value.trim();
    if (input !== '') {
      this.isExists(input);
    
    }
  }
  isExists(extensionNumber: string){
    const body ={extensionNumber:extensionNumber}
    this.userApi.isExtensionExists(body).subscribe(
      (result: any) => {
        if(result.message =="Extensions already exist"){
          this.snackBar.open(`Extension already exists.`, 'Close', {
            duration: 3000,
            verticalPosition: 'top'
          });
          return;
        }else{
          this.selectInputAsExtension(extensionNumber);
        }
      })
  }
  selectInputAsExtension(extensionNumber: string) {
    if (extensionNumber.trim() === '' || !/^\d+$/.test(extensionNumber)) {
      // You can also add an error message or dialog here to inform the user
      this.snackBar.open(`Extension number must be numeric!!`, 'Close', {
        duration: 3000,
        verticalPosition: 'top'
      });

      return;
    }

    
    const message='Are you sure you want to add this extension?'
    this.dialog.open(ConfirmationDialogComponent, {
      data:{clickedStatus: "add",message},
    }).afterClosed().subscribe((result:any)=>{

      if(result == true){
        let body = { excelKeys: '', datas: [{extension:extensionNumber,employeeID:''}] };
        this.userApi.fileUploadExtension(body).subscribe(
          (result: any) => {
            if(result.message == "success"){
              this.extensionList.push(result.Data);
              this.myForm.patchValue({
                extension: result.Data.extensionId
               })
               this.snackBar.open(`Extension  added successfully`, 'Close', {
                duration: 3000,
                verticalPosition: 'top'
              });
            }
            else if(result.message =="Extensions already exist"){
              this.snackBar.open(`Extension already exists.`, 'Close', {
                duration: 3000,
                verticalPosition: 'top'
              });
        
              return;
            } else if (result.errors && result.errors.length > 0) {
            } else {
              console.error("Failed to upload extension:", result.statusText);
            }
          },
          (error) => {
            console.error("Error during file upload:", error);
          }
        );
      }
    })

}
}
