import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, AfterViewInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { PopUpComponent } from '../../../shared/dialogComponents/pop-up/pop-up.component';
import { AnalougechannelmappingComponent } from '../../../shared/dialogComponents/analougechannelmapping/analougechannelmapping.component';
import { UserData } from '../recordersettings/recordersettings.component';
import { RecorderserviceService } from '../../../core/services/recorderSettings/recorderservice.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
// import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-digital-recordersetting',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, FormsModule, MatMenuModule, MatCheckboxModule, MatFormFieldModule, MatTooltipModule, MatSelectModule, MatIconModule, MatButtonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule, MatSortModule, MatInputModule, HttpClientModule, TranslateModule, MatChipsModule],
  templateUrl: './digital-recordersetting.component.html',
  styleUrl: './digital-recordersetting.component.css',
  providers: [RecorderserviceService]
})
export class DigitalRecordersettingComponent {
  myForm: any = FormGroup;
  displayedColumns: string[] = ['select', 'Channel', 'extension', 'controler', 'bergin', 'ring', 'action'];
  dataSource = new MatTableDataSource<UserData>();
  selectAll = false;
  alldata: any = []
  limit: any = 10;
  offset: any = 0;
  totalPages = 1;
  currentPage = 1;
  TotalRecords: number = 10;
  eventFrom: any = FormGroup;
  // options: string[] = ['One fish', 'Two fish', 'Three fish', 'Four fish'];
  chips: string[] = [];
  secondChips: any = [];
  thirdChips: any = [];
  fourChips: any = [];
  fiveChips: any = [];
  selectedOption: any;
  selectedOptioncallinfo: string | null = null;
  selectedOptionstop: string | null = null;
  selectedOptiondirection: string | null = null;
  selectedOptionignore: string | null = null;
  eventData: any =
    [
      // "DST_OFFHOOK",
      // "DST_ONHOOK",
      // "DST_LT_ON",
      // "DST_LT_OFF",
      // "DST_DGT_PRS",
      // "DST_MSG_CHG",
      // "DST_FUNC_BTN_PRS",
      // "DST_HOLD_BTN_PRS",
      // "DST_RELEASE_BTN_PRS",
      // "DST_RING_ON",
      // "DST_RING_OFF",
      // "DST_AUDIO_CHG",
      // "DST_SPEAKER_LT_OFF",
      // "DST_SPEAKER_LT_ON",
      // "DST_TRANSFER_LT_ON",
      // "DST_TRANSFER_LT_OFF"


    ]

  // trackByIndex: TrackByFunction<any>;
  searchTerm: string = '';
  // filteredEventData: string[] = [...this.eventData];

