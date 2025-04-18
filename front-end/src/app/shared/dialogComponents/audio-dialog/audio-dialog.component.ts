import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import WaveSurfer from 'wavesurfer.js';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SharedService } from '../../../core/shared/share.service';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-audio-dialog',
  standalone: true,
  imports: [MatIconModule, MatToolbar, MatToolbarModule, MatProgressBarModule],
  templateUrl: './audio-dialog.component.html',
  styleUrls: ['./audio-dialog.component.css'],
})
export class AudioDialogComponent implements OnInit, OnDestroy {
  wavesurfers: WaveSurfer[] = [];
  public mergedWaveSurfer: WaveSurfer | null = null;
  public wavesurfer: WaveSurfer | null = null;
  public playButton: boolean[] = [];
  public pauseButton: boolean[] = [];
  public showTime: string = '00:00';
  public audioDiv = true;
  public loadingWave = false;
  public TotalRecords: number = 0;
  playMergeButton: boolean = true;
  pauseMergeButton: boolean = false;
  currentBlobIndex = 0;
  totalPlayTime: number = 0;
  audioDurations: number[] = [];
  finishListener: (() => void) | null = null;
  cumulativeTime: number = 0; 
  currentTime: number = 0; 

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { audioBlobs: Blob[], supervisorFeedBacks: any[], recordingCallLogIds: any[], multiaudio: boolean, audioNames : any },
    public dialog: MatDialog,
    private sharedService: SharedService,
    public dialogRef: MatDialogRef<AudioDialogComponent>
  ) {   
   }

  ngOnInit(): void {
    if (this.data.multiaudio && this.data.audioBlobs.length > 0) {
      this.TotalRecords = this.data.audioBlobs.length;
      this.audioDiv = true; // Ensure this is set to true before rendering.
      this.data.audioBlobs.forEach((blob, index) => {
        const audioURL = URL.createObjectURL(blob);
        this.createWaveSurferInstance(audioURL, index);

      });
    } else {
      const audioURL = URL.createObjectURL(this.data.audioBlobs[0]);
      this.createWaveSurferInstance(audioURL, 0);
    }
    setTimeout(() => {
      this.createMergedWaveSurfer(); // Delay this until after DOM is ready
    }, 0);
  }
  // Create the merged audio
  createWaveSurferInstance(audioURL: string, index: number) {
    const containerId = `wavesurferContainer${index}`;
    setTimeout(() => {
      const wavesurfer = WaveSurfer.create({
        container: `#${containerId}`,
        backend: 'MediaElement',
        waveColor: '#ff4e00',
        progressColor: '#5A9158',
        barWidth: 2,
        barRadius: 3,
        fillParent: true,
        cursorWidth: 1,
        height: 80,
      });

      wavesurfer.load(audioURL);

      this.wavesurfers.push(wavesurfer);

      // Set the play and pause button states for this instance
      this.playButton[index] = true;
      this.pauseButton[index] = false;
    }, 0);
  }
  // Create the merged audio
  async createMergedWaveSurfer() {
    const mergedContainer = 'mergedWaveSurferContainer';
  
    this.mergedWaveSurfer = WaveSurfer.create({
      container: `#${mergedContainer}`,
      backend: 'MediaElement',
      waveColor: '#00aaff',
      progressColor: '#ffcc00',
      barWidth: 2,
      barRadius: 3,
      fillParent: true,
      cursorWidth: 1,
      height: 100,
    });
  
    try {
      const mergedBlob = await this.mergeAudioBlobs(this.data.audioBlobs);
      const audioURL = URL.createObjectURL(mergedBlob);
      this.mergedWaveSurfer.load(audioURL);

      // Handle playback time updates
      this.mergedWaveSurfer.on('audioprocess', (time: number) => {
        this.showTime = this.formatTime(time);
      });

      // Update UI when audio ends
      this.mergedWaveSurfer.on('finish', () => {
        this.showTime = this.formatTime(0);
      });
      } catch (err) {
        console.error('Error loading audio blob:', err);
      }  
    // Update showTime during audio playback
    this.mergedWaveSurfer.on('audioprocess', (time: number) => {
      const formattedTime = this.formatTime(time);
      this.showTime = formattedTime;
    });
  }
  // Load the merged audio
  async loadAndPlayMergedAudio(): Promise<void> {
    if (!this.mergedWaveSurfer || !this.data.audioBlobs.length) return;
  
    try {
      // Merge all blobs into a single blob
      const mergedBlob = await this.mergeAudioBlobs(this.data.audioBlobs);
      const audioURL = URL.createObjectURL(mergedBlob);
  
      // Load the merged audio
      this.mergedWaveSurfer.load(audioURL);
  
      // Start playback when ready
      this.mergedWaveSurfer.on('ready', () => {
        if (this.mergedWaveSurfer) {
          this.mergedWaveSurfer.play();
          this.playMergeButton = false;
          this.pauseMergeButton = true;
        }
      });
  
      // Update time display during playback
      this.mergedWaveSurfer.on('audioprocess', (time: number) => {
        this.showTime = this.formatTime(time);
      });
  
      // Handle playback completion
      this.mergedWaveSurfer.on('finish', () => {
        this.showTime = this.formatTime(0); // Reset time display
        this.playMergeButton = true;
        this.pauseMergeButton = false;
      });
    } catch (err) {
      console.error('Error loading merged audio:', err);
    }
  }
  // Play Merged Audio
  playAllAudio(): void {
    if (this.mergedWaveSurfer) {
      if (this.currentTime > 0) {
        // Resume playback from the paused time
        const duration = this.mergedWaveSurfer.getDuration();
        this.mergedWaveSurfer.seekTo(this.currentTime / duration);
        this.currentTime = 0; // Reset after resuming
      }
  
      this.mergedWaveSurfer.play();
  
      // Update UI buttons
      this.playMergeButton = false;
      this.pauseMergeButton = true;
    }
  }
  // Pause Merged Audio
  pauseAllAudio(): void {
    if (this.mergedWaveSurfer) {
      // Save the current playback time
      this.currentTime = this.mergedWaveSurfer.getCurrentTime();
      this.mergedWaveSurfer.pause();
  
      // Update UI buttons
      this.playMergeButton = true;
      this.pauseMergeButton = false;
    }
  }
  // Stop Merged Audio
  stopAllAudio(): void {
    if (this.mergedWaveSurfer) {
      this.mergedWaveSurfer.stop();
      this.playMergeButton = true;
      this.pauseMergeButton = false;
      this.audioDurations = []; // Clear durations on stop
      this.cumulativeTime = 0; // Reset cumulative time
      this.currentBlobIndex = 0; // Reset blob index
      this.currentTime = 0; // Reset playback position
  
      if (this.finishListener) this.mergedWaveSurfer.un('finish', this.finishListener);
    }
  }
  // Close window
  onClose(): void {
    this.wavesurfers.forEach(wavesurfer => wavesurfer.destroy());
    this.dialogRef.close();
  }
  // Time Updates
  formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
  
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  // Play Single audio
  playAudio(index: number): void {
    const wavesurfer = this.wavesurfers[index];
    if (wavesurfer) {
      wavesurfer.play();
      this.playButton[index] = false;
      this.pauseButton[index] = true;
    }

  }
  // Pause Single audio
  pauseAudio(index: number): void {
    const wavesurfer = this.wavesurfers[index];
    if (wavesurfer) {
      wavesurfer.pause();
      this.playButton[index] = true;
      this.pauseButton[index] = false;
    }
  }
  // Stop Single audio
  stopAudio(index: number): void {
    const wavesurfer = this.wavesurfers[index];
    if (wavesurfer) {
      wavesurfer.stop();
      this.playButton[index] = true;
      this.pauseButton[index] = false;
    }
  }
  // Close Wave Surffer
  closeWavesurfer(index: number): void {
    const wavesurfer = this.wavesurfers[index];
    if (wavesurfer) {
      wavesurfer.destroy();
      this.audioDiv = false;
      this.playButton[index] = false;
      this.pauseButton[index] = true;
    }
  }
  // Download Merged Audio
  async downloadMergedAudio(): Promise<void> {
    if (this.data.audioBlobs && this.data.audioBlobs.length > 0) {
      try {
        // Merge the audio blobs into a single audio file
        const mergedBlob = await this.mergeAudioBlobs(this.data.audioBlobs);
  
        // Create a download link for the merged file
        const url = window.URL.createObjectURL(mergedBlob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'merged_audio.mp3';
        anchor.click();
  
        // Clean up the object URL
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error merging audio blobs:', error);
      }
    } else {
      console.warn('No audio blobs available to merge.');
    }
  }
  // Merge Audio
  async mergeAudioBlobs(blobs: Blob[]): Promise<Blob> {
    const audioContext = new (window.AudioContext || window.AudioContext)();
  
    // Decode all audio blobs into audio buffers
    const buffers = await Promise.all(
      blobs.map(async (blob) => {
        const arrayBuffer = await blob.arrayBuffer();
        return audioContext.decodeAudioData(arrayBuffer);
      })
    );
  
    // Calculate the total duration and create a new buffer
    const totalDuration = buffers.reduce((sum, buffer) => sum + buffer.duration, 0);
    const numberOfChannels = Math.max(...buffers.map((buffer) => buffer.numberOfChannels));
    const sampleRate = audioContext.sampleRate;
    const outputBuffer = audioContext.createBuffer(numberOfChannels, sampleRate * totalDuration, sampleRate);
  
    // Merge all buffers into the output buffer
    let offset = 0;
    buffers.forEach((buffer) => {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const outputChannel = outputBuffer.getChannelData(channel);
        const inputChannel = buffer.getChannelData(channel % buffer.numberOfChannels);
        outputChannel.set(inputChannel, offset);
      }
      offset += buffer.length;
    });
  
    // Encode the output buffer into a Blob
    return new Promise<Blob>((resolve) => {
      const offlineContext = new OfflineAudioContext(numberOfChannels, outputBuffer.length, sampleRate);
      const bufferSource = offlineContext.createBufferSource();
      bufferSource.buffer = outputBuffer;
      bufferSource.connect(offlineContext.destination);
      bufferSource.start();
  
      offlineContext.startRendering().then((renderedBuffer) => {
        // Convert rendered audio to a Blob
        const audioBlob = new Blob([this.bufferToWav(renderedBuffer)], { type: 'audio/wav' });
        resolve(audioBlob);
      });
    });
  }
  // Buffer Convert into Wav
  bufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numberOfChannels * 2 + 44;
    const result = new ArrayBuffer(length);
    const view = new DataView(result);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    let offset = 0;

    // RIFF chunk descriptor
    writeString(view, offset, 'RIFF'); offset += 4;
    view.setUint32(offset, length - 8, true); offset += 4; // File length minus RIFF header size
    writeString(view, offset, 'WAVE'); offset += 4;

    // FMT sub-chunk
    writeString(view, offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4; // Size of the fmt chunk
    view.setUint16(offset, 1, true); offset += 2; // PCM format
    view.setUint16(offset, numberOfChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * numberOfChannels * 2, true); offset += 4; // Byte rate
    view.setUint16(offset, numberOfChannels * 2, true); offset += 2; // Block align
    view.setUint16(offset, 16, true); offset += 2; // Bits per sample

    // Data sub-chunk
    writeString(view, offset, 'data'); offset += 4;
    view.setUint32(offset, buffer.length * numberOfChannels * 2, true); offset += 4;

    // Write interleaved PCM samples
    const interleaved = new Float32Array(buffer.length * numberOfChannels);
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        interleaved[i * numberOfChannels + channel] = channelData[i];
      }
    }

    for (let i = 0; i < interleaved.length; i++) {
      const sample = Math.max(-1, Math.min(1, interleaved[i])); // Clamp values
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return result;
  }

  ngOnDestroy(): void {
    this.onClose();
  }
  
}
