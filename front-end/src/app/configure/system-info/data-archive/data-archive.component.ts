import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemInfoServices } from '../../../core/services/systemInfo/systemInfo-service.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AuthService } from '../../../core/services/authentication/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
interface TableData {
  archivePath: string;
  createdDate: string | null; // Allow null values
}

@Component({
  selector: 'app-data-archive',
  standalone: true,
  imports: [FormsModule, TranslateModule, ReactiveFormsModule, MatFormFieldModule, MatTableModule, MatTooltipModule, MatCheckboxModule, MatStepperModule, MatTabsModule, DatePipe],
  providers: [DatePipe],
  templateUrl: './data-archive.component.html',
  styleUrls: ['./data-archive.component.css']
})
export class DataArchiveComponent implements OnInit {
  mountForm: FormGroup;
  errorMessage: string = '';
  archiveForm: FormGroup;
  autoArchiveForm: FormGroup;
  archiveMessage = '';
  autoArchiveMessage = '';
  data: TableData[] = [];
  manualArchivedData:TableData[] = [];
  timeSlots: string[] = [];
  pathList: string[] = [];
  folderList:string[]=[];
  dateSlots: any[] = [];
  newFolderStatus:boolean = false;
  days: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  generatedDays: { value: number; name: string }[] = [];

  isLinear = false;
  isWeekly: boolean = false;
  isMonthly: boolean = false;
  currentStep = 1; // Stepper tracking
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  // isDefaultLocation: boolean = false;
  dataSource = new MatTableDataSource<TableData>(this.data);
  displayedColumns: string[] = ['FilePath', 'Date'];

