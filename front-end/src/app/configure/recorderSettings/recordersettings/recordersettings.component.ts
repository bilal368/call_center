import { Component, OnInit, ViewChild, Input, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { StationmonitoringService } from '../../../core/services/stationmonitor/stationmonitoring.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChannelmappingAlertComponent } from '../../../shared/dialogComponents/channelmapping-alert/channelmapping-alert.component';
import { AlertDialogComponent } from '../../../shared/dialogComponents/alert-dialog/alert-dialog.component';
import { SharedService } from '../../../core/shared/share.service';
import { HttpClientModule } from '@angular/common/http';
import { RecorderserviceService } from '../../../core/services/recorderSettings/recorderservice.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';
import { ConfirmationDialogComponent } from '../../../shared/dialogComponents/confirmation-dialog/confirmation-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PopUpComponent } from '../../../shared/dialogComponents/pop-up/pop-up.component';
export interface UserData {
  recorderChannelMappingId: string;
  channel: string;
  mappedExtensionMacIP: string;
  password: string;
}
let ELEMENT_DATA: UserData[] = [

];
@Component({
  selector: 'app-recordersettings',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, FormsModule, MatMenuModule, MatCheckboxModule, MatFormFieldModule, MatTooltipModule, MatSelectModule, MatIconModule, MatButtonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule, MatSortModule, MatInputModule, HttpClientModule, TranslateModule],
  templateUrl: './recordersettings.component.html',
  styleUrl: './recordersettings.component.css',
  providers: [RecorderserviceService, SharedService, StationmonitoringService]
})


export class RecordersettingsAvayaComponent implements OnInit, AfterViewInit {
  selectedCodec: string = '';
  @Input() selectedOption: any;

  displayedColumns: string[] = ['select', 'id', 'Channel', 'extension', 'action'];
  dataSource = new MatTableDataSource<UserData>(ELEMENT_DATA);
  @ViewChild(MatSort, { static: true }) sort: any = MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: any = MatPaginator;
  toolTips: any = {
    SaveSettings: 'RecorderSetting.savesettings',
  }

  dialogRef: any;
  inputData: any;
  limit: any = 10;
  offset: any = 0;
  totalPages = 1;
  currentPage = 1;
  TotalRecords: number = 10;
  alldata: any = []
  constructor(
    private add: FormBuilder,
    private dialog: MatDialog,
    private stationmonitor: StationmonitoringService,
    private recorderserive: RecorderserviceService,
    private matdialoge: MatDialog,
    private sharedService: SharedService,
    private exportService: SharedService,
  ) {
  }
  ngOnInit(): void {
    this.myForm = this.add.group({
      DataPath: new FormControl('/opt/app/DATA', Validators.required),
      localipaddress: new FormControl('172.18.80.9'),
      localport: new FormControl('58148'),
      aesport: new FormControl('4721'),
      aesserver: new FormControl('172.18.80.150'),
      aesusername: new FormControl('dgvox'),
      switchconnection: new FormControl('FTAUHCM'),
      rtpip: new FormControl('172.18.80.9'),
      chindex: new FormControl('001'),
      aespassword: new FormControl('P@ssw0rd'),
      switchipaddres: new FormControl('172.18.75.10'),
      protocalversion: new FormControl('http://www.ecma-international.org/standards/ecma-323/csta/ed3'),
      codec: new FormControl('A-Law'),
      logstatus: new FormControl('Off'),
      ipch: new FormControl('10'),
      log: '0',
      socketreconnection: new FormControl('180')
    })
    this.getChannelDatas()
  }

  selected = 'option2';
  hide = true;
  myForm: any = FormGroup;
  buildDiv: string = 'avayarecorder';
  divFunction(arg: string) {
    this.buildDiv = arg


  }
  get f(): { [key: string]: AbstractControl } {


    return this.myForm.controls;
  }
  avaychannelcount: any
  ngAfterViewInit(): void {
    this.recorderserive.fetchlicenseData().subscribe((res: any) => {
      if (res.result.dg.ai.Active_avaya) {
        this.avaychannelcount = res.result.dg.ai.Active_avaya.channels
        this.myForm.get('ipch')?.patchValue(this.avaychannelcount);
        this.myForm.controls['ipch'].disable(); 
      }

      // this.avaychannelcount = res.result.dg.ai.Active_avaya.channels
      // this.myForm.get('ipch')?.patchValue(this.avaychannelcount);
      // this.myForm.controls['ipch'].disable();
      // this.channelindex = this.recorderserive.getChannelIndex()
      // console.log(this.channelindex, 'channelindex');


    })
  }

