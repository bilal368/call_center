import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/authentication/auth.service';
import { CallReportService } from '../../../core/services/callReport/call-report.service';
import WaveSurfer from 'wavesurfer.js';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PopUpComponent } from '../pop-up/pop-up.component';
import { LogoutSpinnerComponent } from '../logout-spinner/logout-spinner.component';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatTableModule } from '@angular/material/table';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-call-tagging',
  standalone: true,
  imports: [TranslateModule, MatToolbar, MatToolbarModule, MatIconModule,
    MatProgressBarModule, FormsModule, MatTableModule, MatTooltipModule],
  templateUrl: './call-tagging.component.html',
  styleUrl: './call-tagging.component.css'
})
export class CallTaggingComponent {
  audioDiv: boolean = false;
  loadingWave: any;
  playButton = true;
  pauseButton = false;
  isEditable:boolean=true
  mountedPoint:any;
  archiveAudio:boolean=false
  showTime: any = '00:00:00';
  private wavesurfer!: WaveSurfer;
  TotalRecords: any;
  newTagStatus: boolean = false;
  callTags: { id: number; tags: string; createdDate: string | null; isActive: number }[] = [];
  selectedTag: string = 'Rude';
  customTag: string = '';
  startPoint: string = '';
  endPoint: string = '';
  Description: string = '';
  callTaggingDetails = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['tagName', 'startTime', 'endTime', 'description', 'play', 'delete'];
  audioData: any;

  constructor(
    private translate: TranslateService,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService,
    private callReportApi: CallReportService,
    private dialogRef: MatDialog,
    private dialogComponent: MatDialogRef<CallTaggingComponent>
  ) {
    this.isEditable=data.isEditable
    if(!this.isEditable){
      this.mountedPoint=data.mountedPoint
      this.archiveAudio=true
    }
    this.toggleAudio(data.row, data.recordingCallLogId);
    this.fetchCallTagging();
    this.fetchCallTaggingDetails();
    
  }