  constructor(private systemAPI: SystemInfoServices,private datePipe:DatePipe) {
    this.mountForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
      path: new FormControl('', [Validators.required]),
      mount_point: new FormControl('', [Validators.required]),

    });
    this.archiveForm = new FormGroup({
      archiveFileName: new FormControl('', [Validators.required, Validators.pattern(/^[^\\/:`'*?"<>|]+$/)]),
      isActivePath: new FormControl(false,)

    });
    this.autoArchiveForm = new FormGroup({
      timePeriod: new FormControl('', [Validators.required, Validators.pattern(/^[^\\/:`'*?"<>|]+$/)]),
      day: new FormControl(''), // Fixed missing `new FormControl`
      date: new FormControl(''), // Changed array notation to `new FormControl`
      time: new FormControl('', Validators.required), // Changed array notation to `new FormControl`,
      folderList: new FormControl('')
    });
  }

  ngOnInit(): void {
     this.getArchiveDetails();
  }
  getArchiveDetails(){
    this.systemAPI.getArchiveSetting().subscribe((result: any) => {
	    this.folderList = result.folders;
    })
  }
  formatDate(date: string | null): string {
    return date ? this.datePipe.transform(date, 'dd/MM/yyyy') ?? '' : 'N/A';
  }
  isMounted: boolean = false;
  // Mount the CIFS share
  mountCIFS() {
    console.log("Form:",this.mountForm.value);
    if (this.mountForm.invalid) {
      this.errorMessage = 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Data Archive.alert8';
      return;
    }
    const apiCall = this.isMounted ? this.systemAPI.unMountCIFS(this.mountForm.value) : this.systemAPI.mountCIFS(this.mountForm.value);
    apiCall.subscribe(
      (result: any) => {
        console.log('API result:', result);

        switch (result.responseData.status_code) {
          case 201: // Successfully Mounted
            this.isMounted = true;
            this.errorMessage = 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Data Archive.alert1';
            break;

          case 208: // Already Mounted
            this.isMounted = true;
            this.errorMessage = 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Data Archive.alert3';
            break;

          case 200: // Successfully Unmounted
            this.isMounted = false;
            this.errorMessage = 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Data Archive.alert2';
            break;

          case 410: // Already Unmounted
            this.isMounted = false;
            this.errorMessage = 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Data Archive.alert4';
            break;

          default: // Unknown Status Code
            this.errorMessage = 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Data Archive.alert5';
            break;
        }
        console.log(this.errorMessage);

      },
      (error) => {
        console.error('API error:', error);

        if (this.isMounted) {
          this.errorMessage = 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Data Archive.alert7';
        } else {
          this.errorMessage = 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Data Archive.alert6';
        }
      }
    );
  }

  // Function to get default location
  getArchiveDefaultLocation() {

    const body = this.mountForm.value;
    this.systemAPI.getDefaultLocation(body).subscribe((result: any) => {
      this.data = result.autoArchiveList.map((item: any) => ({
        createdDate: item.createdDate ? new Date(item.createdDate) : null,
        archivePath:item.archivePath
      }));
      // this.mountForm.patchValue(result);
	    this.pathList = result.folders;
	    this.manualArchivedData=result.manualArchivedList;
      this.generateTimeSlots();
      this.generateDateSlots();
      this.generateDays();
    }, (Error) => {
      console.error('Error>>>', Error);
    });
  }

  addNewFolder(){
    this.newFolderStatus = true;
    this.mountForm.get('mount_point')?.reset();  // Reset the form control
    this.folderList = [];  // Clear the dropdown list
  }
  removeNewFolder(){
    this.newFolderStatus = false;
    this.getArchiveDetails();
  }
  // Archive records
  archiveFile() {
    this.errorMessage = ''
    this.archiveMessage = ''
    if (this.archiveForm.invalid) {
      this.archiveMessage = 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Data Archive.alert11';
      return;
    }
    let combinedBody = { ...this.archiveForm.value, ...this.mountForm.value }
    this.systemAPI.manualArchive(combinedBody).subscribe((result: any) => {
      // Simulate API call for archiving
      const archiveSuccess = true; // Replace with actual API response
      this.archiveMessage = archiveSuccess
        ? 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Data Archive.alert12'
        : 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Data Archive.alert13';
    }, error => {
      if (error.status == 409) {
        // file name already exist
        this.errorMessage = 'Menu.CONFIGURE.SYSTEM MANAGEMENT.Data Archive.alert10';
      }
      console.error('Archiving error:', error);
    });
  }


  autoArchive() {
    if (this.autoArchiveForm.invalid) {
      if (!this.autoArchiveForm.get('timePeriod')?.value) {
        this.errorMessage = 'Time period is required!';
        return;
      }
      if (this.isWeekly && !this.autoArchiveForm.get('day')?.value) {
        this.errorMessage = 'Please select a day for weekly scheduling!';
        return;
      }
      if (this.isMonthly && !this.autoArchiveForm.get('date')?.value) {
        this.errorMessage = 'Please select a date for monthly scheduling!';
        return;
      }
      if (!this.autoArchiveForm.get('time')?.value) {
        this.errorMessage = 'Time is required!';
        return;
      }

      this.errorMessage = 'Please fill out all required fields!';
      return;
    }

    // Extracting form values
    let path = "";
    let day = "";
    let mountPoint = "";
    let selectedText="";
    const mPoint = this.mountForm.value.mount_point;
    const timePeriod = this.autoArchiveForm.value.timePeriod;
    const time = this.autoArchiveForm.value.time;
    if (timePeriod == "Auto Weekly") {
      day = this.autoArchiveForm.value.day;
    } 
    else if (timePeriod == "Auto Monthly") {
      day = this.autoArchiveForm.value.date;
    }
 
    path = this.mountForm.value.path;
    if (this.autoArchiveForm.value.folderList != "") {
      const selectedIndex = this.autoArchiveForm.value.folderList;
       selectedText = this.pathList[selectedIndex];
      mountPoint =  mPoint+"/"+selectedText;
    } else {
      mountPoint= mPoint;
    }
    const body = {
      path: path,
      mountPoint: mountPoint,
      timePeriod: timePeriod,
      day: day,
      time: time,
      selectedLocation:selectedText
    };
    //  Calling the API
    this.systemAPI.autoarchive(body).subscribe(
      (result: any) => {
        const archiveSuccess = true; // Replace with actual API response
     
        if(result.status == true){
          this.autoArchiveMessage = archiveSuccess
          ? 'File has been archived successfully.'
          : 'Failed to archive the file.';
        }
        setTimeout(() => {
          this.autoArchiveMessage = '';
        }, 5000);
      },
      (error) => {
        if (error.status === 409) {
          this.errorMessage = 'A file with this name already exists.';
        }
        console.error('Archiving error:', error);
      }
    );
  }


  nextStep() { 
    this.errorMessage = ''
    this.currentStep++;
    this.getArchiveDefaultLocation();
  }
  previousStep() {
    this.currentStep--;
  }
  // Update error message based on validation
  updateErrorMessage() {
    if (this.mountForm.get('path')?.hasError('required')) {
      this.errorMessage = 'Menu.CONFIGURE.SYSTEM INFO.Data Archive.alert9';
    } else {
      this.errorMessage = '';
    }
  }
  generateTimeSlots() {
    for (let hour = 0; hour < 24; hour++) {
      for (let minutes of ["00", "15", "30", "45"]) {
        let time = `${hour.toString().padStart(2, '0')}:${minutes}`;
        this.timeSlots.push(time);
      }
    }
  }

  generateDateSlots() {
    for (let i = 1; i <= 28; i++) {
      this.dateSlots.push(i);
    }
  }
  generateDays() {
    for (let i = 0; i < this.days.length; i++) {
      this.generatedDays.push({ value: i + 1, name: this.days[i] });
    }
  }

  Scheduling(event: any) {
    const schedule = event.target.value;
    if (schedule === 'Auto Weekly') {
      this.isWeekly = true;
      this.isMonthly = false;
      this.autoArchiveForm.get('day')?.setValidators(Validators.required);
      this.autoArchiveForm.get('date')?.clearValidators();
    } else if (schedule === 'Auto Monthly') {
      this.isMonthly = true;
      this.isWeekly = false;
      this.autoArchiveForm.get('date')?.setValidators(Validators.required);
      this.autoArchiveForm.get('day')?.clearValidators();
    } else {
      this.isWeekly = false;
      this.isMonthly = false;
      this.autoArchiveForm.get('day')?.clearValidators();
      this.autoArchiveForm.get('date')?.clearValidators();
    }
    this.autoArchiveForm.get('day')?.updateValueAndValidity();
    this.autoArchiveForm.get('date')?.updateValueAndValidity();
  }
  getFolder() {

  }
}