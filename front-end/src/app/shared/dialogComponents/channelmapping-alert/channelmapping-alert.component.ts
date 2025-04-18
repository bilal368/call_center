import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
// import * as FileSaver from 'file-saver';
import saveAs from 'file-saver';
import { StationmonitoringService } from '../../../core/services/stationmonitor/stationmonitoring.service';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';
import { SharedService } from '../../../core/shared/share.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RecorderserviceService } from '../../../core/services/recorderSettings/recorderservice.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PopUpComponent } from '../pop-up/pop-up.component';
import { forkJoin, Observable } from 'rxjs';
@Component({
  selector: 'app-channelmapping-alert',
  standalone: true,
  imports: [ReactiveFormsModule, HttpClientModule, MatTooltipModule],
  templateUrl: './channelmapping-alert.component.html',
  styleUrl: './channelmapping-alert.component.css',
  providers: [StationmonitoringService, SharedService, RecorderserviceService]
})
export class ChannelmappingAlertComponent implements OnInit {
  mappingForm: any = FormGroup;
  didLabelingForm: any = FormGroup;
  requiredHeaders = ['Channel', 'Extension', 'Password'];
  requiredHeadersDID = ['DID Number', 'DID Label'];

  errorMessage: any;
  headers: any
  inserData: any = []
  userCounts: any;
  dataSource: any;
  successCount: any = 0;
  failureCount: any = 0;
  totalRequests: any = this.inserData.length;
  showPassword: boolean = false;
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { excel: boolean, element: any,didLabeling:any },
    private dialogRef: MatDialogRef<ChannelmappingAlertComponent>,
    private add: FormBuilder,
    private stationmonitor: StationmonitoringService,
    private matdialoge: MatDialog,
    private sharedService: SharedService,
    private recorderserive: RecorderserviceService,
    private snackBar: MatSnackBar,
    private popUp: MatDialog,
    public dialog: MatDialog,
  ) {

    this.didLabelingForm = this.add.group({
      didNumber: new FormControl('', [
        Validators.required, 
        Validators.pattern('^[0-9]{1,7}$') // Allows only numbers with a max of 7 digits
      ]),
      didLabel: new FormControl('', [
        Validators.required, 
        Validators.pattern('^[a-zA-Z0-9 ]+$') // Allows letters, numbers, and spaces
      ]),
      recorderTypeId: new FormControl(4, [])
    });
    


  }
  ngOnInit(): void {
    this.mappingForm = this.add.group({
      channels: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$'),]),
      Extension: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$'),]),
      Password: new FormControl('', Validators.required)




    })
    if (this.data.excel == true && this.data.element) {
      this.updatefuntion()
    }
    if (this.data.didLabeling == true && this.data.element) {
      this.updatefuntionDID()
    }
    // this.getChannelMapp()

  }
  updatefuntion() {

    this.mappingForm.patchValue({
      channels: this.data.element.channel,
      Extension: this.data.element.mappedExtensionMacIP,
      Password: this.data.element.password

    })
  }
