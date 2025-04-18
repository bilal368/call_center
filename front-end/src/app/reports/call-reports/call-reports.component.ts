import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { CustomDateComponent } from '../../shared/dialogComponents/custom-date/custom-date.component';
import { DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CallReportService } from '../../core/services/callReport/call-report.service'
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { AudioDialogComponent } from '../../shared/dialogComponents/audio-dialog/audio-dialog.component';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { NotePopupComponent } from '../../shared/dialogComponents/note-popup/note-popup.component';
import { ConfirmationDialogComponent } from '../../shared/dialogComponents/confirmation-dialog/confirmation-dialog.component';
import { FeedbackComponent } from '../feedback/feedback.component';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../core/shared/share.service';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';
import { UnlockrecordComponent } from '../../shared/dialogComponents/unlockrecord/unlockrecord.component';
import WaveSurfer from 'wavesurfer.js';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../core/services/authentication/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PopUpComponent } from '../../shared/dialogComponents/pop-up/pop-up.component';
import { CallTaggingComponent } from '../../shared/dialogComponents/call-tagging/call-tagging.component';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface TableData {
  playButton: any;
  pauseButton: boolean;
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

const ELEMENT_DATA: TableData[] = [];
@Component({
  selector: 'app-call-reports',
  standalone: true,
  imports: [MatCheckboxModule, HttpClientModule, MatIconModule, MatPaginatorModule, MatTableModule, FormsModule,
    MatFormFieldModule, MatSelectModule, MatButtonModule, MatMenuModule, MatTooltipModule,
    MatDialogModule, MatDatepickerModule, MatInputModule, MatNativeDateModule, CommonModule, TranslateModule,
    MatToolbar, MatToolbarModule, MatProgressBarModule, MatProgressSpinnerModule],
  providers: [DatePipe, CallReportService, AudioDialogComponent],
  templateUrl: './call-reports.component.html',
  styleUrl: './call-reports.component.css'
})
export class CallReportsComponent implements OnInit {

  @ViewChild('menu', { static: false }) menu!: ElementRef;
  @ViewChild('tableContainer', { static: false }) tableContainer!: ElementRef;

  ngAfterViewInit() {
    this.adjustMargin(); // Initial check
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.adjustMargin();
  }

  public adjustMargin() {
    // Count the number of filters with value: true
    const activeFiltersCount = this.availableFilters.filter(filter => filter.value).length;
    if (activeFiltersCount >= 7) {
      this.tableContainer.nativeElement.style.marginTop = '33px';
    } else {
      this.tableContainer.nativeElement.style.marginTop = '0';
    }
  }

  uniqueExtention: string[] = [];
  uniqueAgent: string[] = [];
  uniqueExtentionLabel: string[] = [];
  uniqueAgentName: string[] = [];
  uniqueTagName: string[] = [];
  archivedFiles: any;
  audio: any;
  currentAudioURL: any;
  insideStatus: boolean = false;
  audioFileName: any = null;

 
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChildren(MatMenu) menus!: QueryList<MatMenu>;

  data: TableData[] = [];
  downloadData: TableData[] = [];
  uniqueDialedNumbers: string[] = Array.from(new Set(this.data.map(item => item.dialed)));
  uniqueExtentionNumbers: string[] = Array.from(new Set(this.data.map(item => item.extensionNumber)));
  uniqueAgentNumbers: string[] = Array.from(new Set(this.data.map(item => item.agentCode)));
  uniqueDirectionNumbers: string[] = Array.from(new Set(this.data.map(item => item.direction)));
  uniqueColors: string[] = Array.from(new Set(this.data.map(item => item.colorCode)));
  filteredColors: { colorCode: string; colorCodeId: number }[] = [];

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
  displayedColumns: string[] = ['select', 'date', 'dialed', 'extensionLabel', 'agentName', 'duration', 'direction', 'action'];
  pagedData: TableData[] = [];
  currentPage: number = 0;
  pageNumber: number = 1;
  TotalRecords: number = 0;
  pageSize = 2;
  recordsPerPage: number = 10;
  dataSource1 = new MatTableDataSource<TableData>(ELEMENT_DATA);
  displayedRange: string | undefined;


  callFilter: any = {
    inDateType: 'Today',
    inDialledNumber: null,
    inExtensionNumber: null,
    inCallDirection: null,
    inAgentCode: null,
    inColorCode: null,
    inCallStartDateTime: null,
    inCallEndDateTime: null,
    inCallStartDate: null,
    inCallEndDate: null,
    inPageNumber: this.pageNumber,
    inRecordsPerPage: this.recordsPerPage,
    inUserId: null,
    inSortColumn: null,
    inSortOrder: null
  };

  dataSource = new MatTableDataSource<TableData>(this.data);
  selection = new SelectionModel<TableData>(true, []);
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
  // selectedColors: string[] = [];
  selectedColors: Color[] = [];
  searchExtension: any;
  searchAgent: any;
  searchcolor: any;
  filterName: any;
  noDataFound: boolean = false;
  ColorCodes!: any[];
  filteredColorCodes: any[] = [];
  selectedColor: string | null = null;
  searchTerm: any;
  private subscription: Subscription | undefined;
  private wavesurfer!: WaveSurfer;
  loadingWave: any;
  playButton = false
  pauseButton = true
  showTime: any;
  audioDiv: any;
  exportdata: any;
  originalColors!: any[];
  applyStatus: boolean = false;
  searchdialNumber: any = '';
  searchExtensionLabel: any = '';
  searchAgentName: any = '';
  searchTagName: any = '';
  selectedAction: string = 'Menu.REPORTS RECORDING.CALLS.LOCK';
  selectAll: boolean = false;
  todayLabel: string = '';
  thisWeekLabel: string = '';
  thisMonthLabel: string = '';
  thisQuarterLabel: string = '';
  thisYearLabel: string = '';

  constructor(public dialog: MatDialog, public datePipe: DatePipe,
    private callReportApi: CallReportService, private dialogRef: MatDialog,
    private sharedService: SharedService, private translate: TranslateService, private authService: AuthService,
    private exportService: SharedService) { }

  ngOnInit() {

    this.translateAvailableFilters()
    this.translate.get('Menu.REPORTS RECORDING.CALLS.Today').subscribe((translatedValue: string) => {
      this.selectedDateRange = translatedValue;  // Set the translated value
      this.callFilter.inDateType = 'Today'
    });
    this.translate.get([
      'Menu.REPORTS RECORDING.CALLS.Today',
      'Menu.REPORTS RECORDING.CALLS.This Week',
      'Menu.REPORTS RECORDING.CALLS.This Month',
      'Menu.REPORTS RECORDING.CALLS.This Quarter',
      'Menu.REPORTS RECORDING.CALLS.This Year',
    ]).subscribe((translations) => {
      this.todayLabel = translations['Menu.REPORTS RECORDING.CALLS.Today'];
      this.thisWeekLabel = translations['Menu.REPORTS RECORDING.CALLS.This Week'];
      this.thisMonthLabel = translations['Menu.REPORTS RECORDING.CALLS.This Month'];
      this.thisQuarterLabel = translations['Menu.REPORTS RECORDING.CALLS.This Quarter'];
      this.thisYearLabel = translations['Menu.REPORTS RECORDING.CALLS.This Year'];
    });
    this.fetchCallDetails();
    this.callreports();
    this.colorCode();

    this.subscription = this.sharedService.componentMethodCalled$.subscribe(() => {
      this.callreports();
    });
  }

  // Fetch DialedNumbers, ExtensionNumbers and AgentNumbers
  fetchCallDetails() {
    const Reports = this.callReportApi.fetchcallReportsDetails(this.callFilter).subscribe(
      (res: any) => {
        const fetchCallDetails = res.callReports;
        console.log(res)
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

      });

  }
  // Audio Play
  toggleAudio(row: TableData, recordingCallLogId: any, supervisorFeedBack: any) {
    this.audioFileName = row
    // Reset all play buttons
    this.pagedData.forEach(item => (item.playButton = true));

    const element = this.pagedData.find(item => item.recordedFileName === row);
    if (element) {
      element.playButton = !element.playButton;
    }

    this.loadingWave = '';
    this.pauseButton = true;
    this.playButton = false;
    const audioStatus: any = { status: true, type: 'Audio' };
    this.audioDiv = true;

    const body = { fileName: row, audioStatus };

    this.callReportApi.audiocallReports(body).subscribe((res: Blob) => {
      // Check Blob validity
      if (!res || res.size === 0) {
        console.error('Received an empty Blob from the server.');
        return;
      }

      console.log('Blob type:', res.type); // Debugging Blob type
      this.loadingWave = res;

      // Convert Blob to ArrayBuffer
      const reader = new FileReader();
      reader.onloadend = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: res.type });
        const audioURL = URL.createObjectURL(blob);

        console.log('Audio URL:', audioURL); // Debugging the URL

        // Revoke previous audio URL if applicable
        if (this.currentAudioURL) {
          URL.revokeObjectURL(this.currentAudioURL);
        }
        this.currentAudioURL = audioURL;

        // Destroy previous WaveSurfer instance if it exists
        if (this.wavesurfer) {
          this.wavesurfer.destroy();
          // this.wavesurfer = null;
        }

        // Create a new WaveSurfer instance
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

        // Event listeners
        this.wavesurfer.on('ready', () => {
          console.log('WaveSurfer is ready to play the audio.');
          this.wavesurfer.play();
        });

        this.wavesurfer.on('finish', () => {
          this.playButton = true;
          this.pauseButton = false;
        });

        this.wavesurfer.on('audioprocess', (time: number) => {
          const formattedTime = this.formatTime(time);
          this.showTime = formattedTime;
        });

        // Load audio into WaveSurfer
        this.wavesurfer.load(audioURL);

        // Revoke URL after it's loaded
        this.wavesurfer.once('ready', () => {
          URL.revokeObjectURL(audioURL);
        });
      };

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
    if (this.audioFileName) {
      // Reset all play buttons
      this.pagedData.forEach(item => (item.playButton = true));

      const element = this.pagedData.find(item => item.recordedFileName === this.audioFileName);
      if (element) {
        element.playButton = false;
      }
    }

    if (this.wavesurfer) {
      this.wavesurfer.play();
      this.playButton = false
      this.pauseButton = true
    }
  }
  // pause Wave surfer
  pauseAudio(row: any): void {
    if (this.audioFileName) {
      // Reset all play buttons
      this.pagedData.forEach(item => (item.playButton = true));

      const element = this.pagedData.find(item => item.recordedFileName === this.audioFileName);
      if (element) {
        element.playButton = true;
      }
    }
    if (row) {
      this.pagedData.forEach(item => (item.playButton = true));
      const element = this.pagedData.find(item => item.recordedFileName === row);
      if (element) {
        element.playButton = true;
        this.insideStatus = true;
      }
    }

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
      try {
        this.wavesurfer.stop(); // Stop playback if it's active
        this.wavesurfer.destroy();
      } catch (error) {
        console.error("Error while closing WaveSurfer:", error);
      }
    }

    this.audioDiv = false;
    this.playButton = false;
    this.pauseButton = true;
    this.pagedData.forEach(item => item.playButton = true);
  }

  // Fetch Call Report
  callreports() {
    this.callFilter.inUserId = this.authService.extractDataFromToken(localStorage.getItem('token')).userId;
    const Reports = this.callReportApi.getcallReports(this.callFilter).subscribe(
      (res: any) => {
        this.data = res.callReports[0];

        // Populate unique arrays from the fetched data
        this.uniqueDialedNumbers = Array.from(new Set(this.data.map(item => item.dialledNumber)));
        // this.uniqueExtentionNumbers = Array.from(new Set(this.data.map(item => item.extensionNumber)));
        // this.uniqueAgentNumbers = Array.from(new Set(this.data.map(item => item.agentCode)));
        this.uniqueDirectionNumbers = Array.from(new Set(this.data.map(item => item.callDirection)));
        this.uniqueColors = Array.from(new Set(this.data
          .map(item => item.colorCode)
          .filter(colorCode => colorCode !== null)
        ));


        // Populate the filtered arrays for the UI
        // this.filteredDialedNumbers = [...this.uniqueDialedNumbers];
        // this.filteredExtensionNumbers = [...this.uniqueExtentionNumbers];
        // this.filteredAgentNumbers = [...this.uniqueAgentNumbers];

        this.filteredDirectionNumbers = [1, 0].map(String);

        this.TotalRecords = res.callReports[1][0].TotalRecords;
        this.pagedData = res.callReports[0].map((item: any) => ({
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
          duration: item.duration || '',
          playButton: true,
          pauseButton: false
        })
        );
      },
      (Error: { status: number }) => {
        console.log("Error:", Error);
        if (Error.status === 403) {
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' }, disableClose: true });
        } else if (Error.status === 401) {
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' }, disableClose: true });
        }
      }
    );


  }
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
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
        } else if (error.status === 401) {
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
        }
      }
    )
  }
  // Search Color Code
  onSearch(searchTerm: any): void {
    this.filteredColorCodes = this.ColorCodes.filter(color =>
      color.colorCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  // Update Color code Selected
  onColorSelect(color: any, recordingCallLogId: any): void {
    const loginId = this.authService.extractDataFromToken(localStorage.getItem('token')).userId;
    this.selectedColor = color.colorCodeId;
    const updateColorCode = this.callReportApi.updatecolorCode(this.selectedColor, recordingCallLogId, loginId).subscribe(
      (res: any) => {
        this.callreports();
        if (res.status) {
          this.dialog.closeAll()
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: res.message },
          });
        }
      }, error => {
        if (error.status === 404) {
          this.dialog.closeAll()
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: error.error.message },
          });
        }
        else if (error.status === 403) {
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
        } else if (error.status === 401) {
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
        }
      });
  }
  // Open Notes
  openNotes(recordingCallLogId: any, notes: any) {
    const dialogRef: MatDialogRef<NotePopupComponent> = this.dialog.open(NotePopupComponent, {
      width: "400px",
      height: "auto",
      data: { isEditable: true, recordingCallLogId: recordingCallLogId, noteValue: notes },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.callreports();
    })
  }
  // Open Call Tagging
  openCallTagging(row: TableData, recordingCallLogId: any) {
    const dialogRef: MatDialogRef<CallTaggingComponent> = this.dialog.open(CallTaggingComponent, {
      width: "600px",
      height: "700px",
      data: { isEditable: true, row: row, recordingCallLogId: recordingCallLogId },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.callreports();
    })
  }
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
        this.callFilter.inDateType = "Today";

        break;
      case 'This Week':
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        const endOfWeek = new Date(today.setDate(startOfWeek.getDate() + 6));
        startDateTime = startOfWeek.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfWeek.toISOString().split('T')[0] + ' ' + '23:59:59';
        this.callFilter.inDateType = "This Week";
        break;
      case 'This Month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 2);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        startDateTime = startOfMonth.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfMonth.toISOString().split('T')[0] + ' ' + '23:59:59';
        this.callFilter.inDateType = "This Month";

        break;
      case 'This Quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        startDateTime = startOfQuarter.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfQuarter.toISOString().split('T')[0] + ' ' + '23:59:59';
        this.callFilter.inDateType = "This Quarter";

        break;
      case 'This Year':
        const startOfYear = new Date(today.getFullYear(), 0, 2); // January is month 0
        const endOfYear = new Date(today.getFullYear(), 11, 32); // December is month 11
        startDateTime = startOfYear.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfYear.toISOString().split('T')[0] + ' ' + '23:59:59';
        this.callFilter.inDateType = "This Year";

        break;

      case 'Custom':
        this.openCustomDateDialog();
        return;
    }

    // Update the callFilter object
    this.callFilter.inCallStartDateTime = startDateTime;
    this.callFilter.inCallEndDateTime = endDateTime;


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
        this.callFilter.inCallStartDate = result.fromDate;
        this.callFilter.inCallEndDate = result.toDate;
        this.customFromDate = result.fromDate;
        this.customToDate = result.toDate;
        this.callFilter.inDateType = "Custom";
        this.selectedDateRange = 'Custom';
        this.callreports();
      }
    });
  }
  // Set Date Format
  formatDate(date: Date | null): string {
    return date ? this.datePipe.transform(date, 'dd-MM-yyyy') || '' : '';
  }
  // Set Dialed Number
  setDialedNumber(dialed: string): void {
    this.filterdialedNumber = dialed;
    this.filterData();
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

  // Unlock record
  Unlock(input: any) {

    const recordingCallLogId = input.recordingCallLogId
    if (input.isLocked) {
      const dialogRef = this.dialog.open(UnlockrecordComponent, {
        width: '20%',
        height: '30%',
        data: {
          message: this.translate.instant('Menu.REPORTS RECORDING.CALLS.Unlock'),
          status: "Unlock"
        }
      })
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.callReportApi.LockSelectedcallReport(recordingCallLogId).subscribe((res: any) => {
            this.clearToggle();
            if (res.status) {
              this.callreports();
              this.dialog.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: { message: res.message },
              });
            }

          }, (Error: { status: number; }) => {
            console.log("Error:", Error);
            if (Error.status === 403) {
              // opens dialog for logout message
              this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } })
            }
            else if (Error.status === 401) {
              this.dialog.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: { message: "unauthorized message" },
              });
            }
          }
          )
        }
      });

    } else {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: "Already the record is Unlocked" },
      });
    }
  }
  // Select all records
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.pagedData ? this.pagedData.length : 0;
    return numSelected === numRows && numRows !== 0;
  }
  // Select Master Toggle
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.pagedData.forEach(row => this.selection.select(row));
  }
  // clear Toggle
  clearToggle() {
    this.selection.clear();
  }
  // Function for Pagination
  onItemsPerPageChange(event: MatSelectChange) {
    this.selection.clear();
    this.recordsPerPage = event.value;
    this.callFilter.inRecordsPerPage = this.recordsPerPage
    this.callFilter.inPageNumber = 1
    this.pageNumber = 1;
    this.updatePagedData()
    this.callreports();
    this.updateDisplayedRange();

  }

  goToPage(event: MatSelectChange) {
    this.selection.clear();
    const selectedPage = event.value; // event.value directly provides the selected page number
    this.pageNumber = parseInt(selectedPage, 10);
    if (this.pageNumber < 1 || this.pageNumber > this.getTotalPages()) {
      return;
    }
    this.callFilter.inPageNumber = this.pageNumber;
    this.updateDisplayedRange();
    this.callreports();
  }

  getPagesArray() {

    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }
  formatPageNumber(page: number): string {
    return page < 10 ? `0${page}` : `${page}`;
  }
  previousPage() {
    if (this.pageNumber > 1) {

      this.pageNumber--;
      this.callFilter.inRecordsPerPage = this.recordsPerPage;
      this.callFilter.inPageNumber = this.pageNumber;
      this.callreports();
      this.updateDisplayedRange();
      // Clear selection 
      this.selection.clear();
    }
  }
  getTotalPages() {
    return Math.ceil(this.TotalRecords / this.recordsPerPage);
  }
  nextPage() {
    if (this.pageNumber < this.getTotalPages()) {
      this.pageNumber++;
      this.callFilter.inRecordsPerPage = this.recordsPerPage;
      this.callFilter.inPageNumber = this.pageNumber
      this.callreports();
      this.updateDisplayedRange();
      // Clear selection
      this.selection.clear();
    }
  }

  updateDisplayedRange() {
    const startRecord = (this.pageNumber - 1) * this.recordsPerPage + 1;
    this.displayedRange = `${startRecord}`;
  }
  changePageSize(pageSize: number) {
    this.pageSize = pageSize;
    this.paginator.pageSize = pageSize;
    this.paginator.pageIndex = 0;
    this.paginator._changePageSize(pageSize);
  }


  updatePagedData() {
    this.TotalRecords = this.pagedData.length;
    const startIndex = this.currentPage * this.recordsPerPage;
    const endIndex = startIndex + this.recordsPerPage;
    this.pagedData = this.pagedData.slice(startIndex, endIndex);
    this.pageNumber = this.currentPage + 1;
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
      this.callFilter.inDialledNumber = null;
      this.callFilter.inExtensionNumber = null;
      this.callFilter.inCallDirection = null;
      this.callFilter.inAgentCode = null;
      this.callFilter.inColorCode = null;
      this.callFilter.inChannelName = null;
      this.callFilter.inTagName = null;
      this.callFilter.inAgentName = null;
      this.callreports();
      return;
    } else {

      if (this.searchdialNumber.length !== 0) {
        // this.callFilter.inDialledNumber = this.selectedDialedNumbers.join(",");
        this.callFilter.inDialledNumber = this.searchdialNumber;
      }
      // if (this.selectedDialedNumbers.length !== 0) {
      //    this.callFilter.inDialledNumber = this.selectedDialedNumbers.join(",");

      // }
      if (this.selectedExtensionNumbers.length !== 0) {
        this.callFilter.inExtensionNumber = this.selectedExtensionNumbers.join(",");
      }
      if (this.selectedDirectionNumbers.length !== 0) {
        this.callFilter.inCallDirection = this.selectedDirectionNumbers.join(",");
      }
      if (this.selectedAgentNumbers.length !== 0) {
        this.callFilter.inAgentCode = this.selectedAgentNumbers.join(",");
      }
      if (this.selectedColors.length !== 0) {
        // Extract the colorCodeId values and join them into a comma-separated string
        this.callFilter.inColorCode = this.selectedColors.map(item => item.colorCodeId).join(",");
      }
      if (this.selectedExtensionLabel.length !== 0) {
        this.callFilter.inChannelName = this.selectedExtensionLabel.join(",");
      }
      if (this.selectedTagLabel.length !== 0) {
        this.callFilter.inTagName = this.selectedTagLabel.join(",");
      }
      if (this.selectedAgentName.length !== 0) {
        this.callFilter.inAgentName = this.selectedAgentName.join(",");
      }
      this.callFilter.inPageNumber = 1
      this.callreports();
    }

    this.pageNumber = 1;
    this.currentPage = 0; // If using zero-based index for pages
    this.updatePagedData(); // Ensure records displayed correspond to the first page

    if (!this.pagedData.length) {
      console.log('No data matches the filters.');
    }

  }


  filterData(): void {
    if (this.selectedDialedNumbers.length > 0) {
      this.pagedData = this.data.filter(item => this.selectedDialedNumbers.includes(item.dialed));
    } else {
      this.updatePagedData();
    }
  }
  filterExtensionData(): void {
    if (this.selectedExtensionNumbers.length > 0) {
      this.pagedData = this.data.filter(item => this.selectedExtensionNumbers.includes(item.extensionNumber));
    } else {
      this.updatePagedData();
    }
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
  // updateSelectedDirectionNumbers() {
  //   this.selectedDirectionNumbers = Object.keys(this.selectedDirectionNumbersMap).filter(key => this.selectedDirectionNumbersMap[key]);
  // }
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
  cancel(filter: any): void {
    filter.value = false;

    if (filter.key === 'dialed') {
      this.searchdialNumber = ''
      this.callFilter.inDialledNumber = null;
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
      this.callFilter.inColorCode = null
    } else if (filter.key === 'agentName') {
      this.searchAgentName = '';
      this.selectedAgentName = [];
      Object.keys(this.selectedAgentNameMap).forEach(key => {
        this.selectedAgentNameMap[key] = false;
      });
      this.callFilter.inAgentName = null
    } else if (filter.key === 'extensionLabel') {
      this.searchExtensionLabel = '';
      this.selectedExtensionLabel = [];
      Object.keys(this.selectedExtensionLabelMap).forEach(key => {
        this.selectedExtensionLabelMap[key] = false;
      });
      this.callFilter.inChannelName = null
    } else if (filter.key === 'tags') {
      this.searchTagName = '';
      this.selectedTagLabel = [];
      Object.keys(this.selectedTagLabelMap).forEach(key => {
        this.selectedTagLabelMap[key] = false;
      });
      this.callFilter.inTagName = null
    }
    this.adjustMargin();
  }

  onMenuClose(): void {
    this.searchTerm = '';
    this.colorCode()
  }

  isLoading = false;
  exportToFile(fileType: string) {
    this.isLoading = true; // Start loading
    const selectedCalls = this.selection.selected;


    if (selectedCalls.length === 0) {
      const payload = {
        inDateType: `${this.callFilter.inDateType}`,
        inDialledNumber: this.callFilter.inDialledNumber,
        inExtensionNumber: this.callFilter.inExtensionNumber,
        inCallDirection: this.callFilter.inCallDirection,
        inAgentCode: this.callFilter.inAgentCode,
        inColorCode: this.callFilter.inColorCode,
        inCallStartDateTime: this.callFilter.inCallStartDateTime,
        inCallEndDateTime: this.callFilter.inCallEndDateTime,
        inCallStartDate: this.callFilter.inCallStartDate,
        inCallEndDate: this.callFilter.inCallEndDate,
        inPageNumber: null,
        inRecordsPerPage: null,
        inUserId: this.callFilter.inUserId,
        inSortColumn: this.callFilter.inSortColumn,
        inSortOrder: this.callFilter.inSortColumn
      };

      this.callReportApi.getcallReports(payload).subscribe(
        (res: any) => {
          this.downloadData = res.callReports[0];
          this.exportdata = this.downloadData.map(item => ({
            date: this.datePipe.transform(item.callStartTime, 'dd-MM-yyyy') || '',
            callStartTime: this.formatTableTime(this.datePipe.transform(item.callStartTime, 'HH:mm:ss')) || '',
            callEndTime: this.formatTableTime(this.datePipe.transform(item.callEndTime, 'HH:mm:ss')) || '',
            DialedNumber: item.dialledNumber && item.dialledNumber !== '' ? item.dialledNumber : 'No Data',
            CallerID: item.callerId && item.callerId !== '' ? item.callerId : 'No Data',
            agentName: item.agentName && item.agentName.toUpperCase() !== 'NULL' ? item.agentName : 'No Data',
            agentID: item.agentCode,
            extensionNumber: item.extensionNumber,
            extensionLabel: item.channelName,
            direction: item.callDirection === 1 ? 'Outbound' : 'Inbound',
            duration: item.duration
          }));
          this.exportService.generateFile(fileType, this.exportdata, 'Call Report');
          this.isLoading = false; // Stop loading after success
        },
        (error) => {
          console.error('Error exporting file:', error);
          this.isLoading = false; // Stop loading after failure
        }
      );
    } else {
      this.exportdata = selectedCalls.map(item => ({
        date: item.date,
        callStartTime: this.formatTableTime(item.callStartTime),
        callEndTime: this.formatTableTime(item.callEndTime),
        DialedNumber: item.dialledNumber && item.dialledNumber !== '' ? item.dialledNumber : 'No Data',
        CallerID: item.callerId && item.callerId !== '' ? item.callerId : 'No Data',
        agentName: item.agentName && item.agentName.toUpperCase() !== 'NULL' ? item.agentName : 'No Data',
        agentID: item.agentCode,
        extensionNumber: item.extensionNumber,
        extensionLabel: item.extensionLabel,
        direction: item.direction,
        duration: item.duration
      }));
      this.exportService.generateFile(fileType, this.exportdata, 'Call Report');
      this.isLoading = false; // Stop loading after success
    }
  }


  // Lock Reports
  lockReport() {
    console.log("selectedAction", `${this.selectedAction}`);
    const SelectedDatas = this.selection.selected
    if (SelectedDatas.length !== 0) {
      if (this.selectedAction == 'Menu.REPORTS RECORDING.CALLS.LOCK') {
        const loginId = this.authService.extractDataFromToken(localStorage.getItem('token')).userId;
        const dialogRef = this.dialog.open(UnlockrecordComponent, {
          width: '20%',
          height: '30%',
          data: {
            message: this.translate.instant('Menu.REPORTS RECORDING.CALLS.Lock'),
            status: "Lock"
          }
        })
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.callReportApi.LockcallReports(SelectedDatas, loginId).subscribe((res: any) => {
              this.clearToggle();
              if (res.status) {
                this.callreports();
                this.dialog.open(PopUpComponent, {
                  width: "500px",
                  height: "290px",
                  data: { message: res.message },
                });
              }

            }, (Error: { status: number; }) => {
              console.log("Error:", Error);
              if (Error.status === 403) {
                // opens dialog for logout message
                this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } })
              }
              else if (Error.status === 401) {
                this.dialog.open(PopUpComponent, {
                  width: "500px",
                  height: "290px",
                  data: { message: "unauthorized message" },
                });
              }
            }
            )
          }
        });
      } else {
        console.log("Unlock updates");
        const loginId = this.authService.extractDataFromToken(localStorage.getItem('token')).userId;
        const dialogRef = this.dialog.open(UnlockrecordComponent, {
          width: '20%',
          height: '30%',
          data: {
            message: this.translate.instant('Menu.REPORTS RECORDING.CALLS.Unlock'),
            status: "Unlock"
          }
        })
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.callReportApi.UnlockcallReports(SelectedDatas, loginId).subscribe((res: any) => {
              this.clearToggle();
              if (res.status) {
                this.callreports();
                this.dialog.open(PopUpComponent, {
                  width: "500px",
                  height: "290px",
                  data: { message: res.message },
                });
              }

            }, (Error: { status: number; }) => {
              console.log("Error:", Error);
              if (Error.status === 403) {
                // opens dialog for logout message
                this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } })
              }
              else if (Error.status === 401) {
                this.dialog.open(PopUpComponent, {
                  width: "500px",
                  height: "290px",
                  data: { message: "unauthorized message" },
                });
              }
            }
            )
          }
        });
      }

    } else {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: "Select any records" },
      });
    }

  }

  // Delete Reports
  deleteReport() {
    if (this.selection.selected.length > 0) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '20%',
        height: '30%',
        data: {
          clickedStatus: "deleteConfirmation",
          // message: "Are you sure you want to delete the selected records?"
          message: this.translate.instant('Menu.REPORTS RECORDING.CALLS.Delete')
        }
      }
      );
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          const SelectedDatas = this.selection.selected;
          const loginId = this.authService.extractDataFromToken(localStorage.getItem('token')).userId;
          this.callReportApi.deleteReports(SelectedDatas, loginId).subscribe(
            (res: any) => {
              this.clearToggle();
              if (res.status) {
                this.callreports();
                this.dialog.open(PopUpComponent, {
                  width: "500px",
                  height: "290px",
                  data: { message: res.message },
                });
              }
            },
            (Error: { status: number }) => {
              console.log("Error:", Error);
              if (Error.status === 403 || Error.status === 401) {
                this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
              }
            }
          );
        }
      });
    } else {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: "Select any records" },
      });
    }
  }
  // Audio Download
  audioDownload() {
    if (this.selection.selected.length > 0) {
      const SelectedDatas = this.selection.selected;

      // Create a new JSZip instance
      const zip = new JSZip();

      const audioPromises = SelectedDatas.map(data => {
        const recordedFileName = data.recordedFileName;
        const startDate = new Date(`${data.date}T${data.callStartTime}`);
        const endDate = new Date(`${data.date}T${data.callEndTime}`);
        const duration = data.duration;
        const callerId = data.callerId || 'N/A';
        const dialed = data.dialed || 'N/A';
        const extensionNumber = data.extensionNumber || 'N/A';
        const extensionLabel = data.extensionLabel || 'N/A';

        // Create text content
        const textContent = `
          RecordID         : ${recordedFileName}
          Start Time       : ${startDate.toLocaleString()}
          End Time         : ${endDate.toLocaleString()}
          Duration         : ${duration}
          CallerID         : ${callerId}
          Dialed Digits    : ${dialed}
          Channel          : ${extensionLabel}
          Extension        : ${extensionNumber}
          `.replace(/^/gm, ''); // Ensure no extra indentation

        // Add the .txt file to the ZIP
        zip.file(`${recordedFileName}.txt`, textContent);

        // Fetch the audio file from the API
        const body = { fileName: recordedFileName, audioStatus: { status: true, type: 'Download' } }
        return this.callReportApi.audiocallReports(body).toPromise()
          .then((audioBlob: any) => {
            // Add the audio file to the ZIP
            zip.file(`${recordedFileName}.wav`, audioBlob);
          });
      });

      // Wait for all audio files to be fetched and added to the ZIP
      Promise.all(audioPromises)
        .then(() => {
          // Generate the ZIP file
          zip.generateAsync({ type: 'blob' }).then(content => {
            // Trigger download
            saveAs(content, 'AudioFiles.zip');
          });
        })
        .catch(error => {
          console.error("Error fetching audio files:", error);
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: "Error downloading audio files." },
          });
        });
    } else {
      console.log('No data selected.');
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: "No records selected for download." },
      });
    }
  }
  // Merge & play audio 
  mergeAndPlay() {
    let audioList: Blob[] = [];
    let supervisorFeedBacks: string[] = [];
    let recordingCallLogIds: any[] = [];
    let audioNames: any[] = [];
    let audioStatus: any = {};
    audioStatus.status = false;
    audioStatus.type = 'Merge';

    if (this.selection.selected.length > 1 && this.selection.selected.length < 6) {
      let selectedDatas = this.selection.selected;
      const checkaudio = selectedDatas.length - 1
      const moduleName = "CALL REPORT";
      const action = "MERGE";
      const actionDescription = "Audio merged";
      this.callReportApi.updateAuditTrailReport(moduleName, action, actionDescription).subscribe((res: any) => { })
      selectedDatas.forEach((data, index) => {
        if (index === checkaudio) {
          audioStatus.status = true;
        }
        console.log("merge", audioStatus)
        const fileName = data.recordedFileName;
        const supervisorFeedBack = data.supervisorFeedBack;
        const recordingCallLogId = data.recordingCallLogId;
        audioNames.push(fileName);
        supervisorFeedBacks.push(supervisorFeedBack);
        recordingCallLogIds.push(recordingCallLogId);
        const body = { fileName: fileName, audioStatus: audioStatus }
        this.callReportApi.audiocallReports(body).subscribe(
          (res: any) => {
            audioList.push(res);

            if (audioList.length === selectedDatas.length) {
              // Open dialog once all audio files are loaded
              this.dialog.open(AudioDialogComponent, {
                width: '40%',
                height: '50%',
                data: {
                  audioBlobs: audioList,
                  supervisorFeedBacks,
                  recordingCallLogIds,
                  multiaudio: true,
                  audioNames: audioNames
                },
              });
            }
          },
          (error) => {
            console.error("Error:", error);
            if (error.status === 404) {
              this.dialog.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: { message: 'Audio not found' },
              });
            } else if (error.status === 403 || error.status === 401) {
              this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
            }
          }
        );
      });
    } else {

      if (this.selection.selected.length > 5) {
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: "Select Maximum 5 records" },
        });
      } else {
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: "Select atleast 2 records" },
        });
      }

    }
  }


  // Feedback add
  feedbackOpen(recordingCallLogId: any, supervisorFeedBack: any) {
    const dialogRef = this.dialog.open(FeedbackComponent, {
      width: '700px',
      height: 'auto',
      data: {
        isEditable: true,
        recordingCallLogId: recordingCallLogId,
        supervisorFeedBack: supervisorFeedBack
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.callreports();
      // this.updatePagedData();
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

  selectAction(action: string): void {
    this.selectedAction = action;
  }

  onActionChange(event: Event): void {
    const target = event.target as HTMLSelectElement; // Type assertion for type safety
    const action = target.value;

    if (action) {
      this.selectAction(action); // Calls the existing selectAction method
    }
  }

  formatTableTime(time: any): string {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

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




}
