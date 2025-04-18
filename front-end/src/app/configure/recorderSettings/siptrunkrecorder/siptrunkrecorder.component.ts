import { Component, OnInit, ViewChild, Input, NgModule, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AlertDialogComponent } from '../../../shared/dialogComponents/alert-dialog/alert-dialog.component';
import { RecorderserviceService } from '../../../core/services/recorderSettings/recorderservice.service';
import { ChannelmappingsiptrunkComponent } from '../../../shared/dialogComponents/channelmappingsiptrunk/channelmappingsiptrunk.component';
import { TranslateModule } from '@ngx-translate/core';
import { SharedService } from '../../../core/shared/share.service';
import { MatMenuModule } from '@angular/material/menu';
import { ConfirmationDialogComponent } from '../../../shared/dialogComponents/confirmation-dialog/confirmation-dialog.component';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PopUpComponent } from '../../../shared/dialogComponents/pop-up/pop-up.component';

export interface UserData {
  recorderChannelMappingId: string;
  channel: string;
  mappedExtensionMacIP: string;
  password: string;
}
export interface NetworkDevice {
  Device: string;
  Description: string;
  IP_ADDRESS: string;
  MAC_ADDRESS: string;
}
let ELEMENT_DATA: UserData[] = [
  // { id: '1', Channel: 'Hydrogen', extension: '80', password: 'lightblue' },
  // { id: '2', Channel: 'Helium', extension: '70', password: 'yellow' },
  // more data
];
@Component({
  selector: 'app-siptrunkrecorder',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatToolbarModule, MatTooltipModule, MatCheckboxModule,
    TranslateModule, MatSelectModule, MatFormFieldModule, ReactiveFormsModule, MatButtonModule,
    FormsModule, MatRadioModule, MatIconModule, MatPaginatorModule, MatTableModule],
  templateUrl: './siptrunkrecorder.component.html',
  styleUrl: './siptrunkrecorder.component.css'
})
export class SiptrunkrecorderComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['select', 'Channel', 'extension', 'action'];
  dataSource = new MatTableDataSource<UserData>(ELEMENT_DATA);
  dialogRef: any;
  limit: any = 10;
  offset: any = 0;
  totalPages = 1;
  currentPage = 1;
  TotalRecords: number = 10;
  alldata: any = []
  downloadData: any = []
  // dataLoaded = false;
  isExtensionDisabled: boolean = false;
  isLoading = false;
  ngOnInit(): void {

    // this.loadData()
    // this.onDynamicChannelsChange();

    // const dynamicChannelValue = this.myForm.get('dynamicchannels')?.value;
    // console.log(dynamicChannelValue,'dynmicvalue');



    this.myForm = this.add.group({
      DataPath: new FormControl(Validators.required),
      mediafwdip: new FormControl(),
      gatewayip: new FormControl(),
      rtptimeout: new FormControl(),
      dynamicchannels: ['1'],
      pcapdump: new FormControl(),
      sipport: new FormControl(),
      remotepartyid: new FormControl(),
      remotepartyiddigits: new FormControl(),
      chindex: new FormControl(),
      rtplog: new FormControl(),
      rtplogch: new FormControl(''),
      gre: new FormControl(),
      // codec: new FormControl('A-Law'),
      logstatus: new FormControl(),
      device: new FormControl('enp1s0'),
      ipch: new FormControl(),
      log: '1',
      TCP_SIP: new FormControl(),
      MEDIA_PROXY_IP: new FormControl(),
      extension: [{ value: 'EXT', disabled: false }]




    })

    this.recorderserive.siptrunkRecorderSettingsGetData({}).subscribe((result: any) => {
      if (result) {
        this.myForm.patchValue({
          DataPath: result.data.DATADRIVE || '/opt/app/DATA',
          mediafwdip: result.data.MEDIA_FORWARD_IP || '172.18.0.3',
          gatewayip: result.data.GATEWAY_IP || '59.92.234.100',
          rtptimeout: result.data.RTP_TIMEOUT || 15,
          dynamicchannels: result.data.DYNAMIC_CHANNELS || 1,
          pcapdump: result.data.PCAP_DUMP || 0,
          sipport: result.data.SIP_PORT || 5060,
          remotepartyid: result.data.REMOTE_PARTY_ID_EXT || 0,
          remotepartyiddigits: result.data.REMOTE_PARTY_ID_DIGITS || 0,
          chindex: result.data.CHINDEX || 1,
          rtplog: result.data.RTP_PROXY || 0,
          gre: result.data.GRE || 0,
          logstatus: result.data.LOGGER_STATUS || 40,
          ipch: result.data.IPCH || 100,
          log: '1',
          TCP_SIP: result.data.TCP_SIP || 0,
          MEDIA_PROXY_IP: result.data.MEDIA_PROXY_IP || '172.18.0.4',
          extension: result.data.EXTENSION || 'EXT'


        });

      }
    })


    this.getChannelDatas()
    this.getDeviceList()


  }
  siptrunkCount: any
  ngAfterViewInit(): void {
    // Ensure the initial state is set after the view has been initialized
    this.onDynamicChannelsChange();
    this.recorderserive.fetchlicenseData().subscribe((res: any) => {  
      if (res.result.dg.pi.SipTrunk_recorder) {
        this.siptrunkCount = res.result.dg.pi.SipTrunk_recorder.channels
        this.myForm.get('ipch')?.patchValue(this.siptrunkCount);
        this.myForm.controls['ipch'].disable();
      }
    })
  }
  onDynamicChannelsChange(): void {
    const dynamicChannelsValue = this.myForm.get('dynamicchannels')?.value;
    if (dynamicChannelsValue === '1') {
      this.isExtensionDisabled = true; // Disable the extension radio buttons
      this.myForm.get('extension')?.disable();
    } else {
      this.isExtensionDisabled = false; // Enable the extension radio buttons
      this.myForm.get('extension')?.enable();
    }
  }

  constructor(private add: FormBuilder, private snackBar: MatSnackBar, private dialog: MatDialog, private matdialoge: MatDialog, private recorderserive: RecorderserviceService, private exportService: SharedService) {

  }


  @Input() selectedOption: any;
  selected = 'option2';
  // selecteddropdown = 'extesnion';
  ingredient!: string;

  hide = true;
  myForm: any = FormGroup;
  buildDiv: string = 'siptrunk';
  deviceList: any[] = [];
  selectedDevice: any;
  descriptionField: any
  ipAddressField: any
  macAddressField: any
  selectedIndex: any
  toolTips: any = {
    Delete: "Delete"
  }
  divFunction(arg: string) {
    if (this.myForm.value.dynamicchannels == 0) {
      this.buildDiv = arg
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


    const dialogRef = this.dialog.open(ChannelmappingsiptrunkComponent, {
     
      disableClose: true,
      data: { excel: excel, extension: this.myForm.value.extension, element: element },


    });

    dialogRef.afterClosed().subscribe(result => {

      this.getChannelDatas();
    });
  }
  onDeviceSelect(selectedDevice: any, index: any): void {
    this.selectedDevice = selectedDevice;
    this.selectedIndex = index + 1

  }
  getChannelDatas() {
    const body = { limit: this.limit, offset: this.offset }
    this.recorderserive.channelmappingsiptrunklist(body).subscribe((result: any) => {

      if (result.status == true) {

        this.dataSource = new MatTableDataSource<UserData>(ELEMENT_DATA);
        this.dataSource = result.data;
        this.alldata = result.data


        this.TotalRecords = result.count;
        this.calculateTotalPages()
        // this.dataSource.sort = this.sort;
        // this.dataSource.paginator = this.paginator;
      }

    })
  }
  paginator(paginator: any, arg1: string) {
    throw new Error('Method not implemented.');
  }

  savebutton() {
    // console.log(this.myForm.value,);

    const value = this.myForm.getRawValue()
    const selectDeviceValue = this.selectedDevice
    const selectedIndex = this.selectedIndex
    let body = { value, selectDeviceValue, selectedIndex }



    // const ipchValue = Number(this.myForm.value.ipch);
    // if (!isNaN(ipchValue) && ipchValue > this.siptrunkCount) {
    //   this.dialog.open(PopUpComponent, {
    //     width: "500px",
    //     height: "290px",
    //     data: { message: `The number of channels exceeds the limit. Current limit: ${this.siptrunkCount}` },
    //   });
    //   return;
    // }
    // descriptionField: this.selectedDevice?.description,
    // ipAddressField:  this.selectedDevice?.ipaddress,
    // macAddressField:  this.selectedDevice?.macaddress,
    // if (this.myForm.valid) {


    //   if (this.myForm.value.logstatus == 'Off') {
    //     console.log('true');

    //     this.myForm.value.log = 0
    //   } else {
    //     this.myForm.value.log = 1

    //   }
    this.recorderserive.siptrunkRecodersettings(body).subscribe((result: any) => {


      if (result.status == true) {
        // this.employemappingdialouge('ZIP trunk recorder settings added successfully', '117%');
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: `ZIP trunk recorder settings added successfully` },
        });

        // this.closeDialog();
        if (this.myForm.value.dynamicchannels == 0) {
          this.buildDiv = 'siptrunkrecorderchannel'
        }

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

    //   this.recorderserive.Avayarecordersettings(this.myForm.value).subscribe((result: any) => {
    //     if (result.status == true) {
    //       this.employemappingdialouge('New user added successfully', '117%');

    //       this.closeDialog();
    //     }

    //   })

    // } else {
    //   console.log('erererer');

    // }


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

    // this.sharedService.triggerGetUsers(this.data.roleId);
  }
  //deletemappedchannel
  deleteFuntion(message: any, id: any) {
    if (this.selectedRoleIds.length == 0) {
      // this.snackBar.open('No data is selected', 'Close', {
      //   duration: 5000,
      //   verticalPosition: 'top'
      // });
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
        // console.log(result.confirmed,'resultdata');

        if (result == true) {
          this.recorderserive.deletechanneld(body).subscribe((result: any) => {
            if (result.status == true) {
              this.getChannelDatas()
              this.matdialoge.closeAll()
              // this.snackBar.open('Channel mapping deleted successfully', 'Close', {
              //   duration: 5000,
              //   verticalPosition: 'top'
              // });
              this.dialog.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: { message: 'Channel mapping deleted successfully' },
              });
            } else {
              // this.snackBar.open('Failed to deleted data!', 'Close', {
              //   duration: 5000,
              //   verticalPosition: 'top'
              // });
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
  //getting device list from redis
  getDeviceList() {
    this.recorderserive.devicelist({}).subscribe((result: any) => {
      this.deviceList = Object.values(result).map((item: any) => ({


        device: item.Device,
        description: item.Description,
        ipaddress: item.IP_ADDRESS,
        macaddress: item.MAC_ADDRESS,

      }));

    })
  }
  exportToFile(fileType: string) {
    this.isLoading = true;
    const body = { limit: 10000, offset: 0 }
    try {
      this.recorderserive.channelmappingsiptrunklist(body).subscribe((result: any) => {
        this.downloadData = result.data;
        const exceldata = this.downloadData.map((item: any) => ({
          "Channel": item.channel,
          "Extension/Mac/IP": item.mappedExtensionMacIP
        }));
        this.exportService.generateFile(fileType, exceldata, 'SIP Channel Mapping')
        this.isLoading = false;
      });
    } catch (error) {
      console.error('Error fetching data', error);
    }


  }
  onItemsPerPageChange(event: MatSelectChange) {

    this.limit = event.value;
    this.offset = 0;
    this.getChannelDatas()
    this.calculateTotalPages();
    // this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)



  }
  goToPage(event: any) {
    this.currentPage = event.value;
    this.offset = (this.currentPage - 1) * this.limit;
    this.getChannelDatas()

    // this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)

  }
  getPagesArray() {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }
  previousPage() {
    if (this.offset > 0) {
      this.offset -= this.limit; // Decrease offset for the previous page
    }
    this.getChannelDatas()
    // this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)
  }
  nextPage() {
    if (this.offset + this.limit < this.TotalRecords) {
      this.offset += this.limit; // Increase offset for the next page

    }
    // console.log(this.offset, this.limit, this.TotalRecords, 'next button');
    this.getChannelDatas()

    // this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)
  }
  calculateTotalPages() {
    this.totalPages = Math.ceil(this.TotalRecords / this.limit);
  }
}
