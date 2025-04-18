import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormsModule, FormBuilder, Validators, AbstractControl, ReactiveFormsModule, FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserMangerService } from '../../../core/services/userManger/user-manger.service';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';
import { UserManagerComponent } from '../../../configure/user-manager/user-manager.component';
import { SharedService } from '../../../core/shared/share.service';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';

// import { Component } from '@angular/core';
// import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
// import * as FileSaver from 'file-saver';
import saveAs from 'file-saver';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AnyCatcher } from 'rxjs/internal/AnyCatcher';
import { group } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { PopUpComponent } from '../pop-up/pop-up.component';


// import { AlertDialogComponent } from '../shared/dialogComponents/alert-dialog/alert-dialog.component';
@Component({
  selector: 'app-user-manger-alert',
  standalone: true,
  imports: [MatSelectModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule, FormsModule,
    HttpClientModule, TranslateModule, MatTooltipModule],
  templateUrl: './user-manger-alert.component.html',
  styleUrl: './user-manger-alert.component.css',
  providers: [UserMangerService,],
})
export class UserMangerAlertComponent implements OnDestroy {
  private subscription: Subscription;

  requiredHeaders = ['First Name', 'Middle Name', 'Last Name', 'Email', 'Phone Number', 'Username', 'Employee ID', 'Designation', 'Password']; // Predefined template headers
  errorMessage: any;
  userCounts: any = 0
  inserData: any = []

  // form: any = FormBuilder;
  myForm: any = FormGroup;
  uploadform: any = FormGroup;
  searchControl = new FormControl();
  userId: any;
  errorMessages: any = [];
  messages: any
  jsonDataArray: any = []
  headers: any
  updatepassowrd: any;
  selectedValue: string = '';
  options: any = []
  isPasswordVisible: boolean = false;
  filteredOptions: any
  filteredOptionsUpload: any
  searchTermOption: string = '';
  searchOptionupload: string = ''
  isAddingUser: boolean = true;


  // matdialoge: any;

