import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, importProvidersFrom } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UserService } from '../core/services/user/user.service';
import { AuthenticationService } from '../core/services/activeDirectory/authentication.service';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list'
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LogoutSpinnerComponent } from '../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserprofileComponent } from '../shared/dialogComponents/userprofile/userprofile.component';
import { AuthService } from '../core/services/authentication/auth.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LicenseValidationComponent } from '../shared/dialogComponents/license-validation/license-validation.component';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../core/services/websocket/web-socket-service.service';
import { InactivityService } from '../core/services/inActivity/inactivity.service';
import { SharedService } from '../core/shared/share.service';
import { SystemInfoServices } from '../core/services/systemInfo/systemInfo-service.service';
import { interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
@Component({
  selector: 'app-base',
  standalone: true,
  templateUrl: './base.component.html',
  providers: [UserService, AuthenticationService, JwtHelperService,
    { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },],
  styleUrl: './base.component.css',
  imports: [CommonModule, MatTooltipModule, MatSidenavModule, MatToolbarModule, MatCheckboxModule, MatExpansionModule, MatIconModule,
    MatMenuModule, HttpClientModule, ReactiveFormsModule, MatListModule, RouterModule, TranslateModule,
    HttpClientModule, ReactiveFormsModule, MatListModule, RouterModule]
})
export class BaseComponent implements OnInit, OnDestroy {
  // 
  selectedRecorderType: string = '';
  selectedRecorderSubItem: string = 'Option 1';
  recorderTypes: string[] = ['Type 1', 'Type 2', 'Type 3'];
  headerTop: any = {};
  userName: any = ''; //name badge
  showRecorderSubItems: boolean = false;
  report: any;
  socketSubscription: any = Subscription;
  logoChangeSubscription: any = Subscription;
  heading: string = ''
  daysCount: any = '';
  notificationMessage: string = "";
  showAlert: boolean = false;
  manualLogout: boolean = false; // avoiding logout fn calls triggered by socket if already manual logout clicked
  private logoutSubscription!: Subscription;
  constructor(private userApi: UserService,
    private logoApi: SystemInfoServices,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    private router: Router,
    private dialogRef: MatDialog,
    public translate: TranslateService,
    private socketServ: WebSocketService,
    private sharedService: SharedService,
    private route: ActivatedRoute,
    private imageFetch: SystemInfoServices,
    // private route: ActivatedRouteSnapshot,
    private inactivityService: InactivityService //needed for idle timeout ,

  ) {

  }
  year: any;

  ngOnInit(): void {
    const data = new Date
    this.year = data.getFullYear();
    // First flip after 5 seconds
    setTimeout(() => {
      this.isFlipped = !this.isFlipped;

      // Then flip every 10 seconds
      setInterval(() => {
        this.isFlipped = !this.isFlipped;
      }, 10000);
    }, 5000);

    // inactivity timer for logout
    this.inactivityService.initInactivityTimer() //start observe time service
    this.logoutSubscription = this.sharedService.logoutStatus$.subscribe((result: boolean) => {

      if (result === true) {
        // this.logOut('logOut','')

      }
    })
    // check logged user's token valid or not :by using jwt helper service
    if (this.jwtExpiredOrNot()) {
      // console.log("JWT false");
      localStorage.removeItem('token')

      // you need to login
      this.router.navigateByUrl('')
    }
    else {
      // console.log("JWT true");
      // don't need to login
      this.connectionSocket()
    }
    this.extractId(); //function to take id from token and translate
    this.socketServ.listen('logout').subscribe((data: any) => {
      // const token=localStorage.getItem('token')
      if (data === this.userId && !this.manualLogout) {
        console.log('another login detected login out');
        const message = 'Another login has been detected on your account. You will be logged out for security reasons.'
        this.logOut('logOutFrontend', message)
      }
    })

    this.getDiskUsage()
    this.getLogoName()

    // change detection without ngZone :ng zone only uses
    this.logoChangeSubscription = this.logoApi.logoChangedStatus$.subscribe((result: any) => {
      if (result === true) {
        this.getLogoName()
      }
    })
    this.getRoute();
    this.checkLicenseExpiration();
  }
  ngOnDestroy() {
    if (this.logoChangeSubscription) {
      this.logoChangeSubscription.unsubscribe()
    }
    // Unsubscribe to prevent memory leaks
    if (this.logoutSubscription) {
      this.logoutSubscription.unsubscribe();
    }
  }


  checkLicenseExpiration(): void {
    const today = new Date();

    this.userApi.licenseValidityAlert().subscribe(
      (result: any) => {
        if (result?.license?.endDate) {
          const expirationDate = new Date(result.license.endDate);
          const formattedDate = expirationDate.toLocaleDateString(); // Format date as per locale
          const diffTime = expirationDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

          if (diffDays > 0 && diffDays <= 30) {
            // License will expire in 'N' days { value: diffDays }
            this.notificationMessage = this.translate.instant('Menu.Expire in') +
              ` ${formattedDate}`;
          } else if (diffDays === 0) {
            // License expires today
            this.notificationMessage = this.translate.instant('Menu.Expires') + ` (${formattedDate})`;
          } else if (diffDays < 0) {
            // License expired 'N' days ago
            this.notificationMessage = this.translate.instant('Menu.Expired', { value: Math.abs(diffDays) });
          } else {
            // Hide alert if expiration is more than 365 days away
            this.showAlert = false;
            return;
          }

          // Show the alert only if the license is near expiry or expired
          this.showAlert = true;
        }
      },
      (error) => {
        console.error('Error fetching license data:', error);
      }
    );
  }

  // get header from route
  getRoute() {
    let currentRoute = this.route.snapshot;
    while (currentRoute.children.length > 0) {
      currentRoute = currentRoute.children[currentRoute.children.length - 1];
    }
    this.headerTop = currentRoute.data['header'];

  }
  packageId: any = [];
  userId: string = ''; //id to update language in backend
  userHierarchyId: any;
  // extract id from token and translate data
  extractId() {
    const token = localStorage.getItem('token')

    if (token) {
      const extractedData = this.authService.extractDataFromToken(token)
      this.userHierarchyId = extractedData.userHierarchyId
      this.packageId = extractedData.combinedPackageID //extract id from token 
      const language = extractedData.languageFileName || 'en-us';
      this.userName = extractedData.userName
      this.userId = extractedData.userId
      this.sharedService.loginUser.next(this.userId)
      this.translate.use(language);

    }

  }
  openValidationDialog(): void {
    const dialogRef = this.dialogRef.open(LicenseValidationComponent, {
      width: '30%',
      height: 'auto',
      disableClose: true
    });

    document.body.classList.add('dialog-open');

    dialogRef.afterClosed().subscribe(() => {
      document.body.classList.remove('dialog-open');
    });
  }
  // function to set UI
  privileagedUI(input: any) {
    const status = input.some((item: number) => {
      return this.packageId?.includes(item)
    })
    return status
  }

  // function for jwt expired or not
  jwtExpiredOrNot(): any {
    // console.log("token timeout in:", this.jwtTimeRemaining());
    try {
      if (this.jwtHelper) {
        const token = localStorage.getItem('token')
        if (token) {
          return this.jwtHelper.isTokenExpired(token)
          // status=true when jwt timed out  status=false when jwt time valid
        } else {
          return true;
        }

      }
      else {
        // console.log("not found");
      }
    }
    catch (error) {
      console.log("ERROR:", error);
      return true

    }
  }
  // function to force logout user
  connectionSocket() {
    try {
      this.socketServ.connect();
      // this.socketServ.socket.on('connection', (data: any) => {
      //   console.log(`Connected to the server,user id:"${data}"`);
      // });
      this.socketServ.socket.on('userPasswordUpdated', (data: any) => {
        if (data == true) {
          const token = localStorage.getItem('token')
          const extractedData = this.authService.extractDataFromToken(token)
          const userId = extractedData.userId; // Get logged-in user ID

          // Emit logout event using WebSocketService
          this.socketServ.emitLogout(userId);
          this.socketServ.disconnect();
          const message = ''
          this.logOut('logOutManually', message) //calls for logout

        }

      })
      this.socketServ.socket.on('disconnecting', (data: any) => {
        console.log(`Disconnect from the server,user id:"${data}"`);

      })
    } catch (err: any) {
      if (err.message === 'Unauthorized' || err.message === 'Token not found') {
        console.log('Authentication failed. Please try again.');

      } else {
        console.log('An error occurred:', err);
      }

    }
  }

  // Open profile for update language
  openProfile() {
    this.dialogRef.open(UserprofileComponent, { width: "22vw", height: "30vh", disableClose: true })
  }


  // checked till 
  logOut(clickedType: string, message: string) {
    console.log('Logout happens');
    this.dialogRef.closeAll()
    if (clickedType == 'logOutManually') {
      this.manualLogout = true
    }
    const token = localStorage.getItem('token')
    const extractedData = this.authService.extractDataFromToken(token)
    const userId = extractedData.userId; // Get logged-in user ID

    // Emit logout event using WebSocketService
     this.socketServ.emitLogout(userId);


    this.socketServ.disconnect();
    this.inactivityService.unsubscribe();
    // function to update login status in DB
    this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: clickedType, message }, disableClose: true })
  }



  logoName: string = ''
  logoUrl: string = ''
  getLogoName() {
    this.logoApi.getLogoName().subscribe((result: any) => {
      if (result.status == true) {
        this.logoName = result.logoImageFileName
        localStorage.setItem('logoName', this.logoName)
        // call function to get logo from server
        this.getLogoImage()

      }
    }, (Error) => {
      console.log(Error);

    })
  }
  getLogoImage() {
    this.logoApi.getFiles(this.logoName).subscribe((blob: any) => {
      const objectURL = URL.createObjectURL(blob);
      this.logoUrl = objectURL;  // Assign the Blob URL to logoUrl to display the image

    }, (Error) => {
      console.log(Error);

    })
  }
  diskUsage: any;

  getDiskUsage() {
    interval(1800000) // Poll every 30 minutes
      .pipe(
        startWith(0), // Emit an initial value immediately
        switchMap(() => this.logoApi.getDiskUsage()) // Switch to the API call
      )
      .subscribe(
        (result: any) => {
          this.diskUsage = result.diskUsage; // Update the value
        },
        (error) => {
          console.error('Error:', error.error?.statusText || error.message);
          if (error.status === 403) {
            // opens dialog for logout message
            this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' }, disableClose: true })
          }
          else if (error.status === 401) {
            this.router.navigateByUrl('')
            // this.dialogRef.open(LogoutSpinnerComponent,{data:{clickedType:'logOut'}})
          }
        }
      );
  }

  // Determine the progress bar color based on usage percentage
  getProgressBarClass(percentage: string): string {
    const usage = parseInt(percentage.replace('%', ''), 10);
    if (usage >= 90) {
      return 'bg-danger'; // Red for above 90%
    } else if (usage >= 70) {
      return 'bg-warning'; // Yellow for above 70%
    }
    return 'bg-success'; // Green for below 70%
  }
  isFlipped: boolean = false; // State for flipping
  flipManually(): void {
    this.isFlipped = !this.isFlipped;
  }
}