  // Save Custom Call Tag
  saveCustomTag() {
    if (this.customTag.trim()) {
      const updateCallTagging = this.callReportApi.updateCallTagging(this.customTag).subscribe(
        (res: any) => {
          if (res.status) {
            this.selectedTag = this.customTag;
            this.fetchCallTagging();
          }
        }, error => {
          console.log("error", error);

          if (error.status === 404 || error.status === 409) {
            // this.dialog.closeAll()
            let message = error.statusText
            if (error.status === 409) {
              message = error.error.statusText
            }
            this.dialog.open(PopUpComponent, {
              width: "500px",
              height: "290px",
              data: { message: message },
            });
          }

          else if (error.status === 403) {
            this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
          } else if (error.status === 401) {
            this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
          }
        });

    } else {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: 'Please enter a valid tag.' },
      });
    }
  }
  // Fetch Fetch Call Tagging
  fetchCallTagging() {
    const fetchCallTagging = this.callReportApi.fetchCallTagging().subscribe(
      (res: any) => {
        if (res.status) {
          this.callTags = res.callTagg;
        }
      }, error => {
        if (error.status === 404) {
          this.dialog.closeAll()
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: error.statusText },
          });
        }
        else if (error.status === 403) {
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
        } else if (error.status === 401) {
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
        }
      });
  }
  // Audio file Created
  toggleAudio(row: any, recordingCallLogId: any) {
    let audioStatus: any = {};
    audioStatus.status = true;
    audioStatus.type = 'Audio';
    this.audioDiv = true;
    const body = { fileName: row, audioStatus: audioStatus,mountedPoint:this.mountedPoint,archiveAudio:this.archiveAudio }
    this.callReportApi.audiocallReports(body).subscribe((res: any) => {
      this.audioData = res
      this.wavesurferFunction(res)
    });
  }

  // Wave function created
  wavesurferFunction(res:any){
    this.loadingWave = res
    if (!this.wavesurfer) {
      this.wavesurfer = WaveSurfer.create({
        container: '#callTagging',
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
        container: '#callTagging',
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
        // this.wavesurfer.play();
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
  }

  // Set Time
  formatTime(time: number): string {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  resetForm() {
    this.Description = '';
    this.selectedTag = 'Rude';
    this.customTag = '';
    this.startPoint = '';
    this.endPoint = '';
  
  }
  
  // fetchCallTaggingDetails
  fetchCallTaggingDetails() {
    const fetchCallTagging = this.callReportApi.fetchCallTaggingDetails(this.data.recordingCallLogId).subscribe(
      (res: any) => {
        if (res.status) {
          
          this.callTaggingDetails.data = res.callTagg;
          this.callTaggingDetails.data.forEach((item) => {
            item.playButton = true;
            item.pauseButton = false;
          });
          
        }
      }, error => {
        if (error.status === 404) {
          this.dialog.closeAll()
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: error.statusText },
          });
        }
        else if (error.status === 403) {
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
        } else if (error.status === 401) {
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
        }
      });
  }

  // Coverting Time to seconds
  convertTimeToSeconds(time: string): number {
    const parts = time.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Delete Audio Tag
  deleteTag(tagId: number) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '20%',
      height: '30%',
      data: {
        clickedStatus: "deleteConfirmation",
        message: this.translate.instant('Menu.REPORTS RECORDING.CALLS.Delete Call TAG')
      }
    }
    );
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
      
    // Logic to delete the tag
    const deleteCallTaggingDetails = this.callReportApi.deleteCallTaggingDetails(tagId).subscribe(
      (res: any) => {
        if (res.status) {
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
           
            data: { message: 'Menu.REPORTS RECORDING.CALLS.Delete Call TAG status' },
          });
          // this.newTagStatus = false;
          this.fetchCallTaggingDetails();
        }
      }, error => {
        console.log("error", error);
        if (error.status === 404 || error.status === 409) {
          // this.dialog.closeAll()
          let message = error.statusText
          if (error.status === 409) {
            message = error.error.statusText
          }
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: message },
          });
        }

        else if (error.status === 403) {
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
        } else if (error.status === 401) {
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
        }
      });
    }
  })
  }
  // play Tag Wave surfer
  playTag(tag: any): void {
    const startPoint = this.convertTimeToSeconds(tag.startPoint); // Convert startPoint to seconds
    const endPoint = this.convertTimeToSeconds(tag.endPoint); // Convert endPoint to seconds
  
    if (this.wavesurfer) {
      this.playButton = false;
      this.pauseButton = true;
  
      if (tag.playButton) {
        // Play logic
        // Reset all tags' play/pause states
        this.callTaggingDetails.data.forEach((item) => {
          item.playButton = true;
          item.pauseButton = false;
        });
  
        // Stop the current playback and remove any existing listener
        this.wavesurfer.pause();
        this.wavesurfer.un('audioprocess', this.onAudioProcess);
  
        // Seek to the start point of the selected tag
        this.wavesurfer.seekTo(startPoint / this.wavesurfer.getDuration());
  
        // Update the current tag's play/pause state
        tag.playButton = false; // Set play to false as the tag is playing
        tag.pauseButton = true; // Set pause to true for the current tag
  
        // Define a new audioprocess listener for stopping playback at the endPoint
        const onAudioProcess = () => {
          if (this.wavesurfer.getCurrentTime() >= endPoint) {
            this.wavesurfer.pause(); // Pause at the endPoint
            this.playButton = true; // Reset overall play state
            this.pauseButton = false; // Reset overall pause state
            tag.playButton = true; // Reset tag play state
            tag.pauseButton = false; // Reset tag pause state
            this.wavesurfer.un('audioprocess', onAudioProcess); // Remove listener
          }
        };
  
        // Assign the new listener for cleanup and attach it
        this.onAudioProcess = onAudioProcess;
        this.wavesurfer.on('audioprocess', onAudioProcess);
  
        // Start playback
        this.wavesurfer.play();
        
      } else if (tag.pauseButton) {
        // Pause logic
        this.wavesurfer.pause();
  
        // Reset tag state to allow resuming playback
        tag.playButton = true;
        tag.pauseButton = false;
        this.playButton = true;
        this.pauseButton = false;
      }
    }
  }
  
  // play Audio Wave surfer 
  playAudio(): void { 
    if (this.wavesurfer) {
      // Stop any tag-specific playback logic
      this.wavesurfer.un('audioprocess', this.onAudioProcess);
      // Start normal playback
      this.wavesurfer.play();
      this.playButton = false;
      this.pauseButton = true;
    }
  }
  
  onAudioProcess() {
    // This method should be left empty or reused based on specific logic for each tag
  }

  // pause Wave surfer
  pauseAudio(): void {
    if (this.wavesurfer) {
      this.wavesurfer.pause();
      this.playButton = true
      this.pauseButton = false
    }
    this.callTaggingDetails.data.forEach((item) => {
      item.playButton = true;
      item.pauseButton = false;
    });
  }
  // stop Wave surfer
  stopAudio(): void {
    this.showTime = '00:00:00';
    if (this.wavesurfer) {
      this.wavesurfer.stop();
      this.playButton = true
      this.pauseButton = false
    }
    this.callTaggingDetails.data.forEach((item) => {
      item.playButton = true;
      item.pauseButton = false;
    });
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
  // close 
  close() {
    // Close the dialog (if applicable)
    this.dialogComponent.close();
  }
  // Add Tag
  addTag() {
    this.newTagStatus = true;
  }
  // Cancel
  cancel() {
    this.newTagStatus = false;
    this.startPoint = '';
    this.endPoint = '';
  }

  // When the user clicks the Mark Start Point button
  markStartPoint() {
    if (!this.startPoint) {
      // Mark the start point (set current time or some value)
      this.startPoint = this.showTime; // Assuming showTime is your current time or value
    } else if (!this.endPoint) {
      // Mark the end point
      this.endPoint = this.showTime; // Set the end point value
    } else {
      // Both startPoint and endPoint are set, so save the data
      this.saveTaggingData();
    }
  }

  canSave(): boolean {
    // Allow Mark Start Point and Mark End Point actions without validation
    if (!this.startPoint || !this.endPoint) {
      return true; // Enable button for marking points
    }
    // Apply validation only for Save
    return this.isValidTime(this.startPoint) && this.isValidTime(this.endPoint);
  }
  
  isValidTime(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5]?[0-9]):([0-5]?[0-9])$/;
    return timeRegex.test(time);
  }
  
  // Method to save the data
  saveTaggingData() {
    // Implement your save logic here
    const callTagDetails = {
      recordingCallLogId: this.data.recordingCallLogId,
      startPoint: this.startPoint,
      endPoint: this.endPoint,
      description: this.Description,
      selectedTag: this.selectedTag,
    }


    const insertCallTaggingDetails = this.callReportApi.insertCallTaggingDetails(callTagDetails).subscribe(
      (res: any) => {
        if (res.status) {
          console.log("Result", res);
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: 'Menu.REPORTS RECORDING.CALLS.Call Tag inserted successfully' },
          });
          this.newTagStatus = false;
          this.fetchCallTaggingDetails();
        }
      }, error => {
        console.log("error", error);

        if (error.status === 404 || error.status === 409) {
          // this.dialog.closeAll()
          let message = error.statusText
          if (error.status === 409) {
            message = error.error.statusText
          }
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: message },
          });
        }

        else if (error.status === 403) {
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
        } else if (error.status === 401) {
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } });
        }
      });
  }
}
