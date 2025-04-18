import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemInfoServices } from '../../../core/services/systemInfo/systemInfo-service.service';
import { PopUpComponent } from '../../../shared/dialogComponents/pop-up/pop-up.component';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-mailer-settings',
  standalone: true,
  imports: [ReactiveFormsModule,MatTooltipModule],
  templateUrl: './mail-settings.component.html',
  styleUrl: './mail-settings.component.css'
})
export class MailSettingsComponent  implements OnInit{

  mailSettingsForm: FormGroup;
  errorMessage: string = ''

    constructor(private fb: FormBuilder,
       private dialog:MatDialog,
      private systemApi: SystemInfoServices,
    ){
      this.mailSettingsForm = this.fb.group({
        SMTPServer: ['', Validators.required],
        username: ['', Validators.required],
        SMTPPort: [, [Validators.required, Validators.min(1)]],
        passwordNew: ['', Validators.required], // Leave empty for security; set via user input
        senderEmail: ['', [Validators.required, Validators.email]],
        isSslEnabled: [false] // Default: SSL Disabled
      });
      
      
    }
  ngOnInit(): void {
    this.loadSMTPSettings();  
  }


// Load existing SMTP settings
loadSMTPSettings() {
  this.systemApi.getSMTPSettings().subscribe(
      (response: any) => {
          if (response.status && response.data) {

              this.mailSettingsForm.patchValue(response.data)
          }
      },
      (error) => {
          if (error.status == 404) {
              this.dialog.open(PopUpComponent, {
                  width: "500px",
                  height: "290px",
                  data: { message: "Mail settings not found" },
              });
          } else {
              console.error("Error loading Mail settings:", error);
              this.errorMessage = "Failed to load Mail settings.";
          }
      }
  );
}

    submitMailerSettingsForm() {
      this.errorMessage = '';
  
      const requestBody = this.mailSettingsForm.value;
  
      this.systemApi.saveMailSettings(requestBody).subscribe(
          (response: any) => {
              this.dialog.open(PopUpComponent, {
                  width: "500px",
                  height: "290px",
                  data: { message: `Mail settings applied successfully.` },
              });
          },
          (error) => {
              if (error.status === 409) {
                  this.errorMessage = 'Conflict: Duplicate entry detected.';
              } else {
                  this.errorMessage = 'Fields are required.';
              }
              console.error('Mail Settings Error:', error);
          }
      );
  }
  
}
