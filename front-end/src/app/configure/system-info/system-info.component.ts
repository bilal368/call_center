import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SystemInfoServices } from '../../core/services/systemInfo/systemInfo-service.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subscription } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DataArchiveComponent } from './data-archive/data-archive.component';

import { PopUpComponent } from '../../shared/dialogComponents/pop-up/pop-up.component';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { Router } from '@angular/router';
import { AutoDeleteComponent } from "./auto-delete/auto-delete.component";
import { AuthService } from '../../core/services/authentication/auth.service';
import { CallReportService } from '../../core/services/callReport/call-report.service';
import {  MailSettingsComponent } from "./mail-settings/mail-settings.component";
@Component({
  selector: 'app-system-info',
  standalone: true,
  imports: [TranslateModule, DataArchiveComponent, ReactiveFormsModule, ClipboardModule, CommonModule, FormsModule, MatTooltipModule, AutoDeleteComponent, MailSettingsComponent],
  templateUrl: './system-info.component.html',
  styleUrl: './system-info.component.css'
})

export class SystemInfoComponent implements OnInit {
  toolTips: any = {
    preview:
      'Menu.CONFIGURE.SYSTEM MANAGEMENT.Preview'
  }
  logoChangeSubscription: any = Subscription;
  subItems: any = [
    { name: 'Registration Details', label: 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Registration Details' },
    { name: 'Mail Settings', label: 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Mail Settings.NAME' },
    { name: 'Data Archive', label: 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Data Archive.NAME' },
    { name: 'Auto Delete', label: 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Auto Delete.NAME' },
    

  ]
  isEditMode: boolean = false
  buildDiv: string = 'Mail Settings'
  customerForm = this.Form.group({
    organizationName: ['', Validators.required],
    address1: ['', Validators.required],
    city: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', Validators.required],
    serialKey: ['',],
    address2: ['', Validators.required],
    state: ['', Validators.required],
    fax: ['', Validators.required],
    website: ['', Validators.required],
    token: ['']

  })
  constructor(
    private Form: FormBuilder,
    private dialogRef: MatDialog,
    private systemAPI: SystemInfoServices,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    public dialog: MatDialog,
    private router: Router,
    private authService: AuthService,
    private callReportApi: CallReportService
  ) {
    this.customerForm.get('serialKey')?.disable()
    this.customerForm.get('token')?.disable()

  }
  ngOnInit(): void {

    this.getLogoName()
    this.getRegistrationDetails()
    // change detection without ngZone :ng zone only uses
    this.logoChangeSubscription = this.systemAPI.logoChangedStatus$.subscribe((result: any) => {
      if (result === true) {
        this.getLogoName()
      }
    })
  }
  divFunction(item: any) {
    this.buildDiv = item
    if (this.buildDiv == 'Registration Details') {
      this.getRegistrationDetails()
    }
    if (this.buildDiv == 'Data Archive') {
      const moduleName = "SYSTEM MANAGEMENTRMATION";
      const action = "READ";
      const actionDescription = "Data Archive Settings accessed";
      this.callReportApi.updateAuditTrailReport(moduleName, action, actionDescription).subscribe((res: any) => { })
    }
  }
  toggleEditMode() {
    this.isEditMode = true
  }
  getRegistrationDetails() {
    // API call to get registration details
    this.systemAPI.getRegistrationDetails().subscribe((result: any) => {
      if (result.status == true) {
        this.customerForm.patchValue(result.data)

      }
    }, (Error) => {
      console.error(Error.statusText)
      // Handle specific error statuses
      if (Error.status === 403) {
        this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' }, disableClose: true });
      } else if (Error.status === 401) {
        this.router.navigateByUrl(''); // Redirect to login if unauthorized
      } else {
        console.error("An unexpected error occurred:", Error);
      }
    })

  }
  saveRegistration() {
    // API call to save registration details
    this.systemAPI.saveRegistration(this.customerForm.value).subscribe((result: any) => {
      if (result.status == true) {
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: `Registration details are updated Successfully` },
        });
      }
    }, (Error) => {
      console.error(Error)

    })
  }

  saveChanges() {
    this.isEditMode = false
    if (this.customerForm.valid) {
      this.saveRegistration()
    } else {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: 'Please fill all the fields' },
      });
    }
  }


  // logo update
  currentFile?: File;
  message = '';
  preview = '';

  imageInfos?: Observable<any>;


  uploadedLogoUrl: string | null = null;
  logoUploadStarted: boolean = false;
  selectFile(event: any): void {
    this.message = '';
    this.preview = '';

    const selectedFiles = event.target.files;
    if (!selectedFiles || !selectedFiles.length) return;

    const file = selectedFiles[0];
    if (!file) return;

    this.preview = '';
    this.currentFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoUploadStarted = true
      this.preview = e.target?.result as string;
      this.validateFile(file);
    };
    reader.readAsDataURL(file);
  }
  validated: boolean = false
  private validateFile(file: File): void {
    const maxSize = 1024 * 1024; // 1MB
    const minDimensions = { width: 100, height: 100 };
    // const aspectRatio = 1; // 1:1 aspect ratio

    if (file.size > maxSize) {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: 'File size exceeds the maximum allowed size of 1MB' },
      });
      return;
    }

    const imageData = this.preview;
    const image = new Image();
    image.src = imageData;
    image.onload = () => {
      const width = image.width;
      const height = image.height;

      if (width < minDimensions.width || height < minDimensions.height) {

        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: 'Logo image must be at least 100x100 pixels' },
        });
        return;
      }
      this.validated = true
    };
    this.upload()
  }

  upload(): void {
    if (this.currentFile) {
      const formData = new FormData();
      formData.append('file', this.currentFile);
      console.log(formData);

      formData.append('global', 'false');
      formData.append('originalname', 'newLogo');


      // const headers = new HttpHeaders();
      // headers.append('Content-Type', 'multipart/form-data');

      this.systemAPI.upload(formData).subscribe({
        next: (event: any) => {
          if (event.status == true) {

            setTimeout(() => {
              // this.snackbar.open('Logo upload completed', 'Close', {
              //   duration: 3000,
              //   verticalPosition: 'top',

              // })
              this.dialog.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: { message: 'Logo upload completed' },
              });
              this.systemAPI.logoChanged.next(true) //for change detection
              this.logoUploadStarted = false
            }, 3000)
          }
          if (event instanceof HttpResponse) {
            this.message = event.body.message;
            const logoURL = localStorage.getItem('logoURL')
            // this.imageInfos = logoURL||undefined
          }
        },
        error: (err: any) => {
          console.log("Error>", err);
          if (err.status = 406) {
            const msg = this.translate.instant('Menu.CONFIGURE.SYSTEM MANAGEMENT.Logo Upload.alert1');
            // Complete registration before uploading logo
            // this.snackbar.open(msg, 'Close', {
            //   verticalPosition: 'top',
            //   horizontalPosition:'center'
            // });
            this.dialog.open(PopUpComponent, {
              width: "500px",
              height: "290px",
              data: { message: msg },
            });
          }
          if (err.error && err.error.message) {
            this.message = err.error.message;
          } else {
            this.message = 'Could not upload the image!';
          }
        },
        complete: () => {
          this.currentFile = undefined;
        },
      });

    }
  }
  logoName: string = ''
  logoUrl: string = ''
  getLogoName() {
    this.systemAPI.getLogoName().subscribe((result: any) => {
      if (result.status == true) {
        this.logoName = result.logoImageFileName

        localStorage.setItem('logoName', this.logoName)
        // call function to get logo from server
        this.getLogoImage()

      }
    }, (Error) => {
      console.log(Error);

    })
  }
  getLogoImage() {
    this.systemAPI.getFiles(this.logoName).subscribe((blob: any) => {
      const objectURL = URL.createObjectURL(blob);
      this.logoUrl = objectURL;  // Assign the Blob URL to logoUrl to display the image

    }, (Error) => {
      console.log(Error);

    })
  }


}
