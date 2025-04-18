import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, FormBuilder, Validators, AbstractControl, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { UserService } from '../core/services/user/user.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';
import { AuthenticationService } from '../core/services/activeDirectory/authentication.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { from, Observable } from 'rxjs';
import { JWT_OPTIONS, JwtHelperService, JwtModule } from '@auth0/angular-jwt';
import { LogoutSpinnerComponent } from '../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../core/services/authentication/auth.service';
import { SystemInfoServices } from '../core/services/systemInfo/systemInfo-service.service';
import { PopUpComponent } from '../shared/dialogComponents/pop-up/pop-up.component';
import { MatTooltipModule } from '@angular/material/tooltip';


interface Car {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [HttpClientModule, MatInputModule, MatSelectModule, MatFormFieldModule, FormsModule, MatButtonModule, MatIconModule,
    MatMenuModule, ReactiveFormsModule, JwtModule, MatToolbarModule,MatTooltipModule

  ],
  templateUrl: './login.component.html',
  providers: [UserService, AuthenticationService, JwtHelperService,
    { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
  ],
  styleUrl: './login.component.css'
})

export class LoginComponent implements OnInit {

  loginPage: boolean = true
  forgotPassword: boolean = false;
  selected = 'option1';
  selectedOption = new FormControl('ENGLISH');
  status: any;
  clickedStatus: boolean = false;
  loginDetailsForm = this.loginForm.group({
    userName: ['', Validators.required],
    password: ['', Validators.required],
    concurrentLogin:['']
  })
  resetForm = this.loginForm.group({
    userName: ['', Validators.required]
  })
  showPassword:boolean=false

  constructor(private loginForm: FormBuilder,
    private userApi: UserService,
    private logoAPi:SystemInfoServices,
    private router: Router,
    private snackBar: MatSnackBar,
    private api: AuthenticationService,
    private jwtHelper: JwtHelperService,
    private dialogRef: MatDialog,
    private authService: AuthService,
    public dialog: MatDialog
  ) {
    this.selectedOption.valueChanges.subscribe((value) => {
      // You can perform actions based on the selected value here 
    });
  }
  ngOnInit(): void {
    this.dialogRef.closeAll()
    // check logged user's token valid or not :by using jwt helper service
    if (this.jwtExpiredOrNot()) {
      // console.log("JWT false");
      localStorage.removeItem('token')
      // you need to login
    }
    else {
      // console.log("JWT true");
      // dont need to login
     
      
      this.router.navigateByUrl('/dG')
    }
    this.getLogoName();
  }
  get f(): { [key: string]: AbstractControl } {
    return this.loginDetailsForm.controls;
  }

  // function for jwt expired or not
  jwtExpiredOrNot(): any {
    try {
      if (this.jwtHelper) {
        console.warn("token timeout in:", this.jwtTimeRemaining());

        return this.jwtHelper.isTokenExpired(localStorage.getItem('token'))
        // status=true when jwt timed out  status=false when jwt time valid
      }
      else {
        // console.log("not found");
      }
    }
    catch (error) {
      console.error("ERROR:", error);
      return true

    }
  }
  // this function for find jwt's remaining expiry time
  jwtTimeRemaining(): number | null {
    if (this.jwtHelper) {
      const token = localStorage.getItem('token');
      if (token) {
        const decodedToken = this.jwtHelper.decodeToken(token);
        if (decodedToken && decodedToken.exp) {
          const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds
          const now = Date.now();
          const timeRemaining = expirationTime - now;
          return timeRemaining > 0 ? timeRemaining : null; // Return null if expired
        }
      }
    }
    return null; // Return null if JwtHelperService not found or issues
  }

  loginConnection() {
    this.clickedStatus = true

    // function to update the quote in the service
    this.userApi.login(this.loginDetailsForm.value).subscribe((result: any) => {
      localStorage.setItem('token', result.token)
      if (result.status == true) {
        // console.log(result);
     
        this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logIn' } })
        this.clickedStatus = false
        // this.api.addError(result.token);    
        this.authService.setpackageIds(result.token); //setting id to behaviour subject

      }
    }, (error: any) => {
 
      if (error.status === 401) {
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message:'Invalid username or password'},
        });   
      }
      else if(  error.status === 409){
        // already logged on another device confirm before login
        this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'confirmLogin' },
        disableClose:true,
        width:'550px'
      }).afterClosed().subscribe((result:any)=>{
        if(result){
          this.loginDetailsForm.value.concurrentLogin='YES'
          this.clickedStatus = false
          this.loginConnection();
        }else{
          this.clickedStatus = false

        }
      })

      }
      else if (error.status === 429) {
        setTimeout(() => {
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message:'Your password attempts have exceeded the limit. Please contact administrator to regain access'},
          });
          this.clickedStatus = false
        }, 2000);
      }
      else if(error.status==500){
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: 'Please check your connection'},
        });
      }
      this.clickedStatus = false

    }
    )
  }

  set() {
    this.forgotPassword = true
    // this.error = false
    this.loginPage = false
    // this.email = false
  }
  backToLogin() {
    // this.email = false
    this.forgotPassword = false
    // this.error = false
    this.loginPage = true
    // this.emailSentLoading = false
  }
  sendMail() {

  }
  logoName:string='';
  getLogoName(){
    this.logoAPi.getLogoName().subscribe((result:any)=>{
      if(result.status==true){
        this.logoName=result.logoImageFileName
        localStorage.setItem('logoName',this.logoName)
          // call function to get logo from server
          this.getLogoImage()
        
      }
    },(Error)=>{
      console.error(Error);
      
    })
  }
  logoUrl=''
  getLogoImage(){
    this.logoAPi.getFiles(this.logoName).subscribe((blob:any)=>{
      const objectURL = URL.createObjectURL(blob);
      this.logoUrl = objectURL;  // Assign the Blob URL to logoUrl to display the image
    },(Error)=>{
      console.error(Error);
      
    })
  }

  // disable copy,paste,cut
disableCut($event: ClipboardEvent) {
  $event.preventDefault();
}

disableCopy($event: ClipboardEvent) {
  $event.preventDefault();
}

disablePaste($event: ClipboardEvent) {
  $event.preventDefault();
}
}