  constructor(
    private add: FormBuilder,
    private dialogRef: MatDialogRef<UserMangerAlertComponent>,
    private dialog: MatDialog,
    private userMangerapi: UserMangerService,
    private snackBar: MatSnackBar,
    // public users: UserManagerComponent,
    private sharedService: SharedService,
    private matdialoge: MatDialog,
    @Inject(MAT_DIALOG_DATA)
    public data: { roleId: string, update: boolean, upload: any, roleName: any },
    private popUp: MatDialog
    // private dialogRef: MatDialogRef<UserUploadAlertComponent>,
    // private matdialoge: MatDialog,
    // form: any = FormBuilder
  ) {
    // for accesing the funtion from another component 
    this.subscription = this.sharedService.getUsersId$.subscribe(userId => {

      this.getUserId(userId);




    });
    this.myForm = this.add.group({
      // Administration: [data.roleName, Validators.required],
      FirstName: ['', [Validators.required, Validators.maxLength(50)]],
      SecondName: ['', [Validators.required, Validators.maxLength(50)]],
      PhoneNumber: ['', [Validators.required, Validators.pattern('^\\+?[0-9]{7,15}$')]],
      Designation: ['', [Validators.required, Validators.maxLength(30)]],
      MiddleName: '',
      Email: ['', Validators.email],
      // Extension: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6)]],
      EmployeeID: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(10)]],
      password: ['', this.data.update == true ? [Validators.required, Validators.minLength(4), Validators.maxLength(10)] : [Validators.minLength(4), Validators.maxLength(10)]],
      confirmPassword: ['', this.data.update == true ? Validators.required : []],
      username: ['', Validators.required],
      group: ['', Validators.required],


    },
      { validator: passwordMatchValidator('password', 'confirmPassword') }
    )
    this.uploadform = this.add.group({
      updloaddrop: ['', Validators.required],
    })


  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {

    this.getUserGroups()
    // this.myForm.get('group')?.valueChanges.subscribe((value: any) => {
    //   console.log('Selected Role ID:', value);
    // });

  }


  closeDialog(): void {
    this.dialogRef.close(true);
    this.sharedService.triggerGetUsers(this.data.roleId);
  }
  //form validation for insertion
  get f(): { [key: string]: AbstractControl } {


    return this.myForm.controls;
  }
  //submit form  insert users
  submitForm(update: any) {
    if (update === true) {

      if (this.myForm.valid) {
        // console.log(this.data.roleId, 'data');
        let body = {
          firstname: this.myForm.value.FirstName,
          middlename: this.myForm.value.MiddleName,
          lastname: this.myForm.value.SecondName,
          primaryEmail: this.myForm.value.Email,
          phone: this.myForm.value.PhoneNumber,
          // extension: this.myForm.value.Extension,
          roleId: this.myForm.value.group,
          roleName: this.myForm.value.Administration,
          designation: this.myForm.value.Designation,
          employeeID: this.myForm.value.EmployeeID,
          confirmPassword: this.myForm.value.confirmPassword,
          username: this.myForm.value.username
        }

        this.userMangerapi.inserUserGroups(body).subscribe((result: any) => {

          if (result.status == true) {

            // this.employemappingdialouge('New user added successfully', '117%');
            this.popUp.closeAll()
            this.closeDialog();
            const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: result.statusText } });

          }




        },
          (error: HttpErrorResponse) => {
            console.error('HTTP Error:1', error.error.statusText);

            if (Array.isArray(error.error.statusText)) {
              this.errorMessages = error.error.statusText;
            } else {
              // If it's not an array, convert it into an array
              this.errorMessages = [error.error.statusText];
            }

            this.messages = ''; // Initialize messages

            // Iterate over the error messages
            for (const errorMessage of this.errorMessages) {
              this.messages += `${errorMessage.message}`;
            }



            // setTimeout(() => {
            //   this.snackBar.open(this.messages, 'Close', {
            //     duration: 5000,
            //     verticalPosition: 'top'
            //   });
            // }, 1000);
            const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: error.error.statusText } });

          },


        )
        this.messages = ''
      } else {
        Object.keys(this.myForm.controls).forEach(field => {
          const control = this.myForm.get(field);
          control.markAsTouched({ onlySelf: true });
        });
      }
    } else {



      // console.log(this.myForm.value.password === null, 'valueee');
      if (!this.myForm.value.password === true || !this.myForm.value.confirmPassword === true) {
        this.myForm.value.confirmPassword = this.updatepassowrd;


      }



      if (this.myForm.valid) {

        let body = {
          firstname: this.myForm.value.FirstName,
          middlename: this.myForm.value.MiddleName,
          lastname: this.myForm.value.SecondName,
          primaryEmail: this.myForm.value.Email,
          phone: this.myForm.value.PhoneNumber,
          // extension: this.myForm.value.Extension,
          roleId: this.myForm.value.group,
          // roleName: this.myForm.value.Administration,
          designation: this.myForm.value.Designation,
          employeeID: this.myForm.value.EmployeeID,
          userId: this.userId,
          confirmPassword: this.myForm.value.confirmPassword || null,
          username: this.myForm.value.username
        }


        this.userMangerapi.updateUser(body).subscribe((result: any) => {


          if (result.status == true) {


            // this.employemappingdialouge('User updated successfully', '117%');

            this.closeDialog();
            const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: result.statusText } });

          }

        },
          (error: any) => {
            console.error('HTTP Error:', error);

            if (Array.isArray(error.statusText)) {
              // console.log('isarray');

              this.errorMessages = error.statusText;
            } else {
              console.log('is not array');
              // If it's not an array, convert it into an array
              this.errorMessages = [error.statusText];
            }

            this.messages = ''; // Initialize messages
            console.log("this.errorMessages", this.errorMessages);

            // Iterate over the error messages
            for (const errorMessage of this.errorMessages) {
              this.messages += `${errorMessage.message},`;
            }


            // setTimeout(() => {
            //   this.snackBar.open(this.messages, 'Close', {
            //     duration: 5000,
            //     verticalPosition: 'top'
            //   });
            // }, 1000);

            this.dialog.open(PopUpComponent, {
              width: "500px",
              height: "290px",
              data: { message: this.messages },
            });

          },


        )
        this.messages = ''

      } else {
        Object.keys(this.myForm.controls).forEach(field => {
          const control = this.myForm.get(field);
          control.markAsTouched({ onlySelf: true });
        });
      }

    }

  }
  //excel upload 
  employemappingdialouge(message: string, height: string) {
    this.matdialoge.open(AlertDialogComponent, {
      disableClose: true,
      width: '350px',
      data: {
        message: message,
        clickedStatus: 'activeD',
        height: height
      }

    })
  }
  //fecting users by userid for updation
  getUserId(userId: any) {

    this.userId = userId;
    let body = { userId: userId }
    this.userMangerapi.getUserGroupId(body).subscribe((result: any) => {

      if (result.status == true) {


        this.myForm.patchValue({

          FirstName: result.data['firstname'],
          SecondName: result.data['lastname'],
          PhoneNumber: result.data['phone'],
          Designation: result.data['designation'],
          MiddleName: result.data['middlename'],
          Email: result.data['primaryEmail'],
          // Extension: result.data['extension'],
          EmployeeID: result.data['employeeID'],
          username: result.data['username'],
          group: result.data['roleId']


        });
        this.updatepassowrd = result.data['password']
      }

    })
  }
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];

    // You can perform further actions with the selected file, such as uploading it to a server
  }
  //close dialogue box
  // closeDialog(): void {
  //   this.dialogRef.close();
  // }
  // for download the template 
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
    saveAs(blob, `User Template.xlsx`); // Customize filename
  }
  //for the selecting the file
  onFileChange(event: any): void {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
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
      // this.userCounts = valuesOnly.length
      let empty = false
      // Check if the data array is empty or contains only empty rows
      if (!data || data.length === 0 || data.every(row => row.length === 0 || row.every(cell => !cell))) {
        empty = true
      }


      this.validateHeaders(data[0], empty);
      this.headers = data[0];
      if (this.errorMessage == null) {



        this.userCounts = valuesOnly.length


        for (let index = 0; index < valuesOnly.length; index++) {
          this.inserData.push([valuesOnly[index]])


        }
        console.log('Excel Values Only:', this.inserData);
        // this.insertDatafuntion(this.inserData, data[0])

      } else {
        this.userCounts = 0
      }




    };


    reader.readAsBinaryString(target.files[0]);
  }

  // Method to validate headers
  validateHeaders(headers: any[], empty: boolean): void {
    if (!empty) {
      const missingHeaders = this.requiredHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length) {
        this.errorMessage = `Invalid file`;
        console.log(`Missing headers: ${missingHeaders.join(', ')}`);
        // this.employemappingdialouge(`Missing headers: ${missingHeaders.join(', ')}`, '150px')
        const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "300px", data: { message: `Invalid file` } });

      } else {
        this.errorMessage = null;
        console.log('All required headers are present');
      }
    } else {
      this.errorMessage = "The Excel file is empty.";
    }
  }
  // employemappingdialouge(message: string) {
  //   this.matdialoge.open(AlertDialogComponent, {
  //     disableClose: true,
  //     width: '350px',
  //     height: '120px',
  //     data: {
  //       message: message,
  //       clickedStatus: 'activeD'
  //     }

  //   })
  // }

  // insertDatafuntion() {
  //   // console.log(this.uploadform.value.updloaddrop,'value');
  //   if (this.uploadform.value.updloaddrop) {
  //     if (this.inserData.length == 0) {
  //       if (this.errorMessage) {
  //         // this.employemappingdialouge(this.errorMessage, '117%');
  //         const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "300px", data: { message: 'Excel cannot be empty' } });
  //       }
  //       else {
  //         // this.employemappingdialouge('Select the Excel file', '117%');
  //         const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: 'Select the Excel file' } });
  //       }
  //     } else {

  //       this.inserData.forEach((element: any) => {
  //         // console.log(element[0], 'elemtnt');
  //         const mappedResults = element.map((result: any) => {



  //           return {
  //             firstname: result[0],
  //             middlename: result[1],
  //             lastname: result[2],
  //             primaryEmail: result[3],
  //             phone: result[4],
  //             extension: result[5],
  //             username: result[6],
  //             employeeID: result[7],
  //             designation: result[8],
  //             password: result[9],
  //             confirmPassword: result[9],
  //             roleId: this.uploadform.value.updloaddrop
  //           };

  //         });
  //         this.jsonDataArray = this.jsonDataArray.concat(mappedResults);



  //       });


  //       let body = { 'excelKeys': this.headers, 'datas': this.jsonDataArray}

  //       this.userMangerapi.fileUploadUsers(body).subscribe((result: any) => {

  //         if (result.status == true) {
  //           // this.employemappingdialouge(`Users Added Succesfully`, '150px')
  //           // this.closeDialog()
  //           const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: result.statusText } });

  //         } else {
  //           // this.employemappingdialouge(`Failed`, '150px')
  //           const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: result.statusText } });

  //         }


  //       },
  //         (error: HttpErrorResponse) => {
  //           console.error('HTTP Error:', error);

  //           this.errorMessages = error.error.statusText

  //           console.log(this.messages, 'messages');

  //           const dialogRef = this.popUp.open(PopUpComponent, {
  //             width: "500px", height: "250px",
  //             data: { message: this.errorMessages }
  //           });


  //           // setTimeout(() => {
  //           //   this.snackBar.open(this.errorMessages, 'Close', {
  //           //     duration: 5000,
  //           //     verticalPosition: 'top'
  //           //   });
  //           // }, 1000);

  //         },
  //       );
  //     }
  //   } else {
  //     const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: 'User group is not selected' } });

  //   }
  // }



  insertDatafuntion() {
    if (this.uploadform.value.updloaddrop) {
      if (this.inserData.length == 0) {
        const message = this.errorMessage ? 'Excel cannot be empty' : 'Select the Excel file';
        this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message } });
      } else {
        this.jsonDataArray = [];

        this.inserData.forEach((element: any) => {
          const mappedResults = element.map((result: any) => {
            return {
              firstname: result[0],
              middlename: result[1],
              lastname: result[2],
              primaryEmail: result[3],
              phone: result[4],
              // extension: result[5],
              username: result[5],
              employeeID: result[6],
              designation: result[7],
              password: result[8],
              confirmPassword: result[8],
              roleId: this.uploadform.value.updloaddrop
            };
          });
          this.jsonDataArray = this.jsonDataArray.concat(mappedResults);
        });

        let body = { 'excelKeys': this.headers, 'datas': this.jsonDataArray };

        this.userMangerapi.fileUploadUsers(body).subscribe(
          (result: any) => {


            let message = "";


            message = `✅ User(s) added successfully`;
            return new Promise<boolean>((resolve) => {
              this.dialog.closeAll()
              const dialogRef = this.popUp.open(PopUpComponent, {
                width: "500px",
                height: "300px",
                data: { message, showCloseButton: true }
              });

              setTimeout(() => {
                dialogRef.close(true);
                resolve(true); // Ensures the function returns `true` after closing
              }, 5000);
            });
          },
          (error) => {
            this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: error.error.statusText } });
          }
        );

      }
    } else {
      this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: 'User group is not selected' } });
    }
  }


  getUserGroups() {
    this.userMangerapi.getUserRolesgroups({}).subscribe((result: any) => {
      // console.log(result, 'reduso');

      if (result.status == true) {
        this.options = result.groups
        this.filteredOptions = this.options;
        this.filteredOptionsUpload = this.options
        // console.log(this.options,'dfdfdf');

        // this.availableGroupName = result.groups
      }
    }, (error) => {
      console.log(error, 'error');
      // reomve token when unauthorized access
      // if (error.status === 403) {
      //   // opens dialog for logout message
      //   this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } })
      // }
      // else if (error.status === 401) {
      //   this.router.navigateByUrl('')
      //   // this.dialogRef.open(LogoutSpinnerComponent,{data:{clickedType:'logOut'}})
      // }
    })
  }
  filterOptions(searchTerm: string) {

    this.filteredOptions = this.options.filter((item: any) =>
      item.roleName.toLowerCase().includes(searchTerm.toLowerCase())
    );


  }
  filteredOptionsUploads(searchText: string) {



    this.filteredOptionsUpload = this.options.filter((item: any) =>
      item.roleName.toLowerCase().includes(searchText.toLowerCase())
    );
  }

}



export function passwordMatchValidator(password: string, confirmPassword: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const passwordControl = control.get(password);
    const confirmPasswordControl = control.get(confirmPassword);
    // console.log(passwordControl, confirmPasswordControl, 'confroooeroerioehfidhfoidh');


    if (!passwordControl || !confirmPasswordControl) {
      return null; // Form controls are not yet available
    }

    const passwordValue = passwordControl.value;
    const confirmPasswordValue = confirmPasswordControl.value;

    // If both fields are empty, no validation errors should be set
    if (passwordValue && !confirmPasswordValue) {
      confirmPasswordControl.setErrors({ required: true });
    }
    // Only validate if both fields have values
    if (passwordValue && confirmPasswordValue && passwordValue !== confirmPasswordValue) {
      confirmPasswordControl.setErrors({ passwordMismatch: true });
    } else {
      confirmPasswordControl.setErrors(null);
    }

    return null;
  };

}