import { CommonModule, WeekDay } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { AlertsService } from '../../core/services/alertsManagement/alerts.service';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AlertsManagementComponent } from '../../shared/dialogComponents/alerts-management/alerts-management.component';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { Router } from '@angular/router';
import { AlertDialogComponent } from '../../shared/dialogComponents/alert-dialog/alert-dialog.component';
import { Dialog } from '@angular/cdk/dialog';
import { UserMangerService } from '../../core/services/userManger/user-manger.service';
import { SearchPipe } from "../../core/pipe/search.pipe";
import {MatMenuModule, MatMenuTrigger} from '@angular/material/menu';
import { ConfirmationDialogComponent } from '../../shared/dialogComponents/confirmation-dialog/confirmation-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { PopUpComponent } from '../../shared/dialogComponents/pop-up/pop-up.component';

interface Weekday {
  label:string,
  alertDay: string;
  alertStartTime: string;
  alertEndTime: string;
  alertInterval: undefined
}
@Component({
  selector: 'app-recording',
  standalone: true,
  providers:[SearchPipe,{ provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { autoFocus: false } },],

  imports: [CommonModule,MatMenuModule, FormsModule, MatCheckboxModule, MatIconModule,TranslateModule, MatButtonModule,
    MatSelectModule, MatFormFieldModule, ReactiveFormsModule, SearchPipe, MatTooltipModule],
  templateUrl: './recording.component.html',
  styleUrl: './recording.component.css'
})
export class RecordingComponent implements OnInit {
  buildDiv: string = 'Not Recording';

  requestBody: {
    action: string;
    alertItem: string;
    userId: string;
    userListwithAlerts: any[];
    timeInterval: Weekday[];
    recorderType:Number
  } = { action: "",  alertItem: "",  userId: "", userListwithAlerts:[],timeInterval: [],recorderType:0}
    weekdays: Weekday[] = [
      { label:'Menu.ALERTS MANAGEMENT.RECORDING.Not Recording.Interval Days.Monday',alertDay: 'Monday', alertStartTime: '', alertEndTime: '', alertInterval: undefined },
      { label:'Menu.ALERTS MANAGEMENT.RECORDING.Not Recording.Interval Days.Tuesday',alertDay: 'Tuesday', alertStartTime: '', alertEndTime: '', alertInterval: undefined },
      { label:'Menu.ALERTS MANAGEMENT.RECORDING.Not Recording.Interval Days.Wednesday',alertDay: 'Wednesday', alertStartTime: '', alertEndTime: '', alertInterval: undefined },
      { label:'Menu.ALERTS MANAGEMENT.RECORDING.Not Recording.Interval Days.Thursday',alertDay: 'Thursday', alertStartTime: '', alertEndTime: '', alertInterval: undefined },
      { label:'Menu.ALERTS MANAGEMENT.RECORDING.Not Recording.Interval Days.Friday',alertDay: 'Friday', alertStartTime: '', alertEndTime: '', alertInterval: undefined },
      { label:'Menu.ALERTS MANAGEMENT.RECORDING.Not Recording.Interval Days.Saturday',alertDay: 'Saturday', alertStartTime: '', alertEndTime: '', alertInterval: undefined },
      { label:'Menu.ALERTS MANAGEMENT.RECORDING.Not Recording.Interval Days.Sunday',alertDay: 'Sunday', alertStartTime: '', alertEndTime: '', alertInterval: undefined }
    ];
  userList: any = [
  ]
  recorderType:number=0
  userListCopy:any={}
  startTimeInput: FormControl = new FormControl()
  endTimeInput: FormControl = new FormControl()
  role: FormControl = new FormControl()
  searchKey: string = ''
  searchPipe: SearchPipe;
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
  constructor(
    private api: AlertsService,
    private dialogRef: MatDialog,
    private router:Router,
    private snackbar:MatSnackBar,
    private translate:TranslateService,
    private userMangerApi: UserMangerService,
    searchPipe:SearchPipe,
    public dialog:MatDialog
  ) {
    this.searchPipe = searchPipe

  }
  ngOnInit(): void {
    // this.manageAlerts("getUsers",this.buildDiv);
    // call timeinterval if Clicked =Not Recording
    if (this.buildDiv === 'Not Recording') {
      this.getRecorderTypes();
      //then calls getTimeIntervalData and getUsersInAlerts
     
    } else{
      this.getUsersInAlerts("getUsersInAlerts", this.buildDiv,this.recorderType);

    }
    this.fetchRoles()
  }

