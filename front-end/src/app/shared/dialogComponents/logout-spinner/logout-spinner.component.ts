import { Component, Inject, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/authentication/auth.service';
import { UserMangerService } from '../../../core/services/userManger/user-manger.service';
import { WebSocketService } from '../../../core/services/websocket/web-socket-service.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../../core/services/user/user.service';
import { SharedService } from '../../../core/shared/share.service';

@Component({
  selector: 'app-logout-spinner',
  standalone: true,
  imports: [MatToolbarModule, TranslateModule, MatTooltipModule],
  templateUrl: './logout-spinner.component.html',
  styleUrl: './logout-spinner.component.css'
})
export class LogoutSpinnerComponent implements OnInit {
  logoutMessage: string = 'Session expired...Signing out'
  clickedType: string = ''
  isLoading: boolean = true
  userId: string = ''
  constructor(@Inject(MAT_DIALOG_DATA) public data: { clickedType: string, message: string },
    public matdialoge: MatDialogRef<LogoutSpinnerComponent>,
    private dialogRef: MatDialog,
    private router: Router,
    private socketServ: WebSocketService,
    private user: UserService,
    private authService: AuthService,
    private sharedService: SharedService
  ) {
    sharedService.loginUserId$.subscribe((result: any) => {
      this.userId = result
    })
  }

  ngOnInit(): void {

    this.clickedType = this.data.clickedType
    if (this.data.clickedType === 'logOut') {
      // calling function for logout process
      this.logoutMessage = this.data.message || 'Your session has expired. Please re login'
      this.logOut()
    }
    else if (this.data.clickedType === 'logIn') {
      this.logoutMessage = 'Login Success'
      this.completeLogin();
    }
    else if (this.data.clickedType === 'logOutManually') {
      this.logoutMessage = 'Signing out'
      this.completeLogout();
    } else if (this.data.clickedType === 'confirmLogin') {
      console.log('Do nothing');

    }

    else {
      this.logoutMessage = this.data.message
      this.logOutFrontend()
    }


  }
  postforceloginWithPassword(status: boolean) {
    this.matdialoge.close(status)
  }
  completeLogout() {
    console.log('Logout');

    const extractedData = this.authService.extractDataFromToken(localStorage.getItem('token'))
    const userName = extractedData.userName

    const userId = extractedData.userId; // Get logged-in user ID

    // Emit logout event using WebSocketService
    this.socketServ.emitLogout(userId);
    // remove token
    localStorage.clear()
    this.socketServ.disconnect();
    this.user.logOut({ userId: this.userId, userName: userName }).subscribe((result: any) => {
      // navigate to login
      setTimeout(() => {
        this.dialogRef.closeAll()
        this.router.navigateByUrl('');
      }, 2000)

    }, (error: any) => {
      console.error(error)
      // navigate to login
      setTimeout(() => {
        this.dialogRef.closeAll()
        this.router.navigateByUrl('');
      }, 2000)
    })

  }
  // logout From Frontend only--when 403 or token already removed
  //  from redis or already login status updated from force login
  logOut() {
    const extractedData = this.authService.extractDataFromToken(localStorage.getItem('token'))
    const userName = extractedData.userName

    const userId = extractedData.userId; // Get logged-in user ID
     // Emit logout event using WebSocketService
     this.socketServ.emitLogout(userId);
    // remove token    
    this.socketServ.disconnect();
    const token = localStorage.getItem('token')
    localStorage.clear()

    this.user.logOut({ userId: this.userId, userName: userName }).subscribe((result: any) => {
      // navigate to login
      setTimeout(() => {
        this.dialogRef.closeAll()
        this.router.navigateByUrl('');
      }, 2000)

    }, (error: any) => {
      console.error(error)

      // navigate to login
      setTimeout(() => {
        this.dialogRef.closeAll()
        this.router.navigateByUrl('');
      }, 2000)

    })


  }
  logOutFrontend() {
    const extractedData = this.authService.extractDataFromToken(localStorage.getItem('token'))
    const userId = extractedData.userId; // Get logged-in user ID
    // Emit logout event using WebSocketService
    this.socketServ.emitLogout(userId);
    this.socketServ.disconnect();
    localStorage.clear()
    // navigate to login
    setTimeout(() => {
      this.dialogRef.closeAll()
      this.router.navigateByUrl('');
    }, 2000)
  }
  completeLogin() {
    setTimeout(() => {
      this.router.navigateByUrl('dG/dashboard');
      this.dialogRef.closeAll()
    }, 2000)
  }

}
