import { Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SearchPipe } from '../../core/pipe/search.pipe';
import { CallReportService } from '../../core/services/callReport/call-report.service';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import WaveSurfer from 'wavesurfer.js';
import { ArchiveService } from '../../core/services/archive/archive.service';
import { FeedbackComponent } from '../feedback/feedback.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotePopupComponent } from '../../shared/dialogComponents/note-popup/note-popup.component';
import { CallTaggingComponent } from '../../shared/dialogComponents/call-tagging/call-tagging.component';
import { CustomDateComponent } from '../../shared/dialogComponents/custom-date/custom-date.component';
import { ConfirmationDialogComponent } from '../../shared/dialogComponents/confirmation-dialog/confirmation-dialog.component';
import { PopUpComponent } from '../../shared/dialogComponents/pop-up/pop-up.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { MatSort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';

interface concurrentData {
  day: string;
  maximumConcurrentCalls: number;
  [key: string]: string | number;
}
interface TableData {
  channelName: any;
  callDirection: any;
  recordingCallLogId: any;
  supervisorFeedBack: any;
  callStartTime: any;
  callEndTime: any;
  callerId: any;
  dialledNumber: any;
  Phone: any;
  alternateContactNum: any;
  recordedFileName: any;
  agentCode: any;
  extensionNumber: any;
  showAudio: boolean;
  date: string;
  dialed: string;
  extensionLabel: string;
  agentName: string;
  direction: string;
  action: string;
  duration: string;
  colorCode: string;
}
interface Filter {
  name: string;
  key: string;
  value: string;
}
interface Color {
  colorCodeId: string;
}
let ELEMENT_DATA: concurrentData[] = [];
@Component({
  selector: 'app-archive-reports',
  standalone: true,
  imports: [CommonModule,FormsModule,MatSortModule,MatProgressBarModule,SearchPipe,MatFormFieldModule,MatTooltipModule,MatCheckboxModule,
    MatIconModule,TranslateModule,ReactiveFormsModule,MatMenuModule,MatCheckboxModule,MatToolbarModule,
        MatSelectModule,MatTableModule,CommonModule,FormsModule,MatButtonModule, MatTooltipModule,
        MatFormFieldModule],
  providers:[DatePipe,SearchPipe],  
  templateUrl: './archive-reports.component.html',
  styleUrl: './archive-reports.component.css'
})
export class ArchiveReportsComponent implements OnInit {
  archivedFiles:any;
  toolTips:any={
    Close: 'Menu.CONFIGURE.EMPLOYEE MANAGER.CLOSE',
  }

