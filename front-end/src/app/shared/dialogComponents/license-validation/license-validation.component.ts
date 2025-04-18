import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/authentication/auth.service';

@Component({
  selector: 'app-license-validation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './license-validation.component.html',
  styleUrl: './license-validation.component.css',
  encapsulation: ViewEncapsulation.None
})

export class LicenseValidationComponent {
  validationForm: FormGroup;
  errorMessage: string | null = null;
  userHierarchyId: any;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<LicenseValidationComponent>,
    private authService: AuthService,
    private authGuard: AuthService,
  ) {
    this.validationForm = this.fb.group({
      licenseKey: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const extractedData = this.authService.extractDataFromToken(localStorage.getItem('token'))
    this.userHierarchyId = extractedData.userHierarchyId
    console.log("this.userHierarchyId",this.userHierarchyId);
  }
  // Validate license key
  validateKey(): void {
    const enteredKey = this.validationForm.controls['licenseKey'].value;
    const validateLicenseKey = this.authGuard.validateLicenseKey(enteredKey).subscribe(
      (res: any) => {  
        if (res.status) {
          const amc = res.decoded.amc
          const internalFeatures = res.decoded.if
          const serialKey = res.decoded.od.sk

          const updateLicenseKey = this.authGuard.updateLicenseKey(enteredKey, internalFeatures, serialKey, amc).subscribe(
            (res: any) => {
              this.dialogRef.close(false);
            }, error => {
              console.error("Update failed", error);
              this.errorMessage = 'License key is invalid';
            }
          )

        }
      }, error => {
        console.error("Validation failed after retries", error);
        this.errorMessage = 'License key is invalid';
      }
    )
  }
// Closes the dialog
  closeDialog() {
    this.dialogRef.close(); 
  }
}
