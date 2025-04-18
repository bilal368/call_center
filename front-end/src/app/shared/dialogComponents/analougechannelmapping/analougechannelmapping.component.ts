import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { StationmonitoringService } from '../../../core/services/stationmonitor/stationmonitoring.service';
import { SharedService } from '../../../core/shared/share.service';
import { RecorderserviceService } from '../../../core/services/recorderSettings/recorderservice.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PopUpComponent } from '../pop-up/pop-up.component';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';
import { HttpClientModule } from '@angular/common/http';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-analougechannelmapping',
  standalone: true,
  imports: [ReactiveFormsModule, HttpClientModule, MatTooltipModule, MatButtonModule, MatCheckboxModule, MatMenuModule, MatToolbarModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './analougechannelmapping.component.html',
  styleUrl: './analougechannelmapping.component.css',
  providers: [RecorderserviceService]
})
export class AnalougechannelmappingComponent {
  mappingForm: any = FormGroup;
  randomNumber = Math.random();
  requiredHeaders = ['Channel', 'Extension/Mac/IP', 'Password'];
  errorMessage: any;
  headers: any
  inserData: any = []
  userCounts: any;
  dataSource: any;
  successCount: any = 0;
  failureCount: any = 0;
  totalRequests: any = this.inserData.length;
  disable = false
  toolTips: any = {
    savebutton: 'Save channel mapping'
  }
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { excel: boolean, extension: any, element: any },
    private dialogRef: MatDialogRef<AnalougechannelmappingComponent>,
    private add: FormBuilder,
    private stationmonitor: StationmonitoringService,
    private matdialoge: MatDialog,
    private sharedService: SharedService,
    private recorderserive: RecorderserviceService,
    private snackBar: MatSnackBar,
    private popUp: MatDialog
  ) {
    console.log(data.extension, 'datatconlsoe');


  }
  ngOnInit(): void {


    this.mappingForm = this.add.group({
      channels: new FormControl('', Validators.required),
      Gain: new FormControl('3', Validators.required),
      Voltage: new FormControl('28', Validators.required),
      Ring: new FormControl('2', Validators.required),
      Delay: new FormControl('5', Validators.required),
      Control: new FormControl('VOLTAGE', Validators.required),
      Voice: new FormControl('0', Validators.required),
      Storage: new FormControl('WAV', Validators.required),
      Bargein: new FormControl('6', Validators.required),
      Codec: new FormControl('GSM', Validators.required),
      // Password: new FormControl('', Validators.required)




    })
    if (this.data.extension == 'All') {
      this.mappingForm.controls['channels'].disable();
    }
    this.mappingForm.controls['Voice'].disable();
    this.mappingForm.controls['Delay'].disable();



    // this.getChannelMapp()
    this.updatefuntion()
    console.log(this.mappingForm.get('Control')?.value);


  }
  onSelectionChange(event: any) {
    console.log('Selected value:', event.value);
    if (event.value == 'VOLTAGE') {
      this.mappingForm.controls['Voice'].disable();
      this.mappingForm.controls['Delay'].disable();

    } else {
      this.mappingForm.controls['Voice'].enable();
      this.mappingForm.controls['Delay'].enable();
    }
  }

  updatefuntion() {

    this.mappingForm.patchValue({
    })


  }
  closeDialog(): void {
    this.mappingForm.reset();
    this.dialogRef.close();

    
  }
  savebutton() {
 
    if (this.mappingForm.valid) {

      let body = {
        "ChannelId":this.randomNumber,
        "Channel": this.mappingForm.value.channels,
        "VOLTAGE": this.mappingForm.value.Voltage,
        "BARGEIN": this.mappingForm.value.Bargein,
        "GAIN": this.mappingForm.value.Gain,
        "CONTROL": this.mappingForm.get('Control')?.value,
        "STORAGE": this.mappingForm.get('Storage')?.value,
        "CODEC": this.mappingForm.get('Codec')?.value,
        "CALLERID_RINGCOUNT": this.mappingForm.value.Ring,
        "MINIMUM_VOICE_ENERGY": this.mappingForm.value.Voice,
        "SILENCE_DURATION": this.mappingForm.value.Delay
      }
     
      this.recorderserive.channelsettingsinsertanalouge({channelData:body, channelId: this.randomNumber }).subscribe((result: any) => {
        this.dialogRef.close();
        const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: result.messages } });
      },
        (error) => {
          // Handle API or network error
          console.error('Error in channel mapping:', error.error.message);
          const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: error.error.message } });
        }
      )

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
              this.popUp.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: { message: "Channel mapped  successfully"},
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
            this.popUp.open(PopUpComponent, {
              width: "500px",
              height: "290px",
              data: { message: error.error.message},
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
