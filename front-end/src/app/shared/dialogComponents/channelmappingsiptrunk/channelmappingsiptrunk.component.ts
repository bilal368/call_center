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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PopUpComponent } from '../pop-up/pop-up.component';
@Component({
  selector: 'app-channelmappingsiptrunk',
  standalone: true,
  imports: [ReactiveFormsModule, HttpClientModule, MatTooltipModule],
  templateUrl: './channelmappingsiptrunk.component.html',
  styleUrl: './channelmappingsiptrunk.component.css',
  providers: [StationmonitoringService, SharedService, RecorderserviceService, MatSnackBar]
})
export class ChannelmappingsiptrunkComponent {
  mappingForm: any = FormGroup;
  requiredHeaders = ['Channel', 'Extension/Mac/IP'];
  errorMessage: any;
  headers: any
  inserData: any = []
  userCounts: any;
  dataSource: any;
  successCount: any = 0;
  failureCount: any = 0;
  totalRequests: any = this.inserData.length;
  toolTips: any = {
    savebutton: 'Save channel mapping'
  }
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { excel: boolean, extension: any, element: any },
    private dialogRef: MatDialogRef<ChannelmappingsiptrunkComponent>,
    private add: FormBuilder,
    private stationmonitor: StationmonitoringService,
    private matdialoge: MatDialog,
    private sharedService: SharedService,
    private recorderserive: RecorderserviceService,
    private snackBar: MatSnackBar,
    private popUp: MatDialog,
    public dialog: MatDialog,
  ) {
  }
  ngOnInit(): void {

    this.mappingForm = this.add.group({
      channels: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$'),]),
      Extension: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$'),]),
      // Password: new FormControl('', Validators.required)




    })
    this.updatefuntion()

  }
  updatefuntion() {

    this.mappingForm.patchValue({
      channels: this.data.element.channel,
      Extension: this.data.element.mappedExtensionMacIP,
    })


  }
  closeDialog(): void {
    this.mappingForm.reset();
    // this.employemappingdialouge('New user added successfully');
    this.dialogRef.close();

    // this.sharedService.triggerGetUsers(this.data.roleId);
  }
  savebutton() {
    console.log(this.data.extension,'extesnsion');
    
    if (this.data.excel == true && this.data.element == null) {
      if (this.mappingForm.valid) {

        let body = { 'channel': this.mappingForm.value.channels, 'extension': this.mappingForm.value.Extension,type:this.data.extension }

        this.recorderserive.channelmappingsiptrunk(body).subscribe((result: any) => {

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
        let body = { 'channel': this.mappingForm.value.channels, 'extension': this.mappingForm.value.Extension, recorderChannelMappingId: this.data.element.recorderChannelMappingId }
        this.recorderserive.updatechannelsiptrunk(body).subscribe((result: any) => {
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
  generateTemplate() {
    let date = new Date
    let currentDate;
    currentDate = date.getUTCDate();



    const templateData = [''];

    const worksheet = XLSX.utils.json_to_sheet(templateData, {
      header: this.requiredHeaders  // Set column headers
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SIP Recorder Channel Mapping');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `SIP Trunk Recorder Channel Mapping Template.xlsx`); // Customize filename
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
      let empty = false
      // Check if the data array is empty or contains only empty rows
      if (!data || data.length === 0 || data.every(row => row.length === 0 || row.every(cell => !cell))) {
        empty = true
      }
      // this.userCounts = valuesOnly.length
      // console.log(this.userCounts,'counts');



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
      const missingHeaders = this.requiredHeaders.filter((header: any) => !headers.includes(header));
      if (missingHeaders.length) {
        this.errorMessage = `Invalid file`;
        console.log(`Missing headers: ${missingHeaders.join(', ')}`);
        // this.employemappingdialouge(`Missing headers: ${missingHeaders.join(', ')}`, '150px')
        this.inserData = []
      } else {
        this.errorMessage = null;
        console.log('All required headers are present');
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
  insertdatamappinmutiple() {

    if (this.inserData.length == 0) {
      if (this.errorMessage) {
        this.employemappingdialouge(this.errorMessage, '117%');
      }
      else {
        this.employemappingdialouge('Select the Excel file', '117%');
      }
      //     this.closeDialog();
    } else {
      this.inserData.forEach((element: any) => {
        console.log(element[0][1], 'elemmenennettntn');
        let body = { 'channel': element[0][0], 'extension': element[0][1], 'password': element[0][2] }
        this.recorderserive.channelmappingsiptrunk(body).subscribe(
          (result: any) => {
            // Success response handling
            if (result.status === true) {
              this.successCount++;
              // this.snackBar.open("Channel mapped  successfully", 'Close', {
              //   duration: 5000,
              //   verticalPosition: 'top'
              // });
              this.dialog.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: { message: "Channel(s) mapped  successfully" },
              });
              this.closeDialog();
            } else {
              this.failureCount++;
            }
          },
          (error) => {
            // Error handling logic
            // this.snackBar.open(error.error.message, 'Close', {
            //   duration: 5000,
            //   verticalPosition: 'top'
            // });
            this.dialog.open(PopUpComponent, {
              width: "500px",
              height: "290px",
              data: { message: error.error.message },
            });
            console.error('Error occurred:', error.error.message);
            // Optional: Increment a count, display an error message, or log the error
            this.failureCount++;
            // this.showErrorMessage("An error occurred during channel mapping.");
          }
        );


      });
    }



    //   if (this.successCount + this.failureCount === this.totalRequests) {
    //     this.employemappingdialouge('New Channel is added successfully', '117%');
    //     this.closeDialog();
    //   }
  }

}
