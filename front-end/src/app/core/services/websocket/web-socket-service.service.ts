// web-socket-service.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
socket:any ;
private readonly URL: string = environment.socketIp; // Use localhost for local testing
// 'http://0.0.0.0:5001'
constructor() {}
connect() {
  try {
    const token = localStorage.getItem('token');
    this.socket = io(this.URL, {
      auth: {
        token: token,
      },
    }).on('connect', () => {
      console.log('Socket connected successfully');
    }).on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  } catch (error) {
    console.error('Socket connection error:', error);
  }
}
listen(eventName: string): Observable<any> {
  return new Observable((subscriber) => {
    if(this.socket){
      this.socket.on(eventName, (data: any) => {
        subscriber.next(data);
        console.log(data,'data');
        
      });
    }
   
  });
}
emitLogoutStatus(){
  if(this.socket){
  this.socket.emit('logout-status', true);
  }
}
disconnect() {
  if (this.socket) {
    this.socket.on('disconnect',(data:any)=>{
      console.info('disconnected from socket')
      
    })
    // this.socket.disconnect();
   
    
  }
}
emitLogout(userId: string): void {
  if (this.socket) {
    setTimeout(() => {
    this.socket.emit('logout', userId);
  }, 100);
    console.log('Logout event emitted:', userId);
  }
}
}