  eventDataRedis: any
  constructor(

    private add: FormBuilder,
    private recorderserive: RecorderserviceService,
    private snackBar: MatSnackBar,
    private popUp: MatDialog,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {

  }
  ngOnInit(): void {
    this.getdigitalEventsredis()




    // this.getChannelDatas()
    this.myForm = this.add.group({
      DataPath: new FormControl('/opt/app/DATA', Validators.required),
      Voltage: new FormControl('0'),
      ACH: new FormControl('8'),
      chindex: new FormControl('001'),
      Misscall: new FormControl('0'),
      Enablevoice: ['1'],
      mediaproxy: new FormControl('172.18.0.4'),
      mediafwdip: new FormControl('172.18.0.3'),
      // codec: new FormControl('A-Law'),
      logstatus: new FormControl('Off'),
      ipch: new FormControl('10'),
      log: '0',
      Maxfilesize: new FormControl('5'),
      // extension:['All']


    })
    this.eventFrom = this.fb.group({
      eventDataform: ['', Validators.required]
    })
    this.recorderserive.getdigitalRecorderData({}).subscribe((res: any) => {
      if (res) {
        this.myForm.patchValue({
          DataPath: res.data.DATADRIVE || '/opt/app/DATA',
          Voltage: res.data.VOLTAGE_CAPTURE || '0',
          ACH: res.data.ACH || '8',
          chindex: res.data.CHINDEX || '001',
          Misscall: res.data.MISSCALL || '0',
          mediaproxy: res.data.MEDIA_PROXY_IP || '172.18.0.4',
          mediafwdip: res.data.MEDIA_FORWARD_IP || '172.18.0.3',
          logstatus: res.data.LOGGER_STATUS || 40,
          log: '0',
          Maxfilesize: res.data.MAXFILESIZE || '5',
          Enablevoice: res.data.ENABLEVOICEFILESPLIT || '1'
        })
      }
    })

  }
  filterOptions(catergory: string) {

    switch (catergory) {
      case 'startrecord':
        this.filteredEventData = this.eventData.filter((item: any) =>
          item?.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
        );
        break;

      case 'callinfo':
        this.filteredDatacallinfo = this.callInfoEvents.filter((item: any) =>
          item?.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
        );
        break;

      case 'ignoreevents':
        this.filteredDataIgnoreEvents = this.ignoreEventes.filter((item: any) =>
          item?.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
        );
        break;
      case 'stoprecord':
        this.filteredDataStoprecord = this.stopRecordEvent.filter((item: any) =>
          item?.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
        );
        break;
      case 'direction':
        this.filteredDataDirection = this.directionEvent.filter((item: any) =>
          item?.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
        );
        break;

      default:
        console.warn(`Unknown category: ${catergory}`);
    }



  }

  buildDiv: string = 'digitalrecoder';
  divFunction(arg: string) {
    this.buildDiv = arg


  }
  selectedRoleIds: any = [];
  toggleSelectAll(checked: boolean) {
    this.selectAll = checked;
    if (checked) {
      this.selectedRoleIds = this.alldata.map((role: any) => role.recorderChannelMappingId); // Add all role IDs
    } else {
      this.selectedRoleIds = []; // Clear the array
    }


  }
  isRoleSelected(roleId: number): boolean {
    return this.selectedRoleIds.some((role: any) =>
      role === roleId);
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
  onItemsPerPageChange(event: MatSelectChange) {

    this.limit = event.value;
    this.offset = 0;
    // this.getChannelDatas()
    this.calculateTotalPages();
    this.getdigitalEventData()
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

  }
  nextPage() {
    if (this.offset + this.limit < this.TotalRecords) {
      this.offset += this.limit; // Increase offset for the next page

    }

  }
  openDialog(excel: any, element: any): void {


    const dialogRef = this.dialog.open(AnalougechannelmappingComponent, {
      disableClose: true,
      data: { excel: excel, extension: this.myForm.value.extension, element: element },


    });

    // dialogRef.afterClosed().subscribe(result => {

    //   this.getChannelDatas();
    // });
  }
  toolTips: any = {
    DownloadReports: 'Download Reports',
  }

  savebutton() {
    if (this.myForm.valid) {
      let body = { value: this.myForm.value }
      this.recorderserive.InsertDigitalRecodersetting(body).subscribe((result: any) => {
        if (result.status == true) {
          const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: 'Digital recorder settings added successfully.' } });
          this.buildDiv = 'digitalevent'
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
  addbutton(event: HTMLInputElement, category: any) {
    // if (this.eventFrom.valid) {
    // this.eventData.push(this.eventFrom.value.eventDataform);
    if (!event || !category) {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: 'Please enter events' },
      });
    }
    const body = { digitalevent: event.value, category: category }

    this.recorderserive.digitaleventmanegment(body).subscribe((result: any) => {
      this.getdigitalEventData()
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: 'New event add sucessfully' },
      });
      event.value = ''

    },
      (error: any) => {
        console.log(error.error.message, 'errodataaaaaa');
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: error.error.message },
        });
      }
    )



  }


  removeItem(value: any): void {
    this.eventData = this.eventData.filter((event: any) => event !== value);
    this.chips = this.chips.filter((event: any) => event !== value);
    this.secondChips = this.secondChips.filter((event: any) => event !== value);
    this.thirdChips = this.thirdChips.filter((event: any) => event !== value);
    this.fourChips = this.fourChips.filter((event: any) => event !== value);
    this.fiveChips = this.fiveChips.filter((event: any) => event !== value);
    this.deleteevent(value)
  }
  addChip(option: string): void {
    if (option && !this.chips.includes(option)) {
      this.chips.push(option);
      this.searchTerm = ''
      this.filterOptions('startrecord')
      this.getdigitalEventData()
      // this.inserteventredis(this.chips, 'START_RECORD')
    }
  }
  removeChip(chip: string): void {

    const index = this.chips.indexOf(chip);
    if (index >= 0) {
      this.chips.splice(index, 1);
    }
    if (this.chips.length === 0) {
      this.selectedOption = null; // Clear selection when no chips remain
    }
    this.getdigitalEventData()
    // this.removeeventsredis(this.chips, 'START_RECORD')


  }
  addChipToSecond(value: string) {
    if (value && !this.secondChips.includes(value)) {
      this.secondChips.push(value);
      this.searchTerm = ''
      this.filterOptions('stoprecord')
      this.getdigitalEventData()
    }
    // this.inserteventredis(this.secondChips, 'STOP_RECORD')
  }
  removeSecondChip(chip: string) {
    const index = this.secondChips.indexOf(chip);
    if (index >= 0) {
      this.secondChips.splice(index, 1);
    }
    if (this.secondChips.length === 0) {
      this.selectedOptionstop = null; // Clear selection when no chips remain
    }
    this.getdigitalEventData()
    // this.removeeventsredis(this.secondChips, 'STOP_RECORD')

  }
  addChipTothird(value: string) {
    if (value && !this.thirdChips.includes(value)) {
      this.thirdChips.push(value);
      this.searchTerm = ''
      this.filterOptions('callinfo')
      this.getdigitalEventData()
    }
    // this.inserteventredis(this.thirdChips, 'CALL_INFO')
  }
  removethirdChip(chip: string) {
    const index = this.thirdChips.indexOf(chip);
    if (index >= 0) {
      this.thirdChips.splice(index, 1);
    }
    if (this.thirdChips.length === 0) {
      this.selectedOptioncallinfo = null; // Clear selection when no chips remain
    }
    this.getdigitalEventData()
    // this.removeeventsredis(this.thirdChips, 'CALL_INFO')
  }
  addChipToforth(value: string) {
    if (value && !this.fourChips.includes(value)) {
      this.fourChips.push(value);
      this.searchTerm = ''
      this.filterOptions('direction')
      this.getdigitalEventData()
    }
    // this.inserteventredis(this.fourChips, 'DIRECTION')
  }
  removeforthChip(chip: string) {
    const index = this.fourChips.indexOf(chip);
    if (index >= 0) {
      this.fourChips.splice(index, 1);
    }
    if (this.fourChips.length === 0) {
      this.selectedOptiondirection = null; // Clear selection when no chips remain
    }
    this.getdigitalEventData()
    // this.removeeventsredis(this.fourChips, 'DIRECTION')
  }
  addChipfive(value: string) {
    if (value && !this.fiveChips.includes(value)) {
      this.fiveChips.push(value);
      this.searchTerm = ''
      this.filterOptions('ignoreevents')
      this.getdigitalEventData()
    }
    // this.inserteventredis(this.fiveChips, 'IGNORE_EVENTS')
  }
  removefiveChip(chip: string) {
    const index = this.fiveChips.indexOf(chip);
    if (index >= 0) {
      this.fiveChips.splice(index, 1);
    }
    if (this.fiveChips.length === 0) {
      this.selectedOptionignore = null; // Clear selection when no chips remain
    }
    this.getdigitalEventData()
    // this.removeeventsredis(this.fiveChips, 'IGNORE_EVENTS')
  }
  filteredEventData: any
  filteredDatacallinfo: any
  filteredDataIgnoreEvents: any
  filteredDataStoprecord: any
  filteredDataDirection: any
  callInfoEvents: any = []
  ignoreEventes: any = []
  stopRecordEvent: any = []
  directionEvent: any = []
  getdigitalEventData() {
    this.recorderserive.digitalrecordergetevent({}).subscribe((result: any) => {



      const listedData = result.data; // Array of event objects
      //.............startrecord data
      this.eventData = listedData
        .filter((element: any) => element.category == "general" || element.category == "startrecord")
        .map((element: any) => element.digitalRecorderEvent);

      this.filteredEventData = this.eventData.filter((element: any) => !this.chips.includes(element))


      //.........................................................
      //....callfinfo data
      this.callInfoEvents = listedData
        .filter((element: any) => element.category == "general" || element.category == "callinfo")
        .map((element: any) => element.digitalRecorderEvent);
      this.filteredDatacallinfo = this.callInfoEvents.filter((element: any) => !this.thirdChips.includes(element))
      //.............................................................
      //ignore evens....................
      this.ignoreEventes = listedData
        .filter((element: any) => element.category == "general" || element.category == "ignoreevents")
        .map((element: any) => element.digitalRecorderEvent);
      this.filteredDataIgnoreEvents = this.ignoreEventes.filter((element: any) => !this.fiveChips.includes(element))
      //......................................................
      //stoprecord events
      this.stopRecordEvent = listedData
        .filter((element: any) => element.category == "general" || element.category == "stoprecord")
        .map((element: any) => element.digitalRecorderEvent);
      this.filteredDataStoprecord = this.stopRecordEvent.filter((element: any) => !this.secondChips.includes(element));
      //..................................................
      //direction events
      this.directionEvent = listedData
        .filter((element: any) => element.category == "general" || element.category == "direction")
        .map((element: any) => element.digitalRecorderEvent);
      this.filteredDataDirection = this.directionEvent.filter((element: any) => !this.fourChips.includes(element))
      //..............................

    },
      (error: any) => {
        console.log(error.error.message, 'errodataaaaaa');
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: error.error.message },
        });
      }
    )
  }
  saveDatastarrecord: any
  isInput = false
  saveSearch(inputElement: HTMLInputElement, category: any) {
    this.addbutton(inputElement, category)
  }
  deleteevent(values: any) {
    const body = { digitalevent: values }
    this.recorderserive.digitalrecorderdeleteevent(body).subscribe((result: any) => {





    },
      (error: any) => {

        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: error.message },
        });
      }
    )
  }
  SaveEvents() {
    try {
      if (this.chips.length == 0 || this.secondChips.length == 0 || this.thirdChips.length == 0 || this.fourChips.length == 0 || this.fiveChips.length == 0) {
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: 'Select at least one event from each category' },
        });
        return
      }
      const STARTRECORD = {
        values: this.chips,
        events: 'START_RECORD'
      }
      const STOPRECORD = {
        values: this.secondChips,
        events: 'STOP_RECORD'
      }
      const CALLINFO = {
        values: this.thirdChips,
        events: 'CALL_INFO'
      }
      const INGOREEVENT = {
        values: this.fiveChips,
        events: 'IGNORE_EVENTS'
      }

      const DIRECTION = {
        values: this.fourChips,
        events: 'DIRECTION'
      }
      // this.inserteventredis(this.fourChips, 'DIRECTION')

      const body = { STARTRECORD, STOPRECORD, CALLINFO, INGOREEVENT, DIRECTION }
      this.recorderserive.digitalrecordereventsredis(body).subscribe((result: any) => {
        if (result) {
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: 'Events added sucessfully' },
          });
        }
      },
        (error: any) => {
          console.log(error);

        }
      )
    } catch (error) {
      console.log(error);

    }
  }

  getdigitalEventsredis() {
    this.recorderserive.getDigitalrecordEvents({}).subscribe((result: any) => {
      this.eventDataRedis = result.data
      this.chips = this.eventDataRedis.START_RECORD
      this.secondChips = this.eventDataRedis.STOP_RECORD
      this.thirdChips = this.eventDataRedis.CALL_INFO
      this.fourChips = this.eventDataRedis.DIRECTION
      this.fiveChips = this.eventDataRedis.IGNORE_EVENTS

      this.getdigitalEventData()

    })
  }
}
