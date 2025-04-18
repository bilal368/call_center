import { Component, Inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../core/services/dashboard/dashboard.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-audio-fork-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DashboardService],
  templateUrl: './audio-fork-player.component.html',
  styleUrls: ['./audio-fork-player.component.css']
})
export class AudioForkPlayerComponent implements OnInit {
  @Input() uuids: any;
  @Input() isPausedElement: any;

  isPaused: boolean=true;
  // uuid: string = '';
  responseMessage: string = '';
  statusMessage: string = 'Waiting to start audio...';
  dataStatusMessage: string = '';
  isConnected: boolean = false;
  loading: boolean = false;
  play: boolean = false
  isDarkTheme: boolean = true;

  player: PCMPlayer | null = null; // Ensure it is declared as an instance of PCMPlayer
  ws: WebSocket | null = null;
  jitterBuffer: Uint8Array[] = [];
  BUFFER_THRESHOLD: number = 10;
  activeUUID: string | null = null;
  localstoragedata: any
  newuuid: any
  constructor(private dashboardApi: DashboardService,
  ) { }
  ngOnInit(): void {
    let item = localStorage.setItem('UID', this.uuids)

    console.log("try for element.editing",this.isPausedElement);
    console.log(this.activeUUID, this.uuids, '^^<<');
    
    // this.TrialCallSetTimeout()
    // this.isPaused=!this.isPaused
  }
  ngOnDestroy(): void {
    console.log('Component destroyed');
    // const item = localStorage.getItem('UID')
    // this.stopAudio(item!)
  }

  TrialCallSetTimeout() {
    setTimeout(() => {

      console.log("set timeout for ispaused", this.isPaused);

    }, 500);
  }
  // subscription:Subscription | undefined
  startAudioFork(uuidf: string) {

    
    console.log(this.activeUUID, '{current activeUUID before starting}');
    console.log(uuidf, '{@requested UUID to play@}');
    // Prevent starting a new audio while one is initializing
    if (this.loading) {
      // console.log('Audio is still initializing. Ignoring play request.');
      return;
    }
    const item = localStorage.getItem('UID')
    this.localstoragedata = item
    this.newuuid = uuidf

    // console.log(this.newuuid,this.localstoragedata,'{{{{{datatatatt}}}}}');


    if (item) {
      console.log("item exist");
      if (item == uuidf) {
        console.log('both are same');
        this.setActiveUUID(uuidf);
        console.log(this.activeUUID, '&{current activeUUID after setting}&');
        this.dashboardApi.stationMonitor(uuidf).subscribe(
          response => {
            console.log('Audio fork started for UUID:', uuidf, response);
            this.setupWebSocket();
          },
          error => {
            console.error('Error starting audio fork:', error);
            this.resetActiveUUID();
          }
        ).add(() => {
          this.loading = false;
          this.isPaused = false;
          this.play = true;
        });
      } else {
        this.stopAudio(item)
        this.setActiveUUID(uuidf);
        console.log(this.activeUUID, '&{current activeUUID after setting}&');
        this.dashboardApi.stationMonitor(uuidf).subscribe(
          response => {
            console.log('Audio fork started for UUID:', uuidf, response);
            this.setupWebSocket();
          },
          error => {
            console.error('Error starting audio fork:', error);
            this.resetActiveUUID(); // Reset UUID on error
          }
        ).add(() => {
          this.loading = false;
          this.isPaused = false;
          this.play = true;
        });
        localStorage.setItem("UID", uuidf)
      }
    } else {
      localStorage.setItem("UID", uuidf)
      this.setActiveUUID(uuidf);
      console.log(this.activeUUID, '&{current activeUUID after setting}&');
      this.dashboardApi.stationMonitor(uuidf).subscribe(
        response => {
          console.log('Audio fork started for UUID:', uuidf, response);
          this.setupWebSocket();
        },
        error => {
          console.error('Error starting audio fork:', error);
          this.resetActiveUUID(); // Reset UUID on error
        }
      ).add(() => {
        this.loading = false;
        this.isPaused = false;
        this.play = true;
      });
    }
  }
  setActiveUUID(uuid: string) {
    console.log(`Setting activeUUID to: ${uuid}`);
    this.activeUUID = uuid;
  }
  resetActiveUUID() {
    console.log('Resetting activeUUID to null');
    this.activeUUID = null;
  }

  setupWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.ws = new WebSocket(environment.wssocketIp);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      this.statusMessage = 'Connected to WebSocket server.';
      this.isConnected = true;
      this.jitterBuffer = [];
      this.removePlayer()
      this.initializePlayer();
    };

    this.ws.onmessage = (event) => {
      const data = new Uint8Array(event.data);
      this.jitterBuffer.push(data);


      if (this.jitterBuffer.length >= this.BUFFER_THRESHOLD && this.player && !this.isPaused) {
        console.log("function eppahza work avanenn nokkan");
        
        const combined = this.concatenateBuffers(this.jitterBuffer);
        this.player.feed(combined);
        this.jitterBuffer = [];
      }

      this.dataStatusMessage = `Receiving audio data: ${data.byteLength} bytes received`;
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.statusMessage = 'WebSocket error. Attempting to reconnect...';
      this.isConnected = false;
      this.reconnectWebSocket();
    };

    this.ws.onclose = () => {
      this.statusMessage = 'WebSocket closed. Reconnecting...';
      this.isConnected = false;
      this.reconnectWebSocket();
    };
  }

  reconnectWebSocket() {
    if (!this.isPaused) {
      setTimeout(() => {
        this.setupWebSocket();
      }, 1000); // Reconnect after 1 second
    }
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
      console.log('Player initialized successfully');
    }
  }
  removePlayer() {
    console.log('Removing player and stopping voice');
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
  togglePauseResume() {
    // if (this.play == true) {
    if (!this.player) return;
    // this.startAudioFork()
    if (this.isPaused) {
      this.player.audioCtx.resume().then(() => {
        this.statusMessage = 'Playing audio...';
        this.isPaused = false;
      });
    } else {
      this.player.audioCtx.suspend().then(() => {
        this.statusMessage = 'Audio paused.';
        this.isPaused = true;
      });
    }
  }

  started: boolean = false;
  stopAudio(uuid: string) {
    this.started = true
    this.isPaused != this.isPaused
    console.log(`Stopping audio for UUID: ${uuid}`);
    if (this.player) {
      console.log('Destroying PCMPlayer instance...');
      this.player.stop();
      this.player.destroy();
      this.player = null;
    }

    if (this.ws) {
      console.log('Closing WebSocket connection...');
      this.ws.close();
      this.ws = null;
    }

    this.jitterBuffer = [];
    this.play = false;

    this.dashboardApi.stopStationMonitor(uuid).subscribe(
      response => console.log('Stopped station monitor successfully:', response),
      error => console.error('Error stopping station monitor:', error)
    );
  }

}
// PCMPlayer.ts
export class PCMPlayer {
  public audioCtx!: AudioContext; // Change from private to public
  private bufferSource: AudioBufferSourceNode | null = null;
  private gainNode!: GainNode;
  private samples: Float32Array = new Float32Array();
  private interval: any;
  private startTime: number = 0;
  private option: any;
  private maxValue: number;
  private typedArray: any;

  constructor(options: any) {
    this.option = Object.assign({}, {
      encoding: "16bitInt",
      channels: 1,
      sampleRate: 8000,
      flushingTime: 100
    }, options);

    this.maxValue = this.getMaxValue();
    this.typedArray = this.getTypedArray();
    this.createContext();
    this.interval = setInterval(this.flush.bind(this), this.option.flushingTime);
  }

  private getMaxValue() {
    const maxValues: { [key: string]: number } = {
      "8bitInt": 128,
      "16bitInt": 32768,
      "32bitInt": 2147483648,
      "32bitFloat": 1
    };
    return maxValues[this.option.encoding] || maxValues["16bitInt"];
  }

  private getTypedArray() {
    const typedArrays: { [key: string]: any } = {
      "8bitInt": Int8Array,
      "16bitInt": Int16Array,
      "32bitInt": Int32Array,
      "32bitFloat": Float32Array
    };
    return typedArrays[this.option.encoding] || typedArrays["16bitInt"];
  }

  private createContext() {
    const AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
    this.audioCtx = new (AudioContext)();
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = 1;
    this.gainNode.connect(this.audioCtx.destination);
    this.startTime = this.audioCtx.currentTime;
  }

  public feed(data: Uint8Array) {
    if (this.isTypedArray(data)) {
      const formattedValue = this.getFormattedValue(data);
      this.play(formattedValue);
    }
  }

  private play(samples: Float32Array) {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const bufferSource = this.audioCtx.createBufferSource();
    const length = samples.length / this.option.channels;
    const audioBuffer = this.audioCtx.createBuffer(this.option.channels, length, this.option.sampleRate);

    for (let channel = 0; channel < this.option.channels; channel++) {
      const audioData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        audioData[i] = samples[i * this.option.channels + channel];
      }
    }

    bufferSource.buffer = audioBuffer;
    bufferSource.connect(this.gainNode);
    bufferSource.start(this.audioCtx.currentTime);
  }

  private getFormattedValue(data: Uint8Array) {
    const t = new this.typedArray(data.buffer);
    const formattedSamples = new Float32Array(t.length);
    for (let i = 0; i < t.length; i++) {
      formattedSamples[i] = t[i] / this.maxValue;
    }
    return formattedSamples;
  }

  private isTypedArray(data: any) {
    return data.byteLength && data.buffer && data.buffer.constructor === ArrayBuffer;
  }

  private flush() {
    if (this.samples.length) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const bufferSource = this.audioCtx.createBufferSource();
      const length = this.samples.length / this.option.channels;
      const audioBuffer = this.audioCtx.createBuffer(this.option.channels, length, this.option.sampleRate);

      for (let channel = 0; channel < this.option.channels; channel++) {
        const audioData = audioBuffer.getChannelData(channel);
        for (let i = channel, n = 0; n < length; n++) {
          audioData[n] = this.samples[i];
          i += this.option.channels;
        }
      }

      bufferSource.buffer = audioBuffer;
      bufferSource.connect(this.gainNode);
      bufferSource.start(this.startTime);
      this.startTime += audioBuffer.duration;
      this.samples = this.samples.subarray(length * this.option.channels);
    }
  }
  public stop() {
    if (this.bufferSource) {
      this.bufferSource.stop();
      this.bufferSource = null; // Reset the buffer source
    }
  }

  public volume(value: number) {
    this.gainNode.gain.value = value;
  }

  public destroy() {
    if (this.bufferSource) {
      this.bufferSource.stop(); // Stop the current buffer source
      this.bufferSource.disconnect(); // Disconnect from audio graph
      this.bufferSource = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close(); // Close the audio context
    }
    clearInterval(this.interval); // Clear any intervals
    this.samples = new Float32Array(); // Rese
  }

}