updatefuntionDID(){



  this.didLabelingForm.patchValue({
    didNumber:this.data.element.didNumber,
    didLabel:this.data.element.didLabel
  })
  this.didLabelingForm.get('didNumber').disable()
}
  closeDialog(): void {
    this.mappingForm.reset();
    this.dialogRef.close();
  }
  savebutton() {
    if (this.data.excel == true && this.data.element == null) {
      if (this.mappingForm.valid) {
        let body = { 'channel': this.mappingForm.value.channels, 'extension': this.mappingForm.value.Extension, 'password': this.mappingForm.value.Password }
        this.recorderserive.channelMapping(body).subscribe((result: any) => {
          if (result.status == true) {
            const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: 'Channel mapped  successfully' } });


            this.closeDialog();

          }

        },
          (error) => {
            // Handle API or network error
            console.error('Error in channel mapping:', error.error.message);
            const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: error.error.message } });
          }
        )
      }
    } else {
      if (this.mappingForm.valid) {
        let body = { 'channel': this.mappingForm.value.channels, 'extension': this.mappingForm.value.Extension, 'password': this.mappingForm.value.Password, recorderChannelMappingId: this.data.element.recorderChannelMappingId }
        this.recorderserive.updateChannelmapping(body).subscribe((result: any) => {
          // console.log(result);
          if (result.status == true) {
            const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: result.message } });

            this.closeDialog();

          }

        },
          (error) => {
            // Handle API or network error
            console.error('Error in channel mapping:', error.error.message);
            const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: error.error.message } });
          }
        )
      }
    }

  }
  saveDidLabel(){
    if (this.data.didLabeling == true && this.data.element == null) {
      // Add new DID labeling 
      if (this.didLabelingForm.valid) {
        this.recorderserive.saveDIDlabel(this.didLabelingForm.value).subscribe((result: any) => {
          if (result.status == true) {
            const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: 'DID labelled  successfully' } });


            this.closeDialog();

          }

        },
          (error) => {
            // Handle API or network error
            console.error('Error in DID labelling:', error);
            const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: error.error.message } });
          }
        )
      }
    } else {
      // Edit DID labeling 
      if (this.didLabelingForm.valid) {
        let body = { ...this.didLabelingForm.value, didLabelingId: this.data.element.didLabelingId }
        this.recorderserive.updateDIDlabel(body).subscribe((result: any) => {
          // console.log(result);
          if (result.status == true) {
            const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: result.message } });

            this.closeDialog();

          }

        },
          (error) => {
            // Handle API or network error
            console.error('Error in DID labelling::', error.error.message);
            const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: error.error.message } });
          }
        )
      }
    }
  }
  generateTemplate(fileType: 'channel' | 'did') {
    const headers = fileType === 'channel' ? this.requiredHeaders : this.requiredHeadersDID;
    const filename = fileType === 'channel' ? 'Avaya Recorder Channel Mapping Template.xlsx' : 'DidLabelTemplate.xlsx';
  
    const worksheet = XLSX.utils.json_to_sheet([], { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, fileType === 'channel' ? 'Avaya Recorder Channel Mapping' : 'DID Labeling');
  
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
  }
  

  //for the selecting the file
  onFileChange(event: any, fileType: 'channel' | 'did'): void {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
  
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
  
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
  
      const data = <any[][]>XLSX.utils.sheet_to_json(ws, { header: 1 });
      const valuesOnly = data.slice(1); // Skip headers
      let empty = !data || data.length === 0 || data.every(row => row.length === 0 || row.every(cell => !cell));
  
      // Select headers based on fileType
      const expectedHeaders = fileType === 'channel' ? this.requiredHeaders : this.requiredHeadersDID;
      
      this.validateHeaders(data[0], empty, expectedHeaders);
      this.headers = data[0];
  
      if (this.errorMessage == null) {
        this.userCounts = valuesOnly.length;
        this.inserData = valuesOnly.map((row) => [row]); // Store data dynamically
      } else {
        this.userCounts = 0;
      }
    };
  
    reader.readAsBinaryString(target.files[0]);
  }
  

  // Method to validate headers
  validateHeaders(headers: any[], empty: boolean, expectedHeaders: string[]): void {
    if (!empty) {
      const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length) {
        this.errorMessage = `Invalid file: Missing headers - ${missingHeaders.join(', ')}`;
      } else {
        this.errorMessage = null;
      }
    } else {
      this.errorMessage = "The Excel file is empty.";
    }
  }
  
  employemappingdialouge(message: string, height: string) {
    this.matdialoge.open(AlertDialogComponent, {
      disableClose: true,
      width: '350px',
      // height: '101px',
      data: {
        message: message,
        clickedStatus: 'activeD',
        height: height
      }

    })
  }
  requests: Observable<any>[] = [];
  hasInvalidExtension = false;
  insertDataMappingMultiple(fileType: 'channel' | 'did') {
    if (this.inserData.length == 0) {
      this.employemappingdialouge(this.errorMessage || 'Select the Excel file', '117%');
      return;
    }
  
    this.requests = []; // Reset request list
    this.hasInvalidExtension = false;
  
    this.inserData.forEach((element: any) => {
      if (fileType === 'channel') {
        // Validate and send to Channel Mapping API
        if (typeof element[0][1] === "number" && !isNaN(element[0][1])) {
          let body = { 'channel': element[0][0], 'extension': element[0][1], 'password': element[0][2] };
          this.requests.push(this.recorderserive.channelMapping(body));
        } else {
          this.hasInvalidExtension = true;
        }
      } else if (fileType === 'did') {
        // Validate and send to DID Labeling API
        let body = { 'didNumber': element[0][0], 'didLabel': element[0][1],recorderTypeId:4 };
        this.requests.push(this.recorderserive.saveDIDlabel(body));
      }
    });
  
    if (this.requests.length > 0) {
      forkJoin(this.requests).subscribe(
        (results: any[]) => {
          this.successCount = results.filter(result => result?.status === true).length;
          this.failureCount = results.length - this.successCount;
          let message = this.successCount > 0
            ? `${this.successCount} ${fileType === 'channel' ? 'channels' : 'DID labels'} mapped successfully`
            : "All requests failed!";
  
          this.dialog.open(PopUpComponent, { width: "500px", height: "290px", data: { message } });
          this.closeDialog();
        },
        (error) => {
          this.dialog.open(PopUpComponent, { width: "500px", height: "290px", data: { message: error.error.message } });
        }
      );
    }
  
    if (this.hasInvalidExtension) {
      this.dialog.open(PopUpComponent, { width: "500px", height: "290px", data: { message: "Extension must be a number" } });
    }
  }
  
}