  divFunction(arg: string) {
    if(arg=='Network Failure'){
      this.recorderType=0
    }else{
      this.recorderType=this.recorders[0].recorderTypeId
      this.selectFormControl.patchValue(this.recorders[0].recorderTypeId) // Set to first item)      

    }
    this.buildDiv = arg
    this.getUsersInAlerts("getUsersInAlerts", this.buildDiv,this.recorderType);
  }
  recorders:any=[]
  selectedRecorder: any = ''
  selectFormControl = new FormControl('', Validators.required);
  // get recorder types
  getRecorderTypes(){
    this.api.getRecorderTypes().subscribe((data:any )=> {
      this.recorders=data.recorders      
      this.selectFormControl.patchValue(this.recorders[0].recorderTypeId) // Set to first item)      
      this.recorderType=this.recorders[0].recorderTypeId
      this.getTimeIntervalData(this.buildDiv,this.recorderType);
      this.getUsersInAlerts("getUsersInAlerts", this.buildDiv,this.recorderType);

    },(Error)=>{
      console.error(Error);
      
    })
  }
  // get users in alerts
  getUsersInAlerts(action: string, alertItem: string,recorderType:Number) {
    this.requestBody.action = action
    this.requestBody.alertItem = alertItem
    this.requestBody.recorderType=recorderType
    this.api.manageAlerts(this.requestBody).subscribe((result: any) => {
      
      this.userList = result.userList.map((user:any) => ({
        ...user,
        fullName: `${user.firstname} ${user.lastname}`
      }));
      this.userListCopy=result
      
    }, (Error) => {
      
        console.error("Error:", Error);
        if (Error.status === 403) {
          
          // opens dialog for logout message
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } ,disableClose:true})
        }
        else if (Error.status === 401) {
       
          this.router.navigateByUrl('')
        }
      })
    
  }
  getTimeIntervalData(alertItem:string,recorderType:Number){
    this.requestBody.action = "getTimeIntervalData"
    this.requestBody.recorderType=recorderType
    this.requestBody.alertItem = alertItem
    this.api.manageAlerts(this.requestBody).subscribe((result: any) => {
      this.weekdays = this.weekdays.map((item) => {
        const foundItem = result.daysList.find((resItem: any) => resItem.alertDay === item.alertDay);
        
        return foundItem ? { ...item, ...foundItem } : item;
      });
      

    }, (Error) => {
      
        console.error("Error:", Error);
        if (Error.status === 404) {  
          this.showConfirmForAdd();
        }
        else if (Error.status === 403) {        
          // opens dialog for logout message
          this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true })
        }
        else if (Error.status === 401) {
          this.router.navigateByUrl('')
        }
      })
  }
  recorderChanged(event:MatSelectChange){
  this.recorderType=event.value
  this.requestBody.recorderType=event.value //changing api body select settings based on recorder type
  this.getUsersInAlerts("getUsersInAlerts", this.buildDiv,this.recorderType)
  this.getTimeIntervalData(this.buildDiv,this.recorderType)
  }
  resetTimePicker() {
    this.weekdays.forEach(weekday => {
      weekday.alertStartTime = '';
      weekday.alertEndTime = '';
      weekday.alertInterval = undefined;
    });
  }
  resetSelection(){
    this.getUsersInAlerts("getUsersInAlerts", this.buildDiv,this.recorderType);

    
  }
  validateTimeInterval() {
    let Checked;
    let msg:any;
    this.weekdays.forEach((day: any) => {
      
      if (day.alertStartTime && day.alertEndTime) {
        
        if (day.alertInterval==undefined) {
          Checked=false
          msg=this.translate.instant('Menu.ALERTS MANAGEMENT.Common.Enter time interval')
        }
        const startTime = new Date(`1970-01-01T${day.alertStartTime}:00`);
        const endTime = new Date(`1970-01-01T${day.alertEndTime}:00`);
        if (endTime < startTime) {
          Checked=false
          msg=this.translate.instant('Menu.ALERTS MANAGEMENT.Common.End time should be greater than start time')
      

        } else {
        
          
        }
      } else {
        Checked=false
        msg=this.translate.instant('Menu.ALERTS MANAGEMENT.Common.Fields cannot be empty')
        
      }
    });
    if(Checked==false){
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: msg},
      });
    }else{
        // api call for save
        this.saveTimeInterval()
    }
  }
  changeCheckBox(event: MatCheckboxChange, alertUserId: number, type: string) {
    this.userList.forEach((user: any) => {
      if (user.alertUserId === alertUserId) {
        if (event.checked) {
          type === 'isEmailAlert' ? (user.isEmailAlert = 1) : (user.isShowPopUpAlert = 1);
        } else {
          type === 'isEmailAlert' ? (user.isEmailAlert = 0) : (user.isShowPopUpAlert = 0);
        }
        // Mark the user as changed
        user.isChanged = true;
      }
    });
  }
  
  saveTimeInterval(){    
    this.requestBody.action='setTimeInterval';
    this.requestBody.timeInterval=this.weekdays;
    this.api.manageAlerts(this.requestBody).subscribe((result:any)=>{
      console.log(result,'result');
      
      if(result.status==true){
        this.getTimeIntervalData(this.buildDiv,this.recorderType);
         
         const msg=this.translate.instant(result.statusText)
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: msg},
        });
        
      }
      
    },(Error)=>{
      console.error(Error,'Error');
      if (Error.status === 403) {
          
        // opens dialog for logout message
        this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } ,disableClose:true})
      }
      else if (Error.status === 401) {
     
        this.router.navigateByUrl('')
      }
      
    })
  }
  saveAlerts(){
    this.validateTimeInterval()
    this.requestBody.timeInterval=this.weekdays;
    const changedUsers = this.userList.filter((user: any) => user.isChanged);

    // Prepare the request body
    this.requestBody.action = 'setAlertForUsers';
    this.requestBody.userListwithAlerts = changedUsers;

    // API call
    this.api.manageAlerts(this.requestBody).subscribe((result: any) => {
      
      if (result.status === true) {
        this.getUsersInAlerts("getUsersInAlerts", this.buildDiv,this.recorderType);
        const msg = this.translate.instant('Menu.ALERTS MANAGEMENT.Common.Alerts updated successfully');
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: msg },
        });
  
        // Reset the isChanged flag after saving
        this.userList.forEach((user: any) => {
          user.isChanged = false;
        });
      }
    },(Error)=>{
      console.log('Error',Error);
      
      if (Error.status === 403) {
          
        // opens dialog for logout message
        this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true })
      }
      else if (Error.status === 401) {
     
        this.router.navigateByUrl('')
      }
      
    })
  }
  removeUserFromList(alertUserId:any){
    const message=this.translate.instant('Are you sure you want to remove the selected user?')
    this.dialogRef.open(ConfirmationDialogComponent,{data:{clickedStatus: "deleteConfirmation",message},}).afterClosed().subscribe((result:any)=>{
      // console.log(result);
      
      if(result==true){
        this.requestBody.action = 'removeUserFromAlerts'
         this.requestBody.userId = alertUserId;
        this.api.manageAlerts(this.requestBody).subscribe((result:any)=>{
          const msg=this.translate.instant('Menu.ALERTS MANAGEMENT.Common.User removed from list')
         this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: msg},
        });
          this.getUsersInAlerts('getUsersInAlerts', this.buildDiv,this.recorderType)
          
        },(Error)=>{
          console.error (Error);
          if (Error.status === 403) {
          
            // opens dialog for logout message
            this.dialogRef.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true })
          }
          else if (Error.status === 401) {
         
            this.router.navigateByUrl('')
          }
          
        })
      }
      
    })
  }
  public isVisible: boolean = false;
  public message:string=''
  popupColor:string=''
 
  // confirmation
  public isVisibleAlert: boolean = true;
  showConfirmForAdd(){
    const message='Menu.ALERTS MANAGEMENT.RECORDING.Not Recording.Time interval not yet set'

    this.dialogRef.open(AlertsManagementComponent,{
      height:'20vh',
      width:'20vw',
      disableClose: true,
      data:{type:'popupMsg',message:message}}).afterClosed().subscribe((result:any)=>{
      if(result==true){
        this.isVisibleAlert=false
      }
    })

  }
  // open dialog for add user exclude already added users under each session
  usersForAdd() {
    this.dialogRef.open(AlertsManagementComponent,{data:{alertItem:this.buildDiv,type:'usersForAdd',recorder:this.recorderType},width:'40vw',height:'55vh'}).afterClosed().subscribe((result:any)=>{
      this.getUsersInAlerts( 'getUsersInAlerts', this.buildDiv,this.recorderType)
    })
  }
  roles:any=[];
  filteredRoles:any=[];
  searchText:any=''
  selectedRole:any='hari'
  fetchRoles(){
    this.userMangerApi.getUserRolesgroups({}).subscribe((result:any)=>{
      this.roles=result.groups
      this.roles.forEach((role:any) => {
        this.selectedRoleIds.add(role.roleId); // Add all roles to the selected set
      });
      
    })
  }
   // Method to filter users by selected roles
   getFilteredUsers() {
    return this.userList.filter((user:any) => this.selectedRoleIds.has(user.roleId));
  }
  getRoleName(roleId: number): string {
    const role = this.roles.find((r:any) => r.roleId === roleId);
    return role ? role.roleName : 'Unknown Role';
  }
  onSearchChange(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    if (input === "") {
      this.fetchRoles();
    } else {
      this.searchText = input;

        this.filteredRoles = this.roles.filter((role:any) =>
          role.roleName.toLowerCase().includes(this.searchText.toLowerCase())
        );
        this.roles = this.filteredRoles;
    }

  }
  selectedRoleIds: Set<number> = new Set(); // Use a Set to track selected role IDs
  selectAll = true;
  toggleSelectAll(checked: boolean) {
    this.selectAll = checked;
    if (checked) {
      this.roles.forEach((role:any )=> this.selectedRoleIds.add(role.roleId));
    } else {
      this.selectedRoleIds.clear();
    }
  }
  toggleRoleSelection(roleId: number, isChecked: boolean) {
    if (isChecked) {
      this.selectedRoleIds.add(roleId);
    } else {
      this.selectedRoleIds.delete(roleId);
    }
    // Update "Select All" checkbox state
    this.selectAll = this.roles.every((role:any) => this.selectedRoleIds.has(role.roleId));
  }

  isRoleSelected(roleId: number): boolean {
    return this.selectedRoleIds.has(roleId);
  }
  closeMenu() {
    this.menuTrigger.closeMenu();
  }
}