  dataSource = new MatTableDataSource<TableData>();
  displayedColumns: string[] = ['archiveFileName', 'createdDate','archiveType', 'Actions'];
  displayedColumns2: string[] = [ 'date', 'dialed', 'extensionLabel', 'agentName', 'duration', 'direction', 'action'];
  searchKey: string = ''
  searchPipe: SearchPipe;
  currentPage: number = 1;
  totalRecord:number=0
  pageNumber:number=1;
  recordsPerPage:number=10;
  data: TableData[] = [];
  uniqueDialedNumbers: string[] = Array.from(new Set(this.data.map(item => item.dialed)));
  uniqueExtentionNumbers: string[] = Array.from(new Set(this.data.map(item => item.extensionNumber)));
  uniqueAgentNumbers: string[] = Array.from(new Set(this.data.map(item => item.agentCode)));
  uniqueDirectionNumbers: string[] = Array.from(new Set(this.data.map(item => item.direction)));
  uniqueColors: string[] = Array.from(new Set(this.data.map(item => item.colorCode)));
  filteredColors: { colorCode: string; colorCodeId: number }[] = [];
  uniqueExtention: string[] = [];
  uniqueAgent: string[] = [];
  uniqueExtentionLabel: string[] = [];
  uniqueAgentName: string[] = [];
  uniqueTagName: string[] = [];
  @ViewChildren(MatMenu) menus!: QueryList<MatMenu>;
  @ViewChild(MatSort)sort!: MatSort;
  constructor(
    public datePipe: DatePipe,
    public dialog: MatDialog, 
    searchPipe:SearchPipe,
    private callReportApi:CallReportService,
    private archiveApi:ArchiveService,
    private translate: TranslateService,

  ){
    this.searchPipe= searchPipe;
  }
  ngOnInit(): void {
    this.getArchivedFiles();
    // this.transformDataFromXML()
    // this.getCallsFromXML();
    this.colorCode();
    this.fetchCallDetails();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

// Open archived files
getArchivedFiles(){
  console.log(this.selectedArchiveTypes,this.archiveTypes);
  
  this.archiveApi.getArchiveList(this.pageNumber, this.recordsPerPage,this.searchName,this.selectedArchiveTypes).subscribe((result:any)=>{       
      // Update component properties with API response
      this.totalRecord = result.totalRecords;
      this.dataSource.data = result.data;
      this.currentPage = result.currentPage;
    
  },Error=>{
    console.error(Error);
  })

}
searchName: string = '';
searchWithName(){
  this.pageNumber=1;
  this.recordsPerPage=10;
  this.getArchivedFiles();
}
loading:boolean=false;
xmlData:boolean=false;
onSelect(body:any){
  this.loading=true

  // call the function to get data from XML
  this.transformDataFromXML(body)
}
deleteWithConfirm(element:any){
  const dialogRef = this.dialog.open(ConfirmationDialogComponent, 
    {width:'400px',height:'200px',data:{clickedStatus:'enterPW'},disableClose:true})
    .afterClosed().subscribe((result:any)=>{
      if(result.status){
        let body={...element,...result}        
        // if status=true
        this.archiveApi.deleteArchiveReport(body).subscribe((result:any)=>{
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message:  result.statusText},
          });
          this.getArchivedFiles()
        },Error=>{
          console.error(Error);
            this.dialog.open(PopUpComponent, {
                    width: "500px",
                    height: "290px",
                    data: { message:  Error.error.statusText},
                  });
        })
      }
    })
}
redisKey:any;
mountedPoint:any;
transformDataFromXML(body:any){
  this.mountedPoint=body.mountedPoint
  this.archiveApi.getDataFromXML(body).subscribe((result:any)=>{
    // console.log('get Data From XML',result);
    setTimeout(()=>{
      this.loading=false;
      this.xmlData=true
    },3000)
    if(result.status==true){
    
      
      this.redisKey=result.redisKey;
      this.getCallsFromXML();

    }
  },Error=>{
    console.error(Error.error);
    setTimeout(()=>{
      this.loading=false;
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message:  Error.error.statusText},
      });
    },1000)
  
  })
}
reqBody:any;
getCallsFromXML(){
  this.reqBody={...this.reqBody,redisKey:this.redisKey,pageNumber: this.pageNumber, recordsPerPage:this.recordsPerPage}    // Update component properties with API response
  this.archiveApi.getCallsFromXML(this.reqBody).subscribe((result:any)=>{    
    this.totalRecord = result.totalRecords;
    this.dataSource.data = result.data.map((item: any) => ({
      date: this.datePipe.transform(item.callStartTime, 'yyyy-MM-dd') || '',
      callStartTime: this.datePipe.transform(item.callStartTime, 'HH:mm:ss') || '',
      callEndTime: this.datePipe.transform(item.callEndTime, 'HH:mm:ss') || '',
      dialed: item.dialledNumber || '',
      callerId: item.callerId || '',
      agentName: item.agentName || '',
      agentCode: item.agentCode || '',
      extensionNumber: item.extensionNumber || '',
      extensionLabel: item.channelName,
      direction: item.callDirection === 1 ? 'Outbound' : 'Inbound',
      recordedFileName: item.recordedFileName || '',
      recordingCallLogId: item.recordingCallLogId || '',
      isLocked: item.isLocked || '',
      notes: item.notes || '',
      supervisorFeedBack: item.supervisorFeedBack || '',
      colorCodeId: item.colorCodeId || '',
      colorCode: item.colorCode || '',
      duration: item.duration || ''
    }));
    this.currentPage = result.currentPage;
  },Error=>{
    console.error(Error);
  })
}
previousPage(){
  if (this.pageNumber > 1) {
    this.pageNumber--;
    this.xmlData? this.getCallsFromXML():this.getArchivedFiles()
  }

}
nextPage(){
if (this.pageNumber < this.getTotalPages()) {
  this.pageNumber++;
  this.xmlData? this.getCallsFromXML():this.getArchivedFiles()

}

}
// Set Date Format
formatDate(date: Date | null): string {
  return date ? this.datePipe.transform(date, 'dd-MM-yyyy') || '' : '';
}
goToPage(event:MatSelectChange){
  const selectedPage = event.value; // event.value directly provides the selected page number
  this.pageNumber = parseInt(selectedPage, 10);
  if (this.pageNumber < 1 || this.pageNumber > this.getTotalPages()) {
    return;
  }
  this.xmlData? this.getCallsFromXML():this.getArchivedFiles()
}
 
getPagesArray() {
  return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
}
onItemsPerPageChange(event:MatSelectChange){
  this.recordsPerPage = event?.value;1
  this.pageNumber = 1;
  this.xmlData? this.getCallsFromXML():this.getArchivedFiles()
}
getTotalPages() {
  return Math.ceil(this.totalRecord / this.recordsPerPage);
}
formatTableTime(time: any): string {
  
  const [hours, minutes, seconds] = time?.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, seconds);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

