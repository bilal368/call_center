import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { StationmonitoringService } from '../../../core/services/stationmonitor/stationmonitoring.service';
import { RecorderserviceService } from '../../../core/services/recorderSettings/recorderservice.service';
import { SharedService } from '../../../core/shared/share.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { PopUpComponent } from '../../../shared/dialogComponents/pop-up/pop-up.component';

@Component({
  selector: 'app-mediaproxysettings',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, FormsModule, MatMenuModule, MatCheckboxModule, MatFormFieldModule, MatTooltipModule, MatSelectModule, MatIconModule, MatButtonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule, MatSortModule, MatInputModule, HttpClientModule, TranslateModule],
  templateUrl: './mediaproxysettings.component.html',
  styleUrl: './mediaproxysettings.component.css'
})
export class MediaproxysettingsComponent {
  constructor(
    private add: FormBuilder,
    private dialog: MatDialog,
    private stationmonitor: StationmonitoringService,
    private recorderserive: RecorderserviceService,
    private matdialoge: MatDialog,
    private sharedService: SharedService,
    private exportService: SharedService,
    private snackBar: MatSnackBar,
    private popUp: MatDialog,
  ) {


  }
  ngOnInit(): void {


    this.myForm = this.add.group({
      DataPath: new FormControl(Validators.required),
      localip: new FormControl(),
      sessionport: new FormControl(),
      freeswitchport: new FormControl(),
      mediaforward: new FormControl(),
      freeswitchportreturn: new FormControl(),
      avayaactive: new FormControl(),
      logstatus: new FormControl(),
      ipch: new FormControl(),
      log: '0',
      setasextesion: new FormControl()
    })

    // this.getChannelDatas()
    this.recorderserive.getMediaproxyData({}).subscribe((result: any) => {
      if (result) {
        this.myForm.patchValue({
          DataPath: result.data.DATA_PATH || '/opt/app/DATA',
          localip: result.data.LOCAL_IP || '172.18.0.4',
          sessionport: result.data.SESSION_PORT || '8029',
          freeswitchport: result.data.FREESWITCH_PORT || '5080',
          mediaforward: result.data.MEDIA_FORWARD_IP || '172.18.0.3',
          freeswitchportreturn: result.data.FREESWITCH_RETURN_PORT || '5060',
          avayaactive: result.data.AVAYA_ACTIVE || '0',
          logstatus: result.data.LOGGER_STATUS || 'Off',
          ipch: result.data.IPCH || '10',
          log: result.data.LOG,
          setasextesion: result.data.SET_EXT_AS_AGENT || '1'
        })
      }
    })
  }
  myForm: any = FormGroup;
  savebutton() {
    if (this.myForm.valid) {
      let body = { body: this.myForm.getRawValue() }
      this.recorderserive.insertMediaproxysettings(body).subscribe((result: any) => {
        if (result.status == true) {
          const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: 'Media proxy settings added successfully.' } });

        } else {
          // this.snackBar.open(result.statusText, 'Close', {
          //   duration: 5000,
          //   verticalPosition: 'top'
          // });
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: result.statusText },
          });
        }

      })
    }



  }
  totalNumberChannles: any
  ngAfterViewInit(): void {
    // Ensure the initial state is set after the view has been initialized
    this.recorderserive.fetchlicenseData().subscribe((res: any) => {
      if (res.totalNumberChannels) {
        this.totalNumberChannles = res.totalNumberChannels
        this.myForm.get('ipch')?.patchValue(this.totalNumberChannles);
        this.myForm.controls['ipch'].disable();
      }
    })
  }
}
