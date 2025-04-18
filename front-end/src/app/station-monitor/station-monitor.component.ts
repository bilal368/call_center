import { Component, OnInit, ViewChild, NgModule, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { StationmonitoringService } from '../core/services/stationmonitor/stationmonitoring.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { WebSocketService } from '../core/services/websocket/web-socket-service.service';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog } from '@angular/material/dialog';
import { AudioForkPlayerComponent, PCMPlayer } from './audio-fork-player/audio-fork-player.component';
import { SharedService } from '../core/shared/share.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { DashboardService } from '../core/services/dashboard/dashboard.service';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/authentication/auth.service';

export interface PeriodicElement {
  ChannelID: any;
  Extension: string;
  // position: number;
  // weight: number;
  // symbol: string;
  // active:string;
  // status:string;
  Agent: string;
  AgentID: number;
  ChannelStatus: string;
  ExtensionName: string;
  CallerID: string;
  RecorderID: string;
  DialDigits: string;
  Active: boolean;
}

let ELEMENT_DATA: PeriodicElement[] = []

@Component({
  selector: 'app-station-monitor',
  standalone: true,
  imports: [MatButtonModule, MatToolbarModule, MatIconModule, MatInputModule, MatSlideToggleModule,
    MatCheckboxModule, MatTableModule, MatPaginatorModule, MatSelectModule,
    MatMenuModule, FormsModule, TranslateModule, MatTooltipModule],
  templateUrl: './station-monitor.component.html',
  styleUrl: './station-monitor.component.css',
  providers: [StationmonitoringService, WebSocketService]
})
export class StationMonitorComponent implements OnInit, OnDestroy {
  [x: string]: any;
  displayedColumns: string[] = ['extensionlable', 'extensionnumber', 'name', 'agentId', 'callerID', 'dailed', 'active', 'status', 'live'];
  extensionOptions: string[] = []
  agentOptions: string[] = [];
  statusOptions: string[] = ['Ringing', 'On Call', 'Offline', 'Idle'];
  dataSource: any
  clickedRows = new Set<PeriodicElement>();
  allGroupsChecked = false;
  allGroupsCheckedagent = false;
  allGroupsCheckedstatus = false;
  searchText = '';
  @ViewChild('checkboxElem') checkboxElem: any
  @ViewChild('checkboxElemagent') checkboxElemagent: any
  @ViewChild('checkboxElemstatus') checkboxElemstatus: any
  sortDirection: 'asc' | 'desc' = 'asc';
  isActive: any;
  private updateSubscription: any = Subscription;
  TotalRecords: number = 10; // Replace with your actual total records

  // recordsPerPage: number = 2;
  limit: number = 10;
  offset: number = 0;
  totalPages = 2;
  currentPage = 1;
  isPaused: boolean = true;
  // uuid: string = '';
  responseMessage: string = '';
  statusMessage: string = 'Waiting to start audio...';
  dataStatusMessage: string = '';
  isConnected: boolean = false;
  loading: boolean = false;
  play: boolean = false
  isDarkTheme: boolean = true;
  wsUrl = `${environment.wssocketIp}`;
  player: PCMPlayer | null = null; // Ensure it is declared as an instance of PCMPlayer
  ws = new WebSocket(this.wsUrl);
  jitterBuffer: Uint8Array[] = [];
  BUFFER_THRESHOLD: number = 10;
  activeUUID: string | null = null;

  toggleAll(event: any) {
    const checked = event.checked;
    this.dataSource.forEach((element: any) => element.checked = checked);
  }
  constructor(
    private stationmonitor: StationmonitoringService,
    private socketService: WebSocketService,
    private dialog: MatDialog,
    private router: Router,
    private exportService: SharedService,
    private dashboardApi: DashboardService,
    private authService: AuthService,
  ) {
    this.dataSource = new MatTableDataSource<PeriodicElement>();
  }

  @ViewChild(MatSort, { static: true }) sort: any = MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: any = MatPaginator;
  selectedRow: any;
  selectedExtension: any = []
  selectedAgent: any = []
  selectedStatus: any = []
  isPausedLocalStorage: boolean = true
  action: any;
  uuid: any
  // isPaused:boolean=false
  start(uuids: any, status: boolean) {
    this.isPaused = status
    this.router.navigateByUrl('')
  }

  stationMonitoringData: any = []
  ngOnInit(): void {
    this.fectingStationMonitorData([], [], [], this.offset, this.limit)
    this.dataSource.sort = this.sort;
    this.socketService.connect();
    this.updateSubscription = this.socketService
      .listen('userCountUpdate')
      .subscribe(() => {
        this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit);
      });
    this.calculateTotalPages();

    localStorage.removeItem('stationMonitoringData')
  }

  ngOnDestroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }

    this.socketService.disconnect();

    if (this.ws) {
      this.ws.close();
      // this.ws = null;
    }

    // const item = localStorage.getItem('UID')
    // this.stopAudio(item!,this.dataSource.data)
  }

  startAudioFork(uuidf: string, element: any) {
    const localStorageData = { uuidf: uuidf, ChannelID: element.ChannelID }
    const localStorageDataString = JSON.stringify(localStorageData)

    localStorage.setItem("UID", uuidf)

    localStorage.setItem('stationMonitoringData', localStorageDataString)
    element.isPaused = !element.isPaused;

    if (this.loading) {
      return;
    }

    this.loading = false;
    this.isPaused = false;
    this.play = true;

    const item = localStorage.getItem('UID')

    this.setupWebSocket();


    this.StationMonitorData.forEach((data: any, index: number) => {
      if (typeof data !== "object" || data === null || !data.ChannelID) {
        console.warn(`Skipping invalid entry at index ${index}:`, data);
        return; // Skip this item
      }

      if (String(data.ChannelID).trim() === String(element.ChannelID).trim()) {
        console.log('matched id');
        data.play = true;
      } else {
        console.log('not matching id');
        data.play = false;
      }
    });


    this.dataSource.data = this.StationMonitorData;
    this.dataSource.sort = this.sort;


  }

  // startAudioFork(uuidf: string, element: any) {

  //   const localStorageData = { uuidf: uuidf, ChannelID: element.ChannelID };
  //   const localStorageDataString = JSON.stringify(localStorageData);

  //   localStorage.setItem('stationMonitoringData', localStorageDataString);

  //   element.isPaused = !element.isPaused;

  //   const item = localStorage.getItem('UID');

  //   if (item) {
  //     if (item === uuidf) {
  //       // If the current UUID matches the stored one, start the audio
  //       this.setActiveUUID(uuidf);
  //       console.log('Audio fork started for UUID:', uuidf);

  //       // Simulate starting the audio on the frontend (for now, no backend calls)
  //       this.simulateStartAudio(uuidf);

  //     } else {
  //       // Stop the audio if a different UUID is stored
  //       this.stopAudio(item, element);
  //       this.setActiveUUID(uuidf);
  //       console.log('Audio fork started for UUID:', uuidf);

  //       // Simulate starting the audio for the new UUID
  //       this.simulateStartAudio(uuidf);

  //       // Update localStorage with the new UUID
  //       localStorage.setItem("UID", uuidf);
  //     }
  //   } else {
  //     // If no UUID is stored, set the new one and start the audio
  //     localStorage.setItem("UID", uuidf);
  //     this.setActiveUUID(uuidf);
  //     console.log('Audio fork started for UUID:', uuidf);

  //     // Simulate starting the audio for the first time
  //     this.simulateStartAudio(uuidf);
  //   }

  //   // Update play state for all station monitoring data based on ChannelID
  //   this.StationMonitorData.forEach((data: any) => {
  //     if (data.ChannelID === element.ChannelID) {
  //       data.play = true; // Start playing this station
  //     } else {
  //       data.play = false; // Stop other stations
  //     }
  //   });

  //   // Update the displayed data source with the new play state
  //   this.dataSource.data = this.StationMonitorData;
  //   this.dataSource.sort = this.sort;
  // }

  // Simulate the start of audio playback (no actual API calls)
  // simulateStartAudio(uuidf: string) {
  //   console.log(`Simulating start of audio for UUID: ${uuidf}`);
  //   // this.loading = true;
  //   this.isPaused = false;
  //   this.play = true;
  //   // Add any other frontend-specific logic for handling the UI updates here
  //   this.setupWebSocket();

  // }


  // startAudioFork(uuidf: string, element: any) {

  //   const localStorageData = { uuidf: uuidf, ChannelID: element.ChannelID }
  //   const localStorageDataString = JSON.stringify(localStorageData)

  //   localStorage.setItem('stationMonitoringData', localStorageDataString)
  //   element.isPaused = !element.isPaused;

  //   if (this.loading) {
  //     return;
  //   }

  //   const item = localStorage.getItem('UID')

  //   this.setupWebSocket();

  //   if (item) {
  //     if (item == uuidf) {
  //       this.setActiveUUID(uuidf);
  //       this.dashboardApi.stationMonitor(uuidf).subscribe(
  //         response => {
  //           console.log('Audio fork started for UUID:', response);
  //           this.setupWebSocket();
  //         },
  //         error => {
  //           console.error('Error starting audio fork:', error);
  //           this.resetActiveUUID();
  //         }
  //       ).add(() => {
  //         this.loading = false;
  //         this.isPaused = false;
  //         this.play = true;
  //       });
  //     } else {
  //       this.stopAudio(item, element)
  //       this.setActiveUUID(uuidf);

  //       this.dashboardApi.stationMonitor(uuidf).subscribe(
  //         response => {
  //           console.log('Audio fork started for UUID:', response);
  //           this.setupWebSocket();
  //         },
  //         error => {
  //           console.error('Error starting audio fork:', error);
  //           this.resetActiveUUID(); // Reset UUID on error
  //         }
  //       ).add(() => {
  //         this.loading = false;
  //         this.isPaused = false;
  //         this.play = true;
  //       });
  //       localStorage.setItem("UID", uuidf)
  //     }
  //   } else {
  //     localStorage.setItem("UID", uuidf)
  //     this.setActiveUUID(uuidf);

  //     this.dashboardApi.stationMonitor(uuidf).subscribe(
  //       response => {
  //         console.log('Audio fork started for UUID:', response);
  //         this.setupWebSocket();
  //       },
  //       error => {
  //         console.error('Error starting audio fork:', error);
  //         this.resetActiveUUID(); // Reset UUID on error
  //       }
  //     ).add(() => {
  //       this.loading = false;
  //       this.isPaused = false;
  //       this.play = true;
  //     });
  //   }

  //   this.StationMonitorData.forEach((data: any) => {
  //     if (data.ChannelID == element.ChannelID) {
  //       data.play = true
  //     } else {
  //       data.play = false
  //     }
  //   })
  //   this.dataSource.data = this.StationMonitorData;
  //   this.dataSource.sort = this.sort;
  // }

  stopAudio(uuid: string, element: any) {

    element.isPaused = !element.isPaused;

    if (this.player) {
      this.player.stop();
      this.player.destroy();
      this.player = null;
    }

    this.jitterBuffer = [];
    this.play = false;

    // this.dashboardApi.stopStationMonitor(uuid).subscribe(
    //   response => console.log('Stopped station monitor successfully:', response),
    //   error => console.error('Error stopping station monitor:', error)
    // );

    this.stationMonitoringData = localStorage.getItem('stationMonitoringData')
    if (this.stationMonitoringData != undefined) {

      const localStorageDataArr = JSON.parse(this.stationMonitoringData)
      this.StationMonitorData.forEach((data: any) => {
        if (data.ChannelID == localStorageDataArr.ChannelID) {
          data.play = false
        }
      })

      this.dataSource.data = this.StationMonitorData;
      this.dataSource.sort = this.sort;
    }

    localStorage.removeItem('stationMonitoringData')
    this.ws.close();
  }

  setActiveUUID(uuid: string) {
    this.activeUUID = uuid;
  }
  resetActiveUUID() {
    this.activeUUID = null;
  }

  currentUserId: any
  setupWebSocket() {

    if (this.ws) {
      this.ws.close();
      // this.ws = null;
    }

    const token = localStorage.getItem('token')
    const extractedData = this.authService.extractDataFromToken(token)
    const uuid = localStorage.getItem("UID")
    const userId = extractedData.userId

    const wsUrl = `${environment.wssocketIp}?userId=${userId}&uuid=${uuid}`;
    this.ws = new WebSocket(wsUrl);
    // this.ws = new WebSocket(environment.wssocketIp);
    this.ws.binaryType = 'arraybuffer';
    this.ws.onopen = (onopenEvent) => {
      console.log('WebSocket connection opened.');
      this.statusMessage = 'Connected to WebSocket server.';
      this.isConnected = true;

      this.jitterBuffer = [];
      this.removePlayer();
      this.initializePlayer();
    };

    this.ws.onmessage = (onmessageEvent) => {

      console.log("onmessage >>>>>>>>>>>>>>>>>>", onmessageEvent);
      const data = onmessageEvent.data

      // if (onmessageEvent.currentTarget) {
      //   const url = (onmessageEvent.currentTarget as WebSocket).url;
      //   console.log('WebSocket URL:', url);

      //   const urlObj = new URL(url);

      //    this.currentUserId = urlObj.searchParams.get('userid');

      // } else {
      //   console.error('currentTarget is null');
      // }

      // if (this.currentUserId == userId) {
      //   console.log("this.currentUserId", this.currentUserId);
      // console.log("userId", userId);
      const audioData = new Uint8Array(onmessageEvent.data);
      this.jitterBuffer.push(audioData);

      if (this.jitterBuffer.length >= this.BUFFER_THRESHOLD && this.player && !this.isPaused) {
        const combined = this.concatenateBuffers(this.jitterBuffer);
        this.player.feed(combined);
        this.jitterBuffer = [];
      }
      // }
      this.dataStatusMessage = `Receiving audio data: ${data.byteLength} bytes received`;
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.statusMessage = 'WebSocket error. Attempting to reconnect...';
      console.log(this.statusMessage);
      this.isConnected = false;
      console.log('WebSocket connection marked as disconnected.');
      this.reconnectWebSocket();
      console.log('Reconnection attempt initiated.');
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed.');
      this.statusMessage = 'WebSocket closed. Reconnecting...';
      console.log(this.statusMessage);
      this.isConnected = false;
      console.log('WebSocket connection marked as disconnected.');
      this.reconnectWebSocket();
      console.log('Reconnection attempt initiated.');
    };
  }

  reconnectWebSocket() {
    // if (!this.isPaused) {
    //   setTimeout(() => {
    //     this.setupWebSocket();
    //   }, 1000); // Reconnect after 1 second
    // }
  }

  initializePlayer() {
    console.log('Initializing player');
    if (!this.player) {
      this.player = new PCMPlayer({
        encoding: '16bitInt',
        channels: 1,
        sampleRate: 8000,
        flushingTime: 50
      });
    }
  }

  removePlayer() {
    const item = localStorage.getItem('UID')

    if (this.player) {
      this.player.stop(); // If PCMPlayer has a stop method
      this.player = null;
    } else {
      console.log('No player to remove');
    }

  }

  concatenateBuffers(bufferArray: Uint8Array[]) {
    let length = 0;
    bufferArray.forEach(buffer => length += buffer.length);

    const result = new Uint8Array(length);
    let offset = 0;
    bufferArray.forEach(buffer => {
      result.set(buffer, offset);
      offset += buffer.length;
    });

    return result;
  }

  StationMonitorData: any = []
  fectingStationMonitorData(agentFilterdata: any, extensionfilterdata: any, statusData: any, offset: any, limit: any) {

    let body = { agentFilterdata, extensionfilterdata, statusData, offset, limit }

    this.stationmonitor.getData(body).subscribe((result: any) => {
      ELEMENT_DATA = result.Data
      this.StationMonitorData = result.Data
      this.dataSource.data = result.Data;
      this.dataSource.sort = this.sort;
      this.extensionOptions = result.Extension;
      this.agentOptions = result.agentFilter;
      this.dataSource.paginator = this.paginator;
      this.TotalRecords = result.totalItems;

      this.stationMonitoringData = localStorage.getItem('stationMonitoringData')
      if (this.stationMonitoringData != undefined) {

        const localStorageDataArr = JSON.parse(this.stationMonitoringData)

        this.StationMonitorData.forEach((data: any) => {
          if (data.ChannelID == localStorageDataArr.ChannelID) {
            data.play = true
          } else {
            data.play = false
          }
        })
        this.dataSource.data = this.StationMonitorData;
        this.dataSource.sort = this.sort;
      }
      this.calculateTotalPages();


    })

  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  sortDataExtensionName() {
    const data = this.dataSource.data;

    if (this.sortDirection === 'asc') {
      this.dataSource.data = data.sort((a: { ChannelID: string }, b: { ChannelID: string }) => {
        const nameA = a.ChannelID ? a.ChannelID : '';
        const nameB = b.ChannelID ? b.ChannelID : '';
        return nameA.localeCompare(nameB);
      });
      this.sortDirection = 'desc';
    } else {
      this.dataSource.data = data.sort((a: { ChannelID: string }, b: { ChannelID: string }) => {
        const nameA = a.ChannelID ? a.ChannelID : '';
        const nameB = b.ChannelID ? b.ChannelID : '';
        return nameB.localeCompare(nameA);
      });
      this.sortDirection = 'asc';
    }

  }
  sortDataExtensionNumber() {
    const data = this.dataSource.data;
    if (this.sortDirection === 'asc') {
      this.dataSource.data = data.sort((a: { Extension: string; }, b: { Extension: any; }) => a.Extension.localeCompare(b.Extension));
      this.sortDirection = 'desc';
    } else {
      this.dataSource.data = data.sort((a: { Extension: any; }, b: { Extension: string; }) => b.Extension.localeCompare(a.Extension));
      this.sortDirection = 'asc';
    }
  }
  sortDataAgent() {
    const data = this.dataSource.data;
    if (this.sortDirection === 'asc') {
      this.dataSource.data = data.sort((a: { Agent: string; }, b: { Agent: any; }) => a.Agent.localeCompare(b.Agent));
      this.sortDirection = 'desc';
    } else {
      this.dataSource.data = data.sort((a: { Agent: any; }, b: { Agent: string; }) => b.Agent.localeCompare(a.Agent));
      this.sortDirection = 'asc';
    }
  }
  selectRow(row: any) {

    this.selectedRow = row.ChannelID;
  }
  getColumns(): any[] {
    const numberOfColumns = 3;
    const itemsPerColumn = Math.ceil(this.statusOptions.length / numberOfColumns);
    const columns = [];

    for (let i = 0; i < numberOfColumns; i++) {
      columns.push(this.statusOptions.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn));
    }

    return columns;
  }
  allcheckboxSelectionextension(data: any, event: any) {
    if (event._checked === true) {
      this.selectedExtension.push(data);
      this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, 0, 10)

    } else {
      const index = this.selectedExtension.indexOf(data);
      if (index !== -1) {
        this.selectedExtension.splice(index, 1);
        this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)
      }
    }






  }
  allcheckboxSelectionAgent(data: any, event: any) {
    if (event._checked === true) {
      this.selectedAgent.push(data);
      this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, 0, 10)
    } else {
      const index = this.selectedAgent.indexOf(data);
      if (index !== -1) {
        this.selectedAgent.splice(index, 1);
      }
      this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)
    }






  }
  allcheckboxSelectionStatus(data: any, event: any) {
    if (data == 'Ringing') {
      data = '4'

    } else if (data == 'On Call') {
      data = '2'
    } else if (data == 'Offline') {
      data = '3'
    } else if (data == 'Pick Up') {
      data = '1'
    }
    else {
      data = '0'
    }
    if (event._checked === true) {


      this.selectedStatus.push(data);
      this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, 0, 10)
    } else {
      const index = this.selectedStatus.indexOf(data);

      if (index !== -1) {
        this.selectedStatus.splice(index, 1);
        this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)
      }
    }





  }
  onSearch() {

    this.dataSource.data = ELEMENT_DATA.filter(entry => {

      return entry.ChannelID.toLowerCase().includes(this.searchText) ||
        entry.Extension.toLowerCase().includes(this.searchText) ||
        entry.DialDigits.toLowerCase().includes(this.searchText);
    });

  }

  onToggleChange(event: MatSlideToggleChange, element: any) {
    element.Active = event.checked ? 1 : 0; // Convert boolean to 1 or 0
    this.recorEnableDisable(element.ChannelID, element.Active)
    element.isActive = event.checked; // If you have a separate `isActive` boolean property
  }
  onItemsPerPageChange(event: MatSelectChange) {
    // this.recordsPerPage = event.value;
    this.limit = event.value;
    this.offset = 0;
    this.calculateTotalPages();
    this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)



  }
  nextPage() {
    if (this.offset + Number(this.limit) < this.TotalRecords) {
      this.offset = this.offset + Number(this.limit);
      this.currentPage++;
      this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)
    }




  }
  previousPage() {
    if (this.offset > 0) {
      this.offset -= Number(this.limit);// Decrease offset for the previous page
      this.currentPage--;
      this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)
    }
  }
  calculateTotalPages() {
    this.totalPages = Math.ceil(this.TotalRecords / this.limit);
  }
  getPagesArray() {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }
  goToPage(event: any) {
    this.currentPage = Number(event.value);
    this.offset = (this.currentPage - 1) * Number(this.limit);
    this.fectingStationMonitorData(this.selectedAgent, this.selectedExtension, this.selectedStatus, this.offset, this.limit)

  }

  recorEnableDisable(ChannelID: any, Active: any) {
    const body = { ChannelID, Active }


    this.stationmonitor.recordEnableDisable(body).subscribe(
      (response: any) => {
        // Handle the success response here
        console.log('API call successful:', response);
      },
      (error: any) => {
        // Handle the error response here
        console.error('Error occurred:', error);
      }
    );


  }
  exportToFile(fileType: string) {

    const newArray = this.dataSource.data.map((item: any) => ({
      "Extension Label": item.ChannelID,
      "Extension Number": item.Extension,
      "Agent Name": item.Agent,
      "Caller ID": item.CallerID,
      "Dialed Number": item.DialDigits,
      Active: item.Active == 1 ? 'Active' : 'Inactive',
      "Extension Status": item.ChannelStatus === "2" ? "On Call" :
        item.ChannelStatus === "0" ? "Idle" :
          item.ChannelStatus === "4" ? "Ringing" :
            item.ChannelStatus === "3" ? "Offline" : "Unknown",
    }));


    // window.print()
    this.exportService.generateFile(fileType, newArray, 'Station Monitoring')
  }

}
