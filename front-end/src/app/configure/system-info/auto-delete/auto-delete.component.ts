import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { SystemInfoServices } from '../../../core/services/systemInfo/systemInfo-service.service';
import { MatDialog } from '@angular/material/dialog';
import { PopUpComponent } from '../../../shared/dialogComponents/pop-up/pop-up.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-auto-delete',
    standalone: true,
    imports: [ReactiveFormsModule,MatTooltipModule],
    templateUrl: './auto-delete.component.html',
    styleUrl: './auto-delete.component.css'
})
export class AutoDeleteComponent implements OnInit {
    autoDeleteForm: FormGroup;
    timeOptions = [30, 60, 120, 180]; // Time options for Time-Based deletion
    isSaved: boolean = true;
    errorMessage: string = ''
    successMessage: string = ''
    constructor(private fb: FormBuilder,
        private systemApi: SystemInfoServices,
        private dialog:MatDialog
    ) {
        this.autoDeleteForm = this.fb.group(
            {
                autoDeleteType: [0, Validators.required],
                thresholdMin: [
                    '',
                    [Validators.required, Validators.min(0), Validators.max(100)]
                ],
                thresholdMax: [
                    '',
                    [Validators.required, Validators.min(0), Validators.max(100)]
                ],
                retentionPeriod: ['', Validators.required]
            },
            { validators: this.thresholdValidator }
        );
    }
    ngOnInit(): void {
        this.loadAutoDeleteSettings();
    }
    // Load existing auto-delete settings
    loadAutoDeleteSettings() {
        this.systemApi.getAutoDeleteSettings().subscribe(
            (response: any) => {
                if (response.status && response.data) {
                    const { autoDeleteType, thresholdMin, thresholdMax, retentionDays } =
                        response.data;

                    this.autoDeleteForm.patchValue({
                        autoDeleteType,
                        thresholdMin: autoDeleteType == 0 ? thresholdMin : '',
                        thresholdMax: autoDeleteType == 0 ? thresholdMax : '',
                        retentionPeriod: autoDeleteType == 1 ? retentionDays : '',
                    });

                }
            },
            (error) => {
                if(error.status==404){
                     this.dialog.open(PopUpComponent, {
                          width: "500px",
                          height: "290px",
                          data: { message: 'Auto delete settings not found'},
                        });
                }else{
                    console.error('Error loading auto-delete settings:', error);
                    this.errorMessage = 'Failed to load auto-delete settings.';
                }
               
            }
        );
    }
    // Custom Validator for Threshold Limits
    thresholdValidator = (form: AbstractControl): ValidationErrors | null => {
        const min = form.get('thresholdMin')?.value;
        const max = form.get('thresholdMax')?.value;

        if (min === null || max === null) return null; // Ignore if empty
        if (min < 0 || max < 0 || min > 100 || max > 100) return { thresholdInvalid: true }; // Ensure 0-100 range
        if (min >= max) return { thresholdInvalid: true }; // Min should be less than Max

        return null;
    };

    // Submit Auto Delete Form
    submitAutoDelete() {
        this.errorMessage = '';
        this.successMessage = '';

        const requestBody = this.autoDeleteForm.value;


        this.systemApi.saveAutoDelete(requestBody).subscribe(
            (response: any) => {
                this.dialog.open(PopUpComponent, {
                    width: "500px",
                    height: "290px",
                    data: { message: `Auto delete settings applied successfully.` },
                  });
            },
            (error) => {
                if (error.status === 409) {
                    this.errorMessage = 'Conflict: Duplicate entry detected.';
                } else {
                    this.errorMessage = 'Fields are required.';
                }
                console.error('Auto Delete Error:', error);
            }
        );
    }
}