  savebutton() {

    if (this.myForm.valid) {
      let body = { value: this.myForm.getRawValue() }
      this.recorderserive.Avayarecordersettings(body).subscribe((result: any) => {
        if (result.status == true) {
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: 'Avaya recorder settings added successfully.' },
          });
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
  selectAll = false;
  selectedRoleIds: any = [];
  toggleSelectAll(checked: boolean) {
    this.selectAll = checked;
    if (checked) {
      this.selectedRoleIds = this.alldata.map((role: any) => role.recorderChannelMappingId); // Add all role IDs
    } else {
      this.selectedRoleIds = []; // Clear the array
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
    this.selectAll = this.alldata.map((role: any) => role.recorderChannelMappingId).every((id: any) => this.selectedRoleIds.includes(id));

  }
  isRoleSelected(roleId: number): boolean {
    return this.selectedRoleIds.some((role: any) =>
      role === roleId);
  }
  openDialog(excel: any, element: any): void {
    const dialogRef = this.dialog.open(ChannelmappingAlertComponent, {
      disableClose: true,
      data: { excel: excel, element: element },


    });

    dialogRef.afterClosed().subscribe(result => {

      this.getChannelDatas()
    });
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
  closeDialog(): void {
    this.dialogRef.close();
  }

  getChannelDatas() {
    const body = { limit: this.limit, offset: this.offset }


    this.recorderserive.channelMappingList(body).subscribe((result: any) => {
      if (result.status == true) {

        this.dataSource = new MatTableDataSource<UserData>(ELEMENT_DATA);
        this.dataSource = result.data;
        this.alldata = result.data;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.TotalRecords = result.count;
        this.calculateTotalPages()
      }

    })
  }

  deleteFuntion(message: any, id: any) {
    if (this.selectedRoleIds.length == 0) {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: 'No data is selected' },
      });
    } else {
      let body = { 'id': id }
      this.matdialoge.open(ConfirmationDialogComponent, {
        data: {
          clickedStatus: "deleteConfirmation",
          message: message
        },
        disableClose: true,
      }).afterClosed().subscribe((result: any) => {


        if (result == true) {
          this.recorderserive.deletechanneld(body).subscribe((result: any) => {
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
  isLoading = false;
  downloadData: any = []
  exportToFile(fileType: string) {
    this.isLoading = true;
    const body = { limit: 1000, offset: 0 }
    try {
      this.recorderserive.channelMappingList(body).subscribe((result: any) => {
        this.downloadData = result.data;
        const exceldata = this.downloadData.map((item: any) => ({
          "Sl.No": item.recorderChannelMappingId,
          "Channel": item.channel,
          "Extension": item.mappedExtensionMacIP
        }));
        this.exportService.generateFile(fileType, exceldata, 'Avaya Channel Mapping')
        this.isLoading = false;
      })
    } catch (error) {
      this.isLoading = false
    }
  }
  onItemsPerPageChange(event: MatSelectChange) {

    this.limit = event.value;
    this.offset = 0;
    this.getChannelDatas()
    this.calculateTotalPages();



  }
  goToPage(event: any) {
    this.currentPage = event.value;
    this.offset = (this.currentPage - 1) * this.limit;
    this.getChannelDatas()


  }
  getPagesArray() {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }
  previousPage() {
    if (this.offset > 0) {
      this.offset -= this.limit; // Decrease offset for the previous page
    }
    this.getChannelDatas()
  }
  nextPage() {
    if (this.offset + this.limit < this.TotalRecords) {
      this.offset += this.limit; // Increase offset for the next page

    }
    this.getChannelDatas()

  }
  calculateTotalPages() {
    this.totalPages = Math.ceil(this.TotalRecords / this.limit);
  }
}

