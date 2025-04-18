import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subscription, fromEvent, merge, of, timer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { WebSocketService } from '../websocket/web-socket-service.service';
import { UserService } from '../user/user.service';
import { BaseComponent } from '../../../base/base.component';
import { SharedService } from '../../shared/share.service';
import { LogoutSpinnerComponent } from '../../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
 
  private readonly INACTIVITY_TIMEOUT = 120 * 60 * 1000; // 120 minutes in milliseconds
  private userActivityEvents$: Observable<any>;
  private inactivitySubscription: Subscription | null = null; // Track the subscription
  constructor(private router: Router,
    private socketServ:WebSocketService,
    private userApi:UserService,
    private sharedService:SharedService,
    private dialogRef:MatDialog
  ) {
    this.userActivityEvents$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'click')
    );

    // this.initInactivityTimer();
  }

  initInactivityTimer() {
    console.log('inactivity tracking');
    this.inactivitySubscription =this.userActivityEvents$
      .pipe(
        switchMap(() => {
          // When user interacts, reset the timer
          
          return timer(this.INACTIVITY_TIMEOUT);
        }),
        tap(() => {
          // this.triggerLogout();
          this.logoutUser(); // Trigger logout on timeout
        })
      )
      .subscribe();
  }
unsubscribe(){
  if (this.inactivitySubscription) {
    this.inactivitySubscription.unsubscribe(); // Unsubscribe and stop the timer
    this.inactivitySubscription = null; // Clear the subscription reference
  }
}

  logoutUser() {
  this.unsubscribe()
  this.sharedService.logoutSubject.next(true)
    // Clear user session, tokens, or any other authentication-related info
    console.log('User inactive, logging out...');
    

  }
}