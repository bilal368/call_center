import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-unlockrecord',
  standalone: true,
  imports: [],
  templateUrl: './unlockrecord.component.html',
  styleUrl: './unlockrecord.component.css'
})
export class UnlockrecordComponent {
  constructor(public dialogRef: MatDialogRef<UnlockrecordComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {message: any, status: any }
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
