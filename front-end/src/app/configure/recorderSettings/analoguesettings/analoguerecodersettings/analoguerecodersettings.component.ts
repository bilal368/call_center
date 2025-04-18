import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { RecorderserviceService } from '../../../../core/services/recorderSettings/recorderservice.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PopUpComponent } from '../../../../shared/dialogComponents/pop-up/pop-up.component';
import { MatDialog } from '@angular/material/dialog';
import { AnalougechannelmappingComponent } from '../../../../shared/dialogComponents/analougechannelmapping/analougechannelmapping.component';
import { TranslateModule } from '@ngx-translate/core';
import { VoltageenergygraphComponent } from "../voltageenergygraph/voltageenergygraph.component";
import { SharedService } from '../../../../core/shared/share.service';
import { ConfirmationDialogComponent } from '../../../../shared/dialogComponents/confirmation-dialog/confirmation-dialog.component';
export interface UserData {
  recorderChannelMappingId: string;
  channel: string;
  mappedExtensionMacIP: string;
  password: string;
}
let ELEMENT_DATA: UserData[] = [
  // { id: '1', Channel: 'Hydrogen', extension: '80', password: 'lightblue' },
  // { id: '2', Channel: 'Helium', extension: '70', password: 'yellow' },
  // more data
];

@Component({
  selector: 'app-analoguerecodersettings',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, FormsModule, MatMenuModule, MatCheckboxModule, MatFormFieldModule, MatTooltipModule, MatSelectModule, MatIconModule, MatButtonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule, MatSortModule, MatInputModule, HttpClientModule, TranslateModule, VoltageenergygraphComponent],
  templateUrl: './analoguerecodersettings.component.html',
  styleUrl: './analoguerecodersettings.component.css',
  providers: [RecorderserviceService]
})
export class AnaloguerecodersettingsComponent implements OnInit {
  myForm: any = FormGroup;
  downloadData: any = []
  dataLoaded = false;
  displayedColumns: string[] = ['select', 'Channel', 'extension', 'controler', 'bergin', 'ring', 'action'];
  dataSource = new MatTableDataSource<UserData>(ELEMENT_DATA);
  selectAll = false;
  alldata: any = []
  limit: any = 10;
  offset: any = 0;
  totalPages = 1;
  currentPage = 1;
  TotalRecords: number = 10;
  constructor(

    private add: FormBuilder,
    private recorderserive: RecorderserviceService,
    private snackBar: MatSnackBar,
    private popUp: MatDialog,
    private dialog: MatDialog,
    private exportService: SharedService,
    private matdialoge: MatDialog
  ) {

  }
  ngOnInit(): void {
    this.loadData()
    this.getChannelDatas()
    this.myForm = this.add.group({
      DataPath: new FormControl('/opt/app/DATA', Validators.required),
      Voltage: new FormControl(),
      ACH: new FormControl(),
      chindex: new FormControl(),
      mediafwdip: new FormControl(),
      mediaproxy: new FormControl(),
      Misscall: new FormControl(),
      Enablevoice: ['1'],
      codec: new FormControl('A-Law'),
      logstatus: new FormControl(),
      ipch: new FormControl('10'),
      log: '0',
      Maxfilesize: new FormControl(),
      extension: ['All']
    })
    this.recorderserive.getsettingsDataAngloue({}).subscribe((result: any) => {
      if (result) {
        this.myForm.patchValue({
          DataPath: result.data.DATADRIVE || '/opt/app/DATA',
          Voltage: result.data.VOLTAGE_CAPTURE || 0,
          ACH: result.data.ACH || 8,
          mediaproxy: result.data.MEDIA_PROXY_IP || '172.18.0.4',
          mediafwdip: result.data.MEDIA_FORWARD_IP || '172.18.0.3',
          chindex: result.data.CHINDEX || '001',
          Misscall: result.data.MISSCALL || 0,
          Enablevoice: result.data.ENABLEVOICEFILESPLIT || 1,
          logstatus: result.data.LOGGER_STATUS || 'Off',
          log: result.data.LOG || 0,
          Maxfilesize: result.data.MAXFILESIZE || 5,
        })
      }
    })

  }
  getChannelDatas() {
    const body = { limit: this.limit, offset: this.offset }
    this.recorderserive.getChannelsettingsDataAnalogue(body).subscribe((result: any) => {




      if (result.status == true) {
        if (result.data.channelData) {
          this.dataSource = new MatTableDataSource<UserData>(ELEMENT_DATA);
          this.dataSource = result.data.channelData;
          this.alldata = result.data.channelData
          console.log(this.dataSource, 'datatsoruce');

        }

        // this.dataSource = new MatTableDataSource<UserData>(ELEMENT_DATA);
        // this.dataSource = result.data;
        // this.alldata = result.data


        // this.TotalRecords = result.count;
        this.calculateTotalPages()
        // this.dataSource.sort = this.sort;
        // this.dataSource.paginator = this.paginator;
      }

    })
  }
  buildDiv: string = 'analoguerecoder';
  divFunction(arg: string) {
    this.buildDiv = arg


  }
  selectedRoleIds: any = [];
  toggleSelectAll(checked: boolean) {
    this.selectAll = checked;
    if (checked) {
      this.selectedRoleIds = this.alldata.map((role: any) => role.ChannelId); // Add all role IDs
    } else {
      this.selectedRoleIds = []; // Clear the array
    }


  }
  isRoleSelected(roleId: number): boolean {
    return this.selectedRoleIds.some((role: any) =>

      role === roleId);
  }
  async loadData() {
    const body = { limit: 10000, offset: 0 }
    try {
      this.recorderserive.getChannelsettingsDataAnalogue(body).subscribe((result: any) => {
        this.downloadData = result.data;
        this.dataLoaded = true;
      });
    } catch (error) {
      console.error('Error fetching data', error);
    }
  }
  exportToFile(fileType: string) {
    if (this.dataLoaded) {
      // console.log(this.downloadData, 'downloadData');


      const exceldata = this.downloadData.channelData.map((item: any) => ({
        Channel: item.Channel,
        Voltage: item.VOLTAGE,
        Control: item.CONTROL,
        Bergin: item.BARGEIN,
        Ringcount: item.CALLERID_RINGCOUNT
      }));
      this.exportService.generateFile(fileType, exceldata, 'Analogue Channel Mapping')
    }


  }
  toggleRoleSelection(roleId: number, isChecked: boolean,) {
    if (isChecked) {
      this.selectedRoleIds.push(roleId);

    } else {
      const index = this.selectedRoleIds.indexOf(roleId);
      if (index > -1) {
        this.selectedRoleIds.splice(index, 1);

      }
    }
    // Update "Select All" checkbox state
    this.selectAll = this.alldata.map((role: any) => role.ChannelId).every((id: any) => this.selectedRoleIds.includes(id));

  }
  onItemsPerPageChange(event: MatSelectChange) {

    this.limit = event.value;
    this.offset = 0;
    // this.getChannelDatas()
    this.calculateTotalPages();
    // this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)



  }
  calculateTotalPages() {
    this.totalPages = Math.ceil(this.TotalRecords / this.limit);
  }
  goToPage(event: any) {
    this.currentPage = event.value;
    this.offset = (this.currentPage - 1) * this.limit;
    // this.getChannelDatas()

    // this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)

  }
  getPagesArray() {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }
  previousPage() {
    if (this.offset > 0) {
      this.offset -= this.limit; // Decrease offset for the previous page
    }
    // this.getChannelDatas()
    // this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)
  }
  nextPage() {
    if (this.offset + this.limit < this.TotalRecords) {
      this.offset += this.limit; // Increase offset for the next page

    }
    // console.log(this.offset, this.limit, this.TotalRecords, 'next button');
    // this.getChannelDatas()

    // this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)
  }
  openDialog(excel: any, element: any): void {


    const dialogRef = this.dialog.open(AnalougechannelmappingComponent, {
      disableClose: true,
      data: { excel: excel, extension: this.myForm.value.extension, element: element },


    });

    dialogRef.afterClosed().subscribe(result => {

      this.getChannelDatas();
    });
  }
  toolTips: any = {
    DownloadReports: 'Download Reports',
  }

  savebutton() {

    if (this.myForm.valid) {



      let body = { value: this.myForm.value }
      this.recorderserive.InsertAngloueRecorderSetting(body).subscribe((result: any) => {
        if (result.status == true) {
          const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: 'Analog recorder settings added successfully' } });
          this.buildDiv = 'recorderchannel'
        } else {
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: result.statusText },
          });
        }

      })
    }

  }
  deleteFuntion(message: any) {
    let body = { 'channelName': this.selectedRoleIds }
    this.matdialoge.open(ConfirmationDialogComponent, {
      data: {
        clickedStatus: "deleteConfirmation",
        message: message
      },
      disableClose: true,
    }).afterClosed().subscribe((result: any) => {
      if (result == true) {
        this.recorderserive.deleteAnalogue(body).subscribe((result: any) => {
          if (result.status == true) {
            this.getChannelDatas()
            this.matdialoge.closeAll()

            this.dialog.open(PopUpComponent, {
              width: "500px",
              height: "290px",
              data: { message: 'Channel mapping deleted successfully' },
            });
          } else {

            this.dialog.open(PopUpComponent, {
              width: "500px",
              height: "290px",
              data: { message: 'Failed to deleted data!' },
            });
          }

        })
      }
    })
  }
}
