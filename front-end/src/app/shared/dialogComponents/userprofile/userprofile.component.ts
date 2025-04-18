import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UserMangerService } from '../../../core/services/userManger/user-manger.service';
import { LogoutSpinnerComponent } from '../logout-spinner/logout-spinner.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogClose } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/authentication/auth.service';
import { PopUpComponent } from '../pop-up/pop-up.component';

@Component({
  selector: 'app-userprofile',
  standalone: true,
  imports: [TranslateModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule,
    MatToolbarModule,MatDialogClose
  ],
  providers:[UserMangerService],
  templateUrl: './userprofile.component.html',
  styleUrl: './userprofile.component.css'
})
export class UserprofileComponent {
languageForm: any;
languages: any[] = []; 


constructor(
  private fb: FormBuilder,
  private userMangerapi: UserMangerService,
  private snackBar: MatSnackBar,
  private dialogRef: MatDialog,
  public dialog: MatDialog,
  private authService:AuthService
) {
  // Initialize the form with an empty value for language
  this.languageForm = this.fb.group({
    language: [''] 
  });
}


ngOnInit(): void {

  this.getLanguages()

}

 // get Languages
 getLanguages() {
  this.userMangerapi.getAllLanguages().subscribe((res: any) => {     
    this.languages = res.Data;
    if (this.languages.length > 0) {
      this.extractId()
    }
  })
}
// get user language from token
extractId() {
  const extractedData = this.authService.extractDataFromToken(localStorage.getItem('token'))   
  const language = extractedData.languageFileName || 'en-us';
  this.languages.forEach((value:any)=>{
    if(value.languageFileName===language){
      this.languageForm.get('language')?.setValue(value.languageId);
    }
  })

}
// save selected language
saveLang(){
  const extractData=this.authService.extractDataFromToken(localStorage.getItem('token'))
  const languageId = this.languageForm.value.language
  this.userMangerapi.updateUserlanguage(extractData.userId,languageId).subscribe((res: any) => { 
    if (res.status) {
      this.dialog.closeAll()
      // this.snackBar.open(res.message, 'Dismiss', {
      //   duration: 3000,
      //   verticalPosition: 'top' 
      // });
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: res.message },
      });
      this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true });
    }
  }, error => {
    if (error.status === 404) {
      // this.snackBar.open(error.error.message, 'Dismiss', {
      //   duration: 3000,
      //   verticalPosition: 'top'
      // });

      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: error.error.message },
      });
      
    }
    else if (error.status === 403) {
      this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true });
    } else if (error.status === 401) {
      this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true });
    }
  })
}
}
