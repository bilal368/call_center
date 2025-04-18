import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { AlertsService } from '../../core/services/alertsManagement/alerts.service';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AlertDialogComponent } from '../../shared/dialogComponents/alert-dialog/alert-dialog.component';
import { AlertsManagementComponent } from '../../shared/dialogComponents/alerts-management/alerts-management.component';
import { FormControl, FormsModule } from '@angular/forms';
import {MatMenuModule, MatMenuTrigger} from '@angular/material/menu';
import { SearchPipe } from '../../core/pipe/search.pipe';
import { UserMangerService } from '../../core/services/userManger/user-manger.service';
import { ConfirmationDialogComponent } from '../../shared/dialogComponents/confirmation-dialog/confirmation-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { PopUpComponent } from '../../shared/dialogComponents/pop-up/pop-up.component';

@Component({
  selector: 'app-system',
  standalone: true,
  providers:[SearchPipe,{ provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { autoFocus: false } },],
  imports: [MatCheckboxModule,FormsModule,CommonModule,TranslateModule,MatButtonModule,MatIconModule,
    MatMenuModule,SearchPipe,MatTooltipModule],
  templateUrl: './system.component.html',
  styleUrl: './system.component.css'
})
export class SystemComponent implements OnInit {
  alertItems = [
    { name: 'System Shutdown', label: 'Menu.ALERTS MANAGEMENT.SYSTEM.System Shutdown.NAME' },
    { name: 'System Time Change', label: 'Menu.ALERTS MANAGEMENT.SYSTEM.System Time Change.NAME' },
    { name: 'IP Address Change', label: 'Menu.ALERTS MANAGEMENT.SYSTEM.IP Address Change.NAME' },
    { name:"Disk Full",label: 'Menu.ALERTS MANAGEMENT.SYSTEM.Disk Full.NAME' },
    {name:"Client Connection Status",label: 'Menu.ALERTS MANAGEMENT.SYSTEM.Client Connection Status.NAME' }
  ];
  buildDiv: string = 'System Shutdown';
  userList:any=[
    
  ]
  requestBody: {
    action: string;
    alertItem: string;
    userId: string;
    archiveInitialValue:string;
    userListwithAlerts: any[];}={ action: "",  alertItem: "",  userId: "",archiveInitialValue:'', userListwithAlerts:[]}
  public message:string=''
  popupColor:string=''
  role: FormControl = new FormControl()
  searchKey: string = ''
  searchPipe: SearchPipe;
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
constructor(private api:AlertsService,
  private dialog:MatDialog,
  private router:Router,
  private snackbar:MatSnackBar,
  private translate:TranslateService,
  private userMangerApi: UserMangerService,
  searchPipe:SearchPipe
){
  this.searchPipe = searchPipe
}
  ngOnInit(): void {
    // this.manageAlerts("getUsers",this.buildDiv);
    this.getUsersInAlerts("getUsersInAlerts", this.buildDiv);
    // call timeinterval if Clicked =Not Recording
    this.fetchRoles();
    
  
  }

  divFunction(arg: string) {
    this.buildDiv = arg
    this.getUsersInAlerts("getUsersInAlerts", this.buildDiv);
    if(this.buildDiv=='Disk Full'){
      this.getDiskAlertValue();
    }

  }
   // get users in alerts
   getUsersInAlerts(action: string, alertItem: string) {
    this.requestBody.action = action
    this.requestBody.alertItem = alertItem
    this.api.manageAlerts(this.requestBody).subscribe((result: any) => {
      
      this.userList = result.userList.map((user:any) => ({
        ...user,
        fullName: `${user.firstname} ${user.lastname}`
      }));
      
      
    }, (Error) => {
      
        console.error("Error:", Error);
        if (Error.status === 403) {
          
          // opens dialog for logout message
          this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true })
        }
        else if (Error.status === 401) {
       
          this.router.navigateByUrl('')
        }
      })
    
  }
  getDiskAlertValue(){
    this.requestBody.action = "getDiskAlertValue"
    
    this.api.manageAlerts(this.requestBody).subscribe((result:any)=>{
      this.percentage=result.diskAlert[0].archiveInitialValue

    }
    ,(Error)=>{
      console.warn(Error)
    })
  }
  resetSelection(){
    this.getUsersInAlerts("getUsersInAlerts", this.buildDiv);

    
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
  
  saveAlerts(){
      const changedUsers = this.userList.filter((user: any) => user.isChanged);
    
      // Prepare the request body
      this.requestBody.action = 'setAlertForUsers';
      this.requestBody.userListwithAlerts = changedUsers;
    
      // API call
      this.api.manageAlerts(this.requestBody).subscribe((result: any) => {
        if (result.status === true) {
          this.getUsersInAlerts("getUsersInAlerts", this.buildDiv);
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
      if (Error.status === 403) {
          
        // opens dialog for logout message
        this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true })
      }
      else if (Error.status === 401) {
     
        this.router.navigateByUrl('')
      }
      
    })
  }
  removeUserFromList(alertUserId:any){
    const message=this.translate.instant('Are you sure you want to remove the selected user?')
    this.dialog.open(ConfirmationDialogComponent,{data:{clickedStatus: "deleteConfirmation",message},}).afterClosed().subscribe((result:any)=>{
      if(result==true){
        this.requestBody.action = 'removeUserFromAlerts'
         this.requestBody.userId = alertUserId;
        this.api.manageAlerts(this.requestBody).subscribe((result:any)=>{
          const msg=this.translate.instant('Menu.ALERTS MANAGEMENT.Common.User removed from list')
        //  this.snackbar.open(msg, 'Close', {
        //   verticalPosition: 'top',
        //   horizontalPosition:'center',
        //   duration:2000

        // });
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: msg},
        });
          this.getUsersInAlerts('getUsersInAlerts', this.buildDiv)
          
        },(Error)=>{
          console.error (Error);
          if (Error.status === 403) {
          
            // opens dialog for logout message
            this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true })
          }
          else if (Error.status === 401) {
         
            this.router.navigateByUrl('')
          }
          
        })
      }
      
    })
  }
  // function to set limit for disk status
setPercentageForDiskFull(){
  this.requestBody.action='setPercentageForDiskFull'
  this.requestBody.archiveInitialValue=this.percentage.toString()
  this.api.manageAlerts(this.requestBody).subscribe((result:any)=>{
    
    
  },(Error)=>{
    console.error(Error);
    
  })
}

 
    // open dialog for add user exclude already added users under each session
    usersForAdd() {
      this.dialog.open(AlertsManagementComponent,{data:{alertItem:this.buildDiv,type:'usersForAdd'},
        width:'40vw',height:'55vh'})
      .afterClosed().subscribe((result:any)=>{
        this.getUsersInAlerts( 'getUsersInAlerts', this.buildDiv)
      })
    }
    percentage: number = 80;
    isDisabled: boolean = false;
    editPercentage(){
      this.isDisabled = !this.isDisabled;
      if(this.isDisabled==false){
        // call api function to set percentage
        this.setPercentageForDiskFull()
        
      }
      
    }
    roles:any=[];
  filteredRoles:any=[];
  searchText:any=''

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