applyStatus: boolean = false;
selectedDateRange: string = 'Today';
customFromDate: Date | null = null;
customToDate: Date | null = null;
filterdialedNumber: any = 'All';
filters = {
  Dialed: false,
  ExtensionNumber: false,
  AgentID: false,
  callDirection: false,
  Color: false
};
 // Set Date Range
  setDateRange(range: string) {
    this.applyStatus = true
    this.selectedDateRange = range;

    const today = new Date();
    let startDateTime: string = '0000-00-00 00:00:00';
    let endDateTime: string = '0000-00-00 23:59:59';

    switch (range) {
      case 'Today':
        startDateTime = endDateTime = today.toISOString().split('T')[0] + ' ' + '00:00:00';
        this.reqBody.inDateType = "Today";

        break;
      case 'This Week':
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        const endOfWeek = new Date(today.setDate(startOfWeek.getDate() + 6));
        startDateTime = startOfWeek.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfWeek.toISOString().split('T')[0] + ' ' + '23:59:59';
        this.reqBody.inDateType = "This Week";
        break;
      case 'This Month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 2);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        startDateTime = startOfMonth.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfMonth.toISOString().split('T')[0] + ' ' + '23:59:59';
        this.reqBody.inDateType = "This Month";

        break;
      case 'This Quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        startDateTime = startOfQuarter.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfQuarter.toISOString().split('T')[0] + ' ' + '23:59:59';
        this.reqBody.inDateType = "This Quarter";

        break;
      case 'This Year':
        const startOfYear = new Date(today.getFullYear(), 0, 2); // January is month 0
        const endOfYear = new Date(today.getFullYear(), 11, 32); // December is month 11
        startDateTime = startOfYear.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfYear.toISOString().split('T')[0] + ' ' + '23:59:59';
        this.reqBody.inDateType = "This Year";

        break;

      case 'Custom':
        this.openCustomDateDialog();
        return;
    }

    // Update the reqBody object
    this.reqBody.inCallStartDateTime = startDateTime;
    this.reqBody.inCallEndDateTime = endDateTime;


  }
  addfilters = {
    date: new Date().toISOString().split('T')[0]
  };

  availableFilters = [
    { name: 'Dialed', key: 'dialed', value: false },
    { name: 'Menu.REPORTS RECORDING.CALLS.Extension', key: 'extension', value: false },
    { name: 'Agent', key: 'agent', value: false },
    { name: 'Menu.REPORTS RECORDING.CALLS.Direction', key: 'direction', value: false },
    { name: 'Menu.REPORTS RECORDING.CALLS.Color', key: 'color', value: false },
    { name: 'Menu.REPORTS RECORDING.CALLS.Agent Name', key: 'agentName', value: false },
    { name: 'Menu.REPORTS RECORDING.CALLS.Extension Label', key: 'extensionLabel', value: false },
    { name: 'Menu.REPORTS RECORDING.CALLS.Tags', key: 'tags', value: false }
  ];
    translateAvailableFilters(): void {
      this.availableFilters.forEach(filter => {
        this.translate.get(filter.name).subscribe(translatedName => {
          filter.name = translatedName; // Replace with translated value
        });
      });
    }
    appliedFilters: Filter[] = [];  // Specify the type of appliedFilters as an array of Filter
    menuTriggerRefs: string[] = this.availableFilters.map((filter, index) => `filterData${index}`);
  
    currentFilterKey: string | null = null;
  
    getMenu(index: number): MatMenu | null {
      const menuArray = this.menus.toArray();
      return menuArray[index] || null;
    }
  
    filteroption(filterKey: string) {
      this.currentFilterKey = this.availableFilters.find(filter => filter.key === filterKey)?.key || null;
    }
    audioURL: string | null = null;
    filteredDialedNumbers = [...this.uniqueDialedNumbers];
    filteredExtensionNumbers = [...this.uniqueExtentionNumbers];
    filteredExtensionLabel = [...this.uniqueExtentionLabel];
    filteredAgentName = [...this.uniqueAgentName];
    filteredTagName = [...this.uniqueTagName]
    filteredAgentNumbers = [...this.uniqueAgentNumbers];
    filteredDirectionNumbers = [...this.uniqueDirectionNumbers];
    // filteredColors = [...this.uniqueColors];
  
    selectedDialedNumbersMap: { [key: string]: boolean } = {};
    selectedDialedNumbers: string[] = [];
  
    selectedExtensionNumbersMap: { [key: string]: boolean } = {};
    selectedExtensionNumbers: string[] = [];
  
    selectedExtensionLabelMap: { [key: string]: boolean } = {};
    selectedExtensionLabel: string[] = [];
  
    selectedTagLabelMap: { [key: string]: boolean } = {};
    selectedTagLabel: string[] = [];
  
    selectedAgentNameMap: { [key: string]: boolean } = {};
    selectedAgentName: string[] = [];
  
    selectedAgentNumbersMap: { [key: string]: boolean } = {};
    selectedAgentNumbers: string[] = [];
  
    selectedDirectionNumbersMap: { [key: string]: boolean } = {};
    selectedDirectionNumbers: string[] = [];
  
    selectedColorsMap: { [key: string]: boolean } = {};
  searchdialNumber: any = '';
  searchExtensionLabel: any = '';
  searchAgentName: any = '';
  searchTagName: any = '';
  selectedColors: Color[] = [];
  downloadData: TableData[] = [];

    // selectedColors: string[] = [];
    // Apply filter Button
    applyFilters() {
      
      this.data = []
      this.downloadData = []
  
      if (!this.data) {
        console.log('No data available');
        return;
      }
      const hasFiltersApplied = (
        this.searchdialNumber?.length > 0 ||
        this.selectedExtensionNumbers?.length > 0 ||
        this.selectedAgentNumbers?.length > 0 ||
        this.selectedColors?.length > 0 ||
        this.selectedDirectionNumbers?.length > 0 ||
        this.selectedExtensionLabel?.length > 0 ||
        this.selectedAgentName?.length > 0 ||
        this.selectedTagLabel?.length > 0
      );
  
      if (!hasFiltersApplied) {
        // If no filters are applied, call `this.callreports()`
        console.log('No filters applied, fetching full report.');
        this.reqBody.inDialledNumber = null;
        this.reqBody.inExtensionNumber = null;
        this.reqBody.inCallDirection = null;
        this.reqBody.inAgentCode = null;
        this.reqBody.inColorCode = null;
        this.reqBody.inChannelName = null;
        this.reqBody.inTagName = null;
        this.reqBody.inAgentName = null;
        this.getCallsFromXML();
        return;
      } else {
  
        if (this.searchdialNumber.length !== 0) {
          // this.reqBody.inDialledNumber = this.selectedDialedNumbers.join(",");
          this.reqBody.inDialledNumber = this.searchdialNumber;
        }
        // if (this.selectedDialedNumbers.length !== 0) {
        //    this.reqBody.inDialledNumber = this.selectedDialedNumbers.join(",");
  
        // }
        if (this.selectedExtensionNumbers.length !== 0) {
          this.reqBody.inExtensionNumber = this.selectedExtensionNumbers.join(",");
        }
        if (this.selectedDirectionNumbers.length !== 0) {
          this.reqBody.inCallDirection = this.selectedDirectionNumbers.join(",");
        }
        if (this.selectedAgentNumbers.length !== 0) {
          this.reqBody.inAgentCode = this.selectedAgentNumbers.join(",");
        }
        if (this.selectedColors.length !== 0) {
          // Extract the colorCodeId values and join them into a comma-separated string
          this.reqBody.inColorCode = this.selectedColors.map(item => item.colorCodeId).join(",");
        }
        if (this.selectedExtensionLabel.length !== 0) {
          this.reqBody.inChannelName = this.selectedExtensionLabel.join(",");
        }
        if (this.selectedTagLabel.length !== 0) {
          this.reqBody.inTagName = this.selectedTagLabel.join(",");
        }
        if (this.selectedAgentName.length !== 0) {
          this.reqBody.inAgentName = this.selectedAgentName.join(",");
        }
        this.reqBody.inPageNumber = 1
        this.getCallsFromXML();
      }
  
      this.pageNumber = 1;
      this.currentPage = 0; // If using zero-based index for pages
      this.getCallsFromXML(); // Ensure records displayed correspond to the first page
  
      if (!this.dataSource) {
        console.log('No data matches the filters.');
      }
  
    }
  // Set Custom Date Range
  openCustomDateDialog() {
    const currentDate = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(currentDate.getMonth() + 1);
    const startDate = this.formatDate(currentDate)
    const endDate = this.formatDate(oneMonthFromNow)

    // Set Date Format
    const formatDate = (date: Date | null): string => {
      return date ? this.datePipe.transform(date, 'dd-MM-yyyy') || '' : '';
    }

    // Format dates
    const formattedCustomFromDate = formatDate(this.customFromDate);
    const formattedCustomToDate = formatDate(this.customToDate);

    const dialogRef = this.dialog.open(CustomDateComponent, {
      minWidth: '300px', height: '245px',
      data: {
        fromDate: formattedCustomFromDate || startDate,
        toDate: formattedCustomToDate || endDate
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reqBody.inCallStartDate = result.fromDate;
        this.reqBody.inCallEndDate = result.toDate;
        this.customFromDate = result.fromDate;
        this.customToDate = result.toDate;
        this.reqBody.inDateType = "Custom";
        this.selectedDateRange = 'Custom';
        this.getCallsFromXML()
      }
    });
  }

  // Fetch DialedNumbers, ExtensionNumbers and AgentNumbers
  fetchCallDetails() {
    const Reports = this.callReportApi.fetchcallReportsDetails(this.reqBody).subscribe(
      (res: any) => {
       
        const fetchCallDetails = res.callReports;

        // Filter and map unique values based on `valueType`
        this.filteredDialedNumbers = Array.from(new Set(
          fetchCallDetails.filter((item: { valueType: string }) => item.valueType === 'dialledNumber')
            .map((item: { uniqueValue: string }) => item.uniqueValue)
        ));

        this.filteredExtensionNumbers = Array.from(new Set(
          fetchCallDetails.filter((item: { valueType: string }) => item.valueType === 'extensionNumber')
            .map((item: { uniqueValue: string }) => item.uniqueValue)
        ));
        this.uniqueExtention = this.filteredExtensionNumbers

        this.filteredAgentNumbers = Array.from(new Set(
          fetchCallDetails.filter((item: { valueType: string }) => item.valueType === 'agentCode')
            .map((item: { uniqueValue: string }) => item.uniqueValue)
        ));
        this.uniqueAgent = this.filteredAgentNumbers

        this.filteredExtensionLabel = Array.from(new Set(
          fetchCallDetails.filter((item: { valueType: string }) => item.valueType === 'channelName')
            .map((item: { uniqueValue: string }) => item.uniqueValue)
        ));
        this.uniqueExtentionLabel = this.filteredExtensionLabel

        this.filteredAgentName = Array.from(new Set(
          fetchCallDetails.filter((item: { valueType: string }) => item.valueType === 'agentName')
            .map((item: { uniqueValue: string }) => item.uniqueValue)
        ));
        this.uniqueAgentName = this.filteredAgentName

        this.filteredTagName = Array.from(new Set(
          fetchCallDetails.filter((item: { valueType: string }) => item.valueType === 'tags')
            .map((item: { uniqueValue: string }) => item.uniqueValue)
        ));
        this.uniqueTagName = this.filteredTagName

      })

  }
  ColorCodes!: any[];
  filteredColorCodes: any[] = [];

  // Fetch color Codes
    colorCode() {
      const ColorCode = this.callReportApi.colorCode().subscribe(
        (res: any) => {
          this.ColorCodes = res.colorCode
          // Set Filter Color 
          this.originalColors = [...this.ColorCodes]; // Store a copy of the original colors
          // this.filteredColorCodes = [...this.ColorCodes];
          // this.filteredColors = this.filteredColorCodes.map(color => color.colorCode);
          this.filteredColorCodes = [...this.ColorCodes];
          this.filteredColors = this.filteredColorCodes.map(color => ({
            colorCode: color.colorCode,
            colorCodeId: color.colorCodeId
          }));
        }, error => {
          if (error.status === 403) {
            this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
          } else if (error.status === 401) {
            this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
          }
        }
      )
    }
  searchExtension: any;
  searchAgent: any;
  searchcolor: any;
  cancel(filter: any): void {
    filter.value = false;

    if (filter.key === 'dialed') {
      this.searchdialNumber = ''
      this.reqBody.inDialledNumber = null;
      this.selectedDialedNumbers = [];
      Object.keys(this.selectedDialedNumbersMap).forEach(key => {
        this.selectedDialedNumbersMap[key] = false;
      });
    } else if (filter.key === 'extension') {
      this.searchExtension = '';
      this.selectedExtensionNumbers = [];
      Object.keys(this.selectedExtensionNumbersMap).forEach(key => {
        this.selectedExtensionNumbersMap[key] = false;
      });
    } else if (filter.key === 'agent') {
      this.searchAgent = '';
      this.selectedAgentNumbers = [];
      Object.keys(this.selectedAgentNumbersMap).forEach(key => {
        this.selectedAgentNumbersMap[key] = false;
      });
    } else if (filter.key === 'direction') {
      this.selectedDirectionNumbers = [];
      Object.keys(this.selectedDirectionNumbersMap).forEach(key => {
        this.selectedDirectionNumbersMap[key] = false;
      });
    } else if (filter.key === 'color') {
      this.searchcolor = '';
      this.selectedColors = [];
      Object.keys(this.selectedColorsMap).forEach(key => {
        this.selectedColorsMap[key] = false;
      });
      this.reqBody.inColorCode = null
    } else if (filter.key === 'agentName') {
      this.searchAgentName = '';
      this.selectedAgentName = [];
      Object.keys(this.selectedAgentNameMap).forEach(key => {
        this.selectedAgentNameMap[key] = false;
      });
      this.reqBody.inAgentName = null
    } else if (filter.key === 'extensionLabel') {
      this.searchExtensionLabel = '';
      this.selectedExtensionLabel = [];
      Object.keys(this.selectedExtensionLabelMap).forEach(key => {
        this.selectedExtensionLabelMap[key] = false;
      });
      this.reqBody.inChannelName = null
    }else if (filter.key === 'tags') {
      this.searchTagName = '';
      this.selectedTagLabel = [];
      Object.keys(this.selectedTagLabelMap).forEach(key => {
        this.selectedTagLabelMap[key] = false;
      });
      this.reqBody.inTagName = null
    }
  }
