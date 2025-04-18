import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_LOCALE, MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';


@Component({
  selector: 'app-custom-date',
  standalone: true,
  imports: [MatDialogModule,TranslateModule,ReactiveFormsModule,FormsModule,MatFormFieldModule, MatDatepickerModule, MatInputModule, MatNativeDateModule, FormsModule],
  providers: [provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }
  ],
  templateUrl: './custom-date.component.html',
  styleUrl: './custom-date.component.css'
})
export class CustomDateComponent {
currentDate:any | undefined
minDate: any;
onDateRangeChange() {
  this.callFilter.inCallStartDateTime=this.range.value.start
  this.callFilter.inCallEndDateTime=this.range.value.end
}
dateChange(event: MatDatepickerInputEvent<Date>) {
  this.callFilter.inCallStartDateTime=event.value
  this.callFilter.inCallEndDateTime=event.value  
}
range = new FormGroup({
  start: new FormControl<Date | null>(null),
  end: new FormControl<Date | null>(null),
});

  callFilter: any = {
    inColorCodeId:null,
    inExtensionNumber: null,
    inCallDirection: null,
    inAgentCode: null,
    inCallStartDateTime:null,
    inCallEndDateTime:null,
    inCallStartTime: null, 
    inCallEndTime: null,
    inPageNumber: null,
    inRecordsPerPage: null,
    inUserId: null,
    inSortColumn: null,
    inSortOrder: null
  };

  constructor(
    public dialogRef: MatDialogRef<CustomDateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fromDate: string | null; toDate: string | null }
  ) {
    this.data.fromDate = this.convertDate(data.fromDate);
    this.data.toDate = this.convertDate(data.toDate);
  }
  convertDate(date: any): string {
    const [day, month, year] = date.split('/');
    return `${year}-${month}-${day}`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onDone(): void {
    console.log("");
    
    this.dialogRef.close(this.data);
  }
  
}
