import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [TranslateModule,FormsModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.css'
})
export class ConfirmationDialogComponent implements OnInit{
  clickedStatus:any;
  password:any;
  constructor(public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {message: any ,clickedStatus:any}
  ) {}
  ngOnInit(): void {
    this.clickedStatus = this.data.clickedStatus;
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
  passwordConfirm(){
    this.dialogRef.close({status:true,password:this.password});

  }
  onCancel(): void {
    this.dialogRef.close(false);
  }
}
