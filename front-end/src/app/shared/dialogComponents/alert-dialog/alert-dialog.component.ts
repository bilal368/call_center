import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../../core/services/user/user.service';
import { SharedService } from '../../../core/shared/share.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PopUpComponent } from '../pop-up/pop-up.component';
import { ExtMappingPopupComponent } from '../ext-mapping-popup/ext-mapping-popup.component';



@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatToolbarModule, MatTooltipModule, FormsModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  providers: [UserService,],
  templateUrl: './alert-dialog.component.html',
  styleUrl: './alert-dialog.component.css'

})
export class AlertDialogComponent implements OnInit {
  selectedFile: File | undefined;
  inserData: any[][] = [];
  errorMessage: string | undefined;
  userCounts: any = 0;
  excelName: string = '';
  templateName: string = ''
  headers: any[] | undefined;
  jsonDataArray: any = []
  clickedStatus: any;
  nextClick: boolean = false;
  requiredHeaders = ['FirstName', 'SecondName', 'PhoneNumber', 'Designation', 'MiddleName', 'Email', 'Extension', 'EmployeeID', 'Agent ID']; // Predefined template headers
  extenionHeaders: any = ['Extension', 'EmployeeID'];
  usersNumber: any = 343
  constructor(@Inject(MAT_DIALOG_DATA) public data: { message: string, clickedStatus: string, height: string, roleId: any, userData: any, selectroleName: any },
    private matDialog: MatDialog,
    private dialog: MatDialog,
    private sharedService: SharedService,
    public matdialoge: MatDialogRef<AlertDialogComponent>,
    private userApi: UserService,
    private popUp: MatDialog

  ) {

  }


