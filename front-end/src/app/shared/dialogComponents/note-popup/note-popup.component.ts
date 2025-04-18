import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CallReportService } from '../../../core/services/callReport/call-report.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PopUpComponent } from '../pop-up/pop-up.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SearchPipe } from '../../../core/pipe/search.pipe';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-note-popup',
  standalone: true,
  imports: [FormsModule,MatDialogModule,MatTooltipModule,MatIconModule,SearchPipe, MatToolbarModule,TranslateModule,CommonModule],
  providers: [CallReportService,SearchPipe,DatePipe],
  templateUrl: './note-popup.component.html',
  styleUrl: './note-popup.component.css'
})
export class NotePopupComponent {
  noteValue: any
  callLogId: any
  notes: any
  userId: any
  uiType:any
  searchKey: string = ''
  searchPipe: SearchPipe;
  archivedList:any;
  isEditable:boolean=true
  toolTips:any={
    Close: 'Menu.CONFIGURE.EMPLOYEE MANAGER.CLOSE',
  }
  constructor(private popUp: MatDialog, private callReportApi: CallReportService,
    public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public datas: any,
    private translate:TranslateService,
    public datePipe: DatePipe,
    searchPipe:SearchPipe,
    public dialogRef: MatDialogRef<NotePopupComponent>, private snackBar: MatSnackBar) 
    {
      this.searchPipe = searchPipe

  }
  ngOnInit(): void {
    this.noteValue = this.datas.noteValue
    this.callLogId = this.datas.recordingCallLogId
    this.uiType = this.datas?.type
    this.archivedList = this.datas?.archivedFiles
    this.isEditable=this.datas.isEditable

    
  }
  clearButton() {
    this.noteValue = null
  }

  saveButton() {
    
    this.callReportApi.notesReport(this.noteValue, this.callLogId).subscribe((res: any) => {
      if (res.status) {
        this.dialog.closeAll()
        // this.snackBar.open(res.message, 'Dismiss', {
        //   duration: 2000,
        //   verticalPosition: 'top'
        // });
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: res.message },
        });
      }
    })
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    if (target.value.length > 250) {
      this.noteValue = target.value.slice(0, 250); // Ensure no more than 250 characters
    }
  }
  onSelect(item:any){
    this.dialogRef.close(item)
  }
 
}
