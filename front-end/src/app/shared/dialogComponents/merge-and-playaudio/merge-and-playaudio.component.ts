import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FeedbackComponent } from '../../../reports/feedback/feedback.component';
import { SharedService } from '../../../core/shared/share.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-merge-and-playaudio',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './merge-and-playaudio.component.html',
  styleUrl: './merge-and-playaudio.component.css'
})
export class MergeAndPlayaudioComponent {
  constructor(public dialog: MatDialog,
    public dialogRef: MatDialogRef<MergeAndPlayaudioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { audioURLs: string[],supervisorFeedBacks: any;recordingCallLogIds: any; },
      private sharedService: SharedService
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  feedbackOpen(recordingCallLogId: any, supervisorFeedBack: any, position :any) {
    const CallLogId = recordingCallLogId[position];
    const FeedBack = supervisorFeedBack[position];
    
    const dialogRef = this.dialog.open(FeedbackComponent, {
      width: '700px',
      height: 'auto',
      data: {
        recordingCallLogId: CallLogId,
        supervisorFeedBack: FeedBack
      },
    });
    dialogRef.afterClosed().subscribe(result => {     
      this.sharedService.callComponentMethod();
      this.data.supervisorFeedBacks[position] = result;
    });

  }
}