  toolTips: any = {
    cancel: 'Menu.ALERTS MANAGEMENT.Common.CANCEL',
    close: 'Menu.ALERTS MANAGEMENT.Common.CLOSE',
    Download: "Menu.ALERTS MANAGEMENT.Common.DOWNLOAD"
  }
  employemappingdialouge(message: string, height: string) {
    this.matDialog.open(AlertDialogComponent, {
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

  ngOnInit(): void {
    this.clickedStatus = this.data.clickedStatus;
    if (this.clickedStatus === "extensionUpload") {
      this.requiredHeaders = ['Extension', 'Employee ID'];
      this.excelName = 'Extension Mapping Template';
      this.templateName = 'Extension Mapping Template'
    } else {
      this.requiredHeaders = ['First Name', 'Middle Name', 'Last Name', 'Email', 'Phone Number', 'Designation', 'Employee ID', 'Agent ID']; // Predefined template headers
      this.excelName = 'Employee_template';
    }
  }
  onNoClick() {
    this.matdialoge.close()
  }
  onYesClick() {
    this.matdialoge.close({
      confirmed: true,
      roleName: this.data.selectroleName
    })
  }
  closedialogue() {
    this.matdialoge.close(this.data.selectroleName)
  }
  closedialogue1() {
    this.matdialoge.close((true))
  }
  onConfirm(): void {
    this.matdialoge.close(true);
  }
  onCancel(): void {
    this.matdialoge.close(false);
  }
  //excel upload 
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    console.log(file);
  }
  // for download the template
  validateHeaders(headers: any[], empty: boolean): void {
    if (!empty) {
      const missingHeaders = this.requiredHeaders.filter((header: any) => !headers.includes(header));

      if (missingHeaders.length) {
        this.errorMessage = `Missing headers: ${missingHeaders.join(', ')}`;
        this.popUp.open(PopUpComponent,{
          width: "500px",
          height: "300px",
          data: { message: 'Invalid Excel' }
        })
      } else {
        this.errorMessage = undefined;
      }
    } else {
      this.errorMessage = "The Excel file is empty.";
    }
  }

  generateTemplate() {
    let date = new Date
    let currentDate;
    currentDate = date.getUTCDate();
    const emptyRow = { name: '', email: '', phone: '' }; // Empty row structure
    const templateData = [''];
    const worksheet = XLSX.utils.json_to_sheet(templateData, {
      header: this.requiredHeaders  // Set column headers
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'User Template');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, this.excelName + `${currentDate}.xlsx`); // Customize filename
  }
  generateEmployeeTemplate() {
    let date = new Date();
    let currentDate;
    currentDate = date.getUTCDate();

    const templateData = ['']; // Initialize template data
    const worksheet = XLSX.utils.json_to_sheet(templateData, {
      header: this.requiredHeaders  // Set column headers
    });

    // Set column widths for headers
    worksheet['!cols'] = [
      { wch: 20 }, // Width for 'First Name'
      { wch: 20 }, // Width for 'Middle Name'
      { wch: 20 }, // Width for 'Last Name'
      { wch: 30 }, // Width for 'Email'
      { wch: 15 }, // Width for 'Phone Number'
      { wch: 15 }, // Width for 'Extension'
      { wch: 25 }, // Width for 'Designation'
      { wch: 15 }, // Width for 'Employee ID'
      { wch: 15 }  // Width for 'Agent ID'
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Template');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(blob, this.excelName + `${currentDate}.xlsx`); // Customize filename
  }

  //for the selecting the file
  onFileChange(event: any): void {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');

    // // Check if any file is selected
    if (!target.files || target.files.length !== 1) {
      this.popUp.open(PopUpComponent, {
        width: "500px",
        height: "300px",
        data: { message: 'Please select a valid Excel file.' }
      });
      return;
    }

    const file = target.files[0];

    // Validate file type
    const validFileTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validFileTypes.includes(file.type)) {
      this.popUp.open(PopUpComponent, {
        width: "500px",
        height: "300px",
        data: { message: 'Invalid file. Please upload an Excel file.' }
      });
      return;
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      /* Read workbook */
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      /* Grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* Save data */
      const data = <any[][]>XLSX.utils.sheet_to_json(ws, { header: 1 });

      const valuesOnly = data.slice(1); // Skip the first row (headers)
      let empty = false
      // Check if the data array is empty or contains only empty rows
      if (!data || data.length === 0 || data.every(row => row.length === 0 || row.every(cell => !cell))) {
        empty = true
      }

      this.validateHeaders(data[0], empty);
      this.headers = data[0];
      if (this.errorMessage == undefined) {
        this.userCounts = valuesOnly.length
        for (let index = 0; index < valuesOnly.length; index++) {
          this.inserData.push([valuesOnly[index]])
        }
      } else {
        this.userCounts = 0
      }
     
    };
    reader.readAsBinaryString(target.files[0]);
  }

  showErrorPopup(message: string) {
    console.log("message:",message);
    const dialogRef = this.popUp.open(PopUpComponent, {
      width: "500px",
      height: "300px",
      data: { message: message }
    });
  }

  //file upload function

  insertDatafuntion() {

    // Check if the file is empty before proceeding
    if (!this.inserData || this.inserData.length === 0) {
        this.popUp.open(PopUpComponent, {
            width: "500px",
            height: "300px",
            data: { message: 'The Excel file is empty. Please upload a valid Excel file.' }
        });
        return; // Exit the function early
    }

    // Check if the Excel structure is incorrect
    if (!Array.isArray(this.inserData) || this.inserData.some(row => !Array.isArray(row))) {
        this.popUp.open(PopUpComponent, {
            width: "500px",
            height: "300px",
            data: { message: 'Invalid Excel file format. Please upload a valid structured Excel file.' }
        });
        return; // Exit the function early
    }

    // Ensure required headers exist in the file
    if (!this.requiredHeaders || this.requiredHeaders.length === 0 || !this.headers) {
        this.popUp.open(PopUpComponent, {
            width: "500px",
            height: "300px",
            data: { message: 'Invalid Excel file. Missing required headers.' }
        });
        return;
    }

    // Check if the first row (headers) matches expected headers
    const missingHeaders = this.requiredHeaders.filter(header => !this.requiredHeaders.includes(header));
    if (missingHeaders.length > 0) {
        this.popUp.open(PopUpComponent, {
            width: "500px",
            height: "300px",
            data: { message: `Invalid Excel file. Missing headers: ${missingHeaders.join(', ')}` }
        });
        return;
    }

    // Prepare the data to be sent to the backend
    this.inserData.forEach((element: any) => {
        const mappedResults = element.map((result: any) => {
            return {
                firstname: result[0] !== undefined ? result[0] : "",  
                middlename: result[1] !== undefined ? result[1] : "",
                lastname: result[2] !== undefined ? result[2] : "",
                primaryEmail: result[3] !== undefined ? result[3] : "",
                phone: result[4] !== undefined ? result[4] : "",
                designation: result[5] !== undefined ? result[5] : "",
                employeeID: result[6] !== undefined ? result[6] : "",
                agentcode: result[7] !== undefined ? result[7] : "",
            };
        });

        this.jsonDataArray = this.jsonDataArray.concat(mappedResults);
    });

    // Validation for empty rows: Check if all rows contain empty values
    const hasValidData = this.jsonDataArray.some((row: any) =>
        Object.values(row).some((value) => value !== "")
    );

    if (!hasValidData) {
        this.popUp.open(PopUpComponent, {
            width: "500px",
            height: "300px",
            data: { message: 'Excel file contains only empty rows. Please upload a valid file.' }
        });
        return; // Exit the function early
    }

    let body = { excelKeys: this.requiredHeaders, datas: this.jsonDataArray };

    // Call the API to upload data
    this.userApi.fileUploadEmployees(body).subscribe(
        (result: any) => {
            if (result.status === true) {
                // Success case
                this.popUp.open(PopUpComponent, {
                    width: "500px",
                    height: "300px",
                    data: { message: 'Employee(s) added successfully.' }
                });
                this.closeDialog();
            } else if (result.errors && result.errors.length > 0) {
                // Handle validation errors
                this.handleValidationErrors(result.errors);
            } else {
                // Generic failure message
                this.popUp.open(PopUpComponent, {
                    width: "500px",
                    height: "300px",
                    data: { message: `Failed: ${result.statusText}` }
                });
            }
        },
        (error) => {
            // Handle HTTP error responses from the backend
            if (error.status === 400) {
                this.popUp.open(PopUpComponent, {
                    width: "500px",
                    height: "300px",
                    data: { message: `Failed: ${error.error.statusText}` }
                });
            } else {
                this.popUp.open(PopUpComponent, {
                    width: "500px",
                    height: "300px",
                    data: { message: `An error occurred while uploading data: ${error.error.statusText}` }
                });
            }
        }
    );
}

  handleValidationErrors(errors: any[]) {
    // Map errors to specific rows and cells
    errors.forEach((error) => {
      const rowIndex = error.rowIndex; // Row index from the backend
      error.errors.forEach((errorMessage: string, errorIndex: number) => {
        // Log or highlight the specific cell
        console.error(
          `Row ${rowIndex}, Cell ${errorIndex + 1}: ${errorMessage}`
        );

        // Optionally, mark the corresponding cell in the UI
        const cellElement = document.querySelector(
          `.data-row-${rowIndex} .data-cell-${errorIndex + 1}`
        );
        if (cellElement) {
          cellElement.classList.add("error-cell");
          cellElement.setAttribute("title", errorMessage); // Add tooltip for detailed error
        }
      });
    });
  }
  closeDialog(): void {
    this.matdialoge.close();
    this.sharedService.triggerGetUsers(this.data.roleId);
  }
  insertExtDatafuntion() {
  // Check if the Excel structure is incorrect
  if (!Array.isArray(this.inserData) || this.inserData.some(row => !Array.isArray(row))) {
      this.popUp.open(PopUpComponent, {
          width: "500px",
          height: "300px",
          data: { message: 'Invalid Excel file format. Please upload a valid structured Excel file.' }
      });
      return; // Exit the function early
  }
// Check if the file is empty before proceeding
if (!this.inserData || this.inserData.length === 0 || this.inserData.every(row => row.length === 0)) {
  this.popUp.open(PopUpComponent, {
    width: "500px",
    height: "300px",
    data: { message: 'The Excel file is empty. Please upload a valid Excel file.' }
  });
  return; // Exit the function early
}

  // Ensure required headers exist in the file
  if (!this.requiredHeaders || this.requiredHeaders.length === 0 || !this.headers) {
      this.popUp.open(PopUpComponent, {
          width: "500px",
          height: "300px",
          data: { message: 'Invalid Excel file. Missing required headers.' }
      });
      return;
  }

  // Check if the first row (headers) matches expected headers
  const missingHeaders = this.requiredHeaders.filter(header => !this.requiredHeaders.includes(header));
  if (missingHeaders.length > 0) {
      this.popUp.open(PopUpComponent, {
          width: "500px",
          height: "300px",
          data: { message: `Invalid Excel file. Missing headers: ${missingHeaders.join(', ')}` }
      });
      return;
  }



    this.inserData.forEach((element: any) => {
      const mappedResults = element.map((result: any) => {
        return {
          extension: result[0],
          employeeID: result[1],
        };
      });
      this.jsonDataArray = this.jsonDataArray.concat(mappedResults);
    });
     // Validation for empty rows: Check if all rows contain empty values
     const hasValidData = this.jsonDataArray.some((row: any) =>
     Object.values(row).some((value) => value !== "" && value != undefined)
 );

 if (!hasValidData) {
     this.popUp.open(PopUpComponent, {
         width: "500px",
         height: "300px",
         data: { message: 'Excel file contains only empty rows. Please upload a valid file.' }
     });
     return; // Exit the function early
 }
    let body = { 'excelKeys': this.requiredHeaders, 'datas': this.jsonDataArray }
    this.userApi.fileUploadExtension(body).subscribe(
      (result: any) => {

        if (result.message === "success") {
          // Success case
          this.employemappingdialouge(`Extension(s) assigned successfully`, "150px");
          this.closeDialog();
        }
        else if (result.message === "Extensions already exist") {
          this.dialog.open(ExtMappingPopupComponent, {
            data: {
              userData: result.existingExtensions,
              clickedStatus: 'importStatus',
              action: 'Replace',
              heading: 'Do you want to replace the mapping'
            },
            height: '72vh',
            width: '52vw',
            panelClass: 'custom-dialog' // Add custom class here    
          }).afterClosed().subscribe((res: any) => {
            if (res == true) {
              // this.employemappingdialouge(`Extension(s) replace successfully`, "150px");
              this.closeDialog();
            } else {
              this.closeDialog();
            }
          })
          //  this.employemappingdialouge(`Failed:Extension `+result.extension+` is already exist`, "150px");
        }
        else if (result.message === "Invalid Employee IDs") {
          this.dialog.open(ExtMappingPopupComponent, {
            data: {
              userData: result.invalidEmployeeIDs,
              clickedStatus: 'importStatus',
              action: 'Skip',
              uploadedData: this.jsonDataArray,
              heading: 'Few employee ID(s) are not present in the system.Skip to continue'
            },
            height: '72vh',
            width: '52vw',
            panelClass: 'custom-dialog' // Add custom class here    
          }).afterClosed().subscribe((res: any) => {
          //  if(res){
          //   this.employemappingdialouge(`Extension(s) skiped successfully `, "150px");
          //  }
          this.closeDialog();
          })
        }
        else if (result.errors && result.errors.length > 0) {
          // Handle validation errors
          this.handleValidationErrors(result.errors);
        } else {
          // Generic failure message
          console.error("Failed to upload extension:", result.statusText);
          this.employemappingdialouge(`Failed: ${result.statusText}`, "150px");
        }
      },
      (error) => {
        // Handle HTTP error responses from the backend
        if (error.status === 400) {
          console.error("Validation Error:", error.error.statusText);
          this.employemappingdialouge(`Failed: ${error.error.statusText}`, "150px");
        } else {
          // Handle any other type of error
          console.error("Error during file upload:", error);
          this.employemappingdialouge(
            `An error occurred while uploading data: ${error.error.statusText}`,
            "150px"
          );
        }
      }
    );


  }

}
