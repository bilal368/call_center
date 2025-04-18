import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { CallReportService } from '../../core/services/callReport/call-report.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { MatDialogRef } from '@angular/material/dialog';
import { PopUpComponent } from '../../shared/dialogComponents/pop-up/pop-up.component';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [FormsModule, MatToolbarModule, AngularEditorModule, MatTooltipModule, MatIconModule, MatButtonModule, MatDialogModule, ReactiveFormsModule],
  providers: [CallReportService],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css'
})
export class FeedbackComponent {

  htmlContent: any
  isEditable:boolean=true
  editorConfig: AngularEditorConfig = {
    editable: true,
    toolbarHiddenButtons: [
      ['insertImage', 'insertVideo', 'fontName']
    ],
  };

  constructor(public dialog: MatDialog, private callReportApi: CallReportService,
    @Inject(MAT_DIALOG_DATA) public datas: any, private snackBar: MatSnackBar, private dialogRef: MatDialog,
    public dialogReff: MatDialogRef<FeedbackComponent> ) { }


  ngOnInit(): void {
    this.htmlContent = this.datas.supervisorFeedBack
    this.isEditable=this.datas?.isEditable
    
  }

  saveHtml() {
    const payload = {
      feedback: this.htmlContent, recordingCallLogId: this.datas.recordingCallLogId
    }
    this.callReportApi.addFeedback(payload).subscribe((res: any) => {
      if (res.status) {
        // this.snackBar.open(res.message, 'Dismiss', {
        //   duration: 3000,
        //   verticalPosition: 'top'
        // });
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: res.message},
        });
        this.dialogReff.close(this.htmlContent);
      }
    }, error => {
      if (error.status === 404) {
        this.dialog.closeAll()
        // this.snackBar.open(error.error.message, 'Dismiss', {
        //   duration: 3000,
        //   verticalPosition: 'top'
        // });
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: error.error.message},
        });
      }
      else if (error.status === 403) {
        this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true});
      } else if (error.status === 401) {
        this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } ,disableClose:true});
      }
    });
  }
  clearHtml() {
    this.htmlContent = ''
  }
}
