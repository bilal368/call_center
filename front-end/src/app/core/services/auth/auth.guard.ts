import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../authentication/auth.service';
import { LicenseValidationComponent } from '../../../shared/dialogComponents/license-validation/license-validation.component';
import { MatDialog } from '@angular/material/dialog';
import { catchError, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  constructor(private authGuard: AuthService, private route: Router, private dialogRef: MatDialog) { }

  canActivate(): any {  
    // validate user has validate license or not
    const validationLicenseKey = this.authGuard.getLicenseKey().subscribe(
      (res: any) => {
        if (res && res.tokenDetails) {
          const hasValidToken = res.tokenDetails.some((token: any) => token.status === 'true');
          if (!hasValidToken) {
            this.openValidationDialog();
          }
          return hasValidToken;
        }
        this.route.navigate(['/dG']);
        return false;
      }, error => {
        console.log("Error",error); 
        if (error.status === 404) {
          this.openValidationDialog();
        }else if(error.status===500){
          this.route.navigate(['']);
        }
      });
  }

  private openValidationDialog(): void {  
    const dialogRef = this.dialogRef.open(LicenseValidationComponent, {
      width: '30%',
      height: 'auto',
      panelClass: 'license-dialog-overlay',
      disableClose: true
    });

    document.body.classList.add('dialog-open');

    dialogRef.afterClosed().subscribe(() => {
      document.body.classList.remove('dialog-open');
    });
  }
}