// actions

 // Audio Play
 private wavesurfer!: WaveSurfer;
  loadingWave: any;
  playButton = false
  pauseButton = true
  showTime: any;
  audioDiv: any;
 toggleAudio(fileName: any, ) {
  let audioStatus: any = {};
  audioStatus.status = true;
  audioStatus.type = 'Audio';
  this.audioDiv = true;
  let archiveAudio=true
  let body={fileName,audioStatus,archiveAudio,mountedPoint:this.mountedPoint}
  this.callReportApi.audiocallReports(body).subscribe((res: any) => {
    this.loadingWave = res
    if (!this.wavesurfer) {
      this.wavesurfer = WaveSurfer.create({
        container: '#wavesurferContainer',
        backend: 'MediaElement',
        waveColor: '#ff4e00',
        progressColor: '#5A9158',
        barWidth: 2,
        barRadius: 3,
        fillParent: true,
        cursorWidth: 1,
        height: 80,
      });
    }
    else {
      this.wavesurfer.destroy();
      this.wavesurfer = WaveSurfer.create({
        container: '#wavesurferContainer',
        backend: 'MediaElement',
        waveColor: '#ff4e00',
        progressColor: '#5A9158',
        barWidth: 2,
        barRadius: 3,
        fillParent: true,
        cursorWidth: 1,
        height: 80,
      });
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const audioURL = URL.createObjectURL(blob);

      this.wavesurfer.load(audioURL);
      this.wavesurfer.on('ready', () => {
        this.wavesurfer.play();
      });
      this.wavesurfer.on('finish', () => {
        this.playButton = true;
        this.pauseButton = false;
      });
    };
    this.wavesurfer.on('audioprocess', (time: number) => {
      const formattedTime = this.formatTime(time);
      this.showTime = formattedTime

    });
    reader.readAsArrayBuffer(res);
  });
}
// Set Time
formatTime(time: number): string {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${formattedMinutes}:${formattedSeconds}`;
}
// play Wave surfer
playAudio(): void {

  if (this.wavesurfer) {
    this.wavesurfer.play();
    this.playButton = false
    this.pauseButton = true
  }
}
// pause Wave surfer
pauseAudio(): void {
  if (this.wavesurfer) {
    this.wavesurfer.pause();
    this.playButton = true
    this.pauseButton = false
  }
}
// stop Wave surfer
stopAudio(): void {
  if (this.wavesurfer) {
    this.wavesurfer.stop();
    this.playButton = true
    this.pauseButton = false
  }
}
// close Wave surfer
closeWavesurfer() {
  if (this.wavesurfer) {
    this.wavesurfer.destroy();
  }
  this.audioDiv = false
  this.playButton = false
  this.pauseButton = true
}
  // Feedback add
  feedbackOpen(recordingCallLogId: any, supervisorFeedBack: any) {
    const dialogRef = this.dialog.open(FeedbackComponent, {
      width: '700px', 
      height: 'auto',
      data: {
        isEditable:false,
        recordingCallLogId: recordingCallLogId,
        supervisorFeedBack: supervisorFeedBack
      },
    });


  }
  // Open Notes
  openNotes(recordingCallLogId: any, notes: any) {
    const dialogRef: MatDialogRef<NotePopupComponent> = this.dialog.open(NotePopupComponent, {
      width: "400px",
      height: "auto",
      data: {  isEditable:false,recordingCallLogId: recordingCallLogId, noteValue: notes },
    });
  
  }
  // Open Call Tagging
  openCallTagging(row: any, recordingCallLogId: any) {
    const dialogRef: MatDialogRef<CallTaggingComponent> = this.dialog.open(CallTaggingComponent, {
      width: "600px",
      height: "700px",
      data: {isEditable:false, row: row, recordingCallLogId: recordingCallLogId,mountedPoint:this.mountedPoint },
    });
    
  }
  allFiltersSelected(): boolean {
    return this.availableFilters.every(filter => filter.value); // Returns true if all filters are selected
  }
  isAnyFilterSelected(): boolean {
    // Check if either selectedDateRange is not null or any filter is selected
    return this.applyStatus || this.availableFilters.some(filter => filter.value);
  }
  allowOnlyDigits(event: KeyboardEvent): void {
    const charCode = event.charCode || event.keyCode;
    // Allow only digits (char codes 48-57)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  toggleSelectAllExtensions(event: any): void {
    const isChecked = event.checked;
    this.filteredExtensionNumbers.forEach(number => {
      this.selectedExtensionNumbersMap[number] = isChecked;
    });
    this.updateSelectedExtensionNumbers();
  }
  toggleSelectAllExtensionsLabel(event: any): void {
    const isChecked = event.checked;
    this.filteredExtensionLabel.forEach(number => {
      this.selectedExtensionLabelMap[number] = isChecked;
    });
    this.updateSelectedExtensionLabel();
  }
  toggleSelectAllAgentName(event: any): void {
    const isChecked = event.checked;
    this.filteredAgentName.forEach(number => {
      this.selectedAgentNameMap[number] = isChecked;
    });
    this.updateSelectedAgentName();
  }
  toggleSelectAllTagName(event: any): void {
    const isChecked = event.checked;
    this.filteredTagName.forEach(number => {
      this.selectedTagLabelMap[number] = isChecked;
    });
    this.updateSelectedTagLabel();
  }
  isAllExtensionsSelected(): boolean {
    return this.filteredExtensionNumbers.every(number => this.selectedExtensionNumbersMap[number]);
  }
  isAllExtensionsLabelSelected(): boolean {
    return this.filteredExtensionLabel.every(number => this.selectedExtensionLabelMap[number]);
  }
  isAllAgentNameSelected(): boolean {
    return this.filteredAgentName.every(number => this.selectedAgentNameMap[number]);
  }
  isAllTagNameSelected(): boolean {
    return this.filteredTagName.every(number => this.selectedTagLabelMap[number]);
  }
  isExtensionIndeterminate(): boolean {
    const selectedCount = this.filteredExtensionNumbers.filter(number => this.selectedExtensionNumbersMap[number]).length;
    return selectedCount > 0 && selectedCount < this.filteredExtensionNumbers.length;
  }
  isExtensionLabelIndeterminate(): boolean {
    const selectedCount = this.filteredExtensionLabel.filter(number => this.selectedExtensionLabelMap[number]).length;
    return selectedCount > 0 && selectedCount < this.filteredExtensionLabel.length;
  }
  isAgentNameIndeterminate(): boolean {
    const selectedCount = this.filteredAgentName.filter(number => this.selectedAgentNameMap[number]).length;
    return selectedCount > 0 && selectedCount < this.filteredExtensionLabel.length;
  }
  isTagNameIndeterminate(): boolean {
    const selectedCount = this.filteredTagName.filter(number => this.selectedTagLabelMap[number]).length;
    return selectedCount > 0 && selectedCount < this.filteredTagName.length;
  }
  // Agent Filter
  isAllAgentSelected(): boolean {
    return this.filteredAgentNumbers.every(number => this.selectedAgentNumbersMap[number]);
  }

  isAgentIndeterminate(): boolean {
    const selectedCount = this.filteredAgentNumbers.filter(number => this.selectedAgentNumbersMap[number]).length;
    return selectedCount > 0 && selectedCount < this.filteredAgentNumbers.length;
  }

  toggleSelectAllAgents(event: any): void {
    const isChecked = event.checked;
    this.filteredAgentNumbers.forEach(number => {
      this.selectedAgentNumbersMap[number] = isChecked;
    });
    this.updateSelectedAgentNumbers();
  }




  selectAll: boolean = false;

  toggleSelectAll(): void {

    // Set all individual checkboxes based on the "All" checkbox state
    for (const number of this.filteredDirectionNumbers) {
      this.selectedDirectionNumbersMap[number] = this.selectAll;
    }
    this.updateSelectedDirectionNumbers();
  }

  updateSelectedDirectionNumbers(): void {

    this.selectedDirectionNumbers = Object.keys(this.selectedDirectionNumbersMap).filter(key => this.selectedDirectionNumbersMap[key]);

    // Logic to handle updates when individual checkboxes are toggled
    const allSelected = this.filteredDirectionNumbers.every(
      (number) => this.selectedDirectionNumbersMap[number]
    );
    this.selectAll = allSelected;
  }
  updateSelectedDialedNumbers() {
    this.selectedDialedNumbers = Object.keys(this.selectedDialedNumbersMap).filter(key => this.selectedDialedNumbersMap[key]);
    // this.filterData();
  }
  updateSelectedExtensionNumbers() {
    this.selectedExtensionNumbers = Object.keys(this.selectedExtensionNumbersMap).filter(key => this.selectedExtensionNumbersMap[key]);
    // this.filterExtensionData();
  }
  updateSelectedAgentNumbers() {
    this.selectedAgentNumbers = Object.keys(this.selectedAgentNumbersMap).filter(key => this.selectedAgentNumbersMap[key]);
  }
  updateSelectedExtensionLabel() {
    this.selectedExtensionLabel = Object.keys(this.selectedExtensionLabelMap).filter(key => this.selectedExtensionLabelMap[key]);
    // this.filterExtensionData();
  }
  updateSelectedTagLabel() {
    this.selectedTagLabel = Object.keys(this.selectedTagLabelMap).filter(key => this.selectedTagLabelMap[key]);
    // this.filterExtensionData();
  }
  updateSelectedAgentName() {
    this.selectedAgentName = Object.keys(this.selectedAgentNameMap).filter(key => this.selectedAgentNameMap[key]);
    // this.filterExtensionData();
  }
  updateSelectedColors(values: any) {
    const index = this.selectedColors.indexOf(values); // Check if the color code exists in selectedColors

    if (index !== -1) {
      // If it exists, remove it
      this.selectedColors.splice(index, 1);
    } else {
      // If it doesn't exist, add it
      this.selectedColors.push(values);
    }

  }
  // Set Filter Dialed Number
  filterDialedNumbers(input: any) {
    const inputElement = input;
    const searchValue = inputElement.toLowerCase();

    this.filteredDialedNumbers = this.filteredDialedNumbers.filter(number =>
      number.toLowerCase().includes(searchValue)
    );
  }
  // Set Filter Extension Number
  filterExtensionNumbers(input: any) {
    const inputElement = input;
    const searchValue = inputElement.toLowerCase();
    if (searchValue.length != 0) {
      this.filteredExtensionNumbers = this.uniqueExtention.filter(number =>
        number.toLowerCase().includes(searchValue)
      );
    } else {
      this.fetchCallDetails();
    }

  }

  filterExtensionLabel(input: any) {
    const inputElement = input;
    const searchValue = inputElement.toLowerCase();

    if (searchValue.length != 0) {
      this.filteredExtensionLabel = this.uniqueExtentionLabel.filter(
        (number) => number && number.toLowerCase().includes(searchValue)
      );

    } else {
      this.fetchCallDetails();
    }

  }
  filterAgentName(input: any) {
    const inputElement = input;
    const searchValue = inputElement.toLowerCase();
    if (searchValue.length != 0) {
      this.filteredAgentName = this.uniqueAgentName.filter(
        (number) => number?.toLowerCase().includes(searchValue)
      );
    } else {
      this.fetchCallDetails();
    }

  }
  filterTagName(input: any) {
    const inputElement = input;
    const searchValue = inputElement.toLowerCase();
    if (searchValue.length != 0) {
      this.filteredTagName = this.uniqueTagName.filter(
        (number) => number?.toLowerCase().includes(searchValue)
      );
    } else {
      this.fetchCallDetails();
    }

  }
  // Set Filter Agent Number
  filterAgentNumbers(input: any) {
    const inputElement = input;
    const searchValue = inputElement.toLowerCase();
    if (searchValue.length != 0) {
      this.filteredAgentNumbers = this.uniqueAgent.filter(number =>
        number.toLowerCase().includes(searchValue)
      );
    } else {
      this.fetchCallDetails();
    }
  }
  // Set Filter Direction Number
  filterDirectionNumbers(input: any) {
    const inputElement = input;
    const searchValue = inputElement.toLowerCase();
    this.filteredDirectionNumbers = this.uniqueDirectionNumbers.filter(number =>
      number.toLowerCase().includes(searchValue)
    );
  }
  originalColors!: any[];

  filterColor(input: string) {
    const searchValue = input.trim().toLowerCase();
    if (searchValue) {
      this.filteredColors = this.originalColors.filter(item =>
        item.colorCode.toLowerCase().includes(searchValue)
      );
    } else {
      // Reset to the original list if the input is cleared
      this.filteredColors = [...this.originalColors];
    }
  }
// filter for archive list
selectedArchiveTypes: string[] = [];
selectedArchiveTypesMap: { [key: string]: boolean } = {};
selectAllTypes = false;

archiveTypes = ['Manual', 'Auto Daily', 'Auto Weekly', 'Auto Monthly'];

toggleArchiveType(type: string) {
  if (this.selectedArchiveTypesMap[type]) {
    this.selectedArchiveTypes.push(type);
  } else {
    this.selectedArchiveTypes = this.selectedArchiveTypes.filter(t => t !== type);
  }
  this.selectAllTypes = this.selectedArchiveTypes.length === this.archiveTypes.length;
}

toggleSelectAllTypes(selected: boolean) {
  this.selectAllTypes = selected;
  if (selected) {
    this.selectedArchiveTypes = [...this.archiveTypes];
    this.archiveTypes.forEach(type => this.selectedArchiveTypesMap[type] = true);
  } else {
    this.selectedArchiveTypes = [];
    this.archiveTypes.forEach(type => this.selectedArchiveTypesMap[type] = false);
  }

}
applyFiltersGetList(){
  this.getArchivedFiles()
}

}
