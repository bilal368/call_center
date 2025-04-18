import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MAT_DIALOG_DEFAULT_OPTIONS, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AlertsService } from '../../../core/services/alertsManagement/alerts.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchPipe } from '../../../core/pipe/search.pipe';
import { LogoutSpinnerComponent } from '../logout-spinner/logout-spinner.component';
import { Router } from '@angular/router';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserMangerService } from '../../../core/services/userManger/user-manger.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PopUpComponent } from '../pop-up/pop-up.component';

@Component({
  selector: 'app-alerts-management',
  standalone: true,
  imports: [MatIconModule,TranslateModule, CommonModule, FormsModule, SearchPipe, MatCheckboxModule],
  providers:[SearchPipe,{ provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { autoFocus: false } },
  ],
  templateUrl: './alerts-management.component.html',
  styleUrl: './alerts-management.component.css'
})
export class AlertsManagementComponent implements OnInit {
  requestBody: any = { action: 'getUsers', alertItem: '' ,}
  userList: any = []
  searchKey: string = ''
  searchPipe: SearchPipe;
  constructor(@Inject(MAT_DIALOG_DATA) public data: { alertItem: string,type:string,message:'',recorder:'' },
    private api: AlertsService,
    private dialogRef: MatDialogRef<AlertsManagementComponent>,
    private dialog:MatDialog,
    private router: Router,
    private userMangerApi: UserMangerService,
    searchPipe:SearchPipe,
    private snackbar:MatSnackBar,
    private translate:TranslateService,
  ) {
    this.searchPipe = searchPipe
  }
  ngOnInit(): void {
    if(this.data.type=='usersForAdd'){
      this.requestBody.alertItem = this.data.alertItem
      this.requestBody.recorderType = this.data.recorder
      this.getUsersForAdd();
      this.getRoles()
       
    }
  
   
    
  }
  getUsersForAdd() {
    // get users for add to alerts
    this.api.manageAlerts(this.requestBody).subscribe((result: any) => {
      this.userList = result.users
      if(this.userList.length==0){
        this.dialogRef.close({status: false})
        const msg=this.translate.instant('Users already exist')
      //   this.snackbar.open(msg, 'Close', {
      //    verticalPosition: 'top',
      //    horizontalPosition:'center',
      //    duration: 2000
      
      //  });
       this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: msg},
      });
      }

    }, (Error) => {
      console.log("Error:", Error);
      if (Error.status === 403) {
        this.dialogRef.close()
        // opens dialog for logout message
        this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } ,disableClose:true})
      }
      else if (Error.status === 401) {
        this.dialogRef.close
        this.router.navigateByUrl('')
        // this.dialogRef.open(LogoutSpinnerComponent,{data:{clickedType:'logOut'}})
      }
      else if (Error.status === 404) {
      //  not found case
      this.userList.length=0
        // this.dialogRef.open(LogoutSpinnerComponent,{data:{clickedType:'logOut'}})
      }
    })
  }
  roles:any=[];
  getRoles(){
      this.userMangerApi.getUserRolesgroups({}).subscribe((result:any)=>{
        this.roles=result.groups
        console.log('roles',this.roles);
        
      })
    
  }
  getRoleName(roleId: number): string {
    const role = this.roles.find((r:any) => r.roleId === roleId);
    return role ? role.roleName : 'Unknown Role';
  }
  arrayforAdd: any = [];
  addToarray(userId: any, event: MatCheckboxChange) {
    if (event.checked) {
      if (!this.arrayforAdd.includes(userId)) {
        this.arrayforAdd.push(userId);
      }
    } else {
      const index = this.arrayforAdd.indexOf(userId);
      if (index !== -1) {
        this.arrayforAdd.splice(index, 1);
      }
    }
  }

  selectAllChecked = false;
  // select all checkbox can select all users
  selectAll(event: MatCheckboxChange) {
    this.selectAllChecked = event.checked;
    const filteredList = this.searchPipe.transform(this.userList, this.searchKey, 'firstname');
    if (event.checked) {
      filteredList.forEach((user: any) => {
        this.addToarray(user.userId, event);
      });
    } else {
      this.arrayforAdd = [];
    }
  }
  saveClicked:boolean=false;
  // function to call api
  addUserToList() {
    this.saveClicked=true
    this.requestBody.userListforAdd=this.arrayforAdd
    this.requestBody.recorderType=this.data.recorder
    this.requestBody.action='addUsersToAlerts'
    
    this.api.manageAlerts(this.requestBody).subscribe((result:any)=>{
      if(result.status==true){
        this.saveClicked=false
        const msg=this.translate.instant('Menu.ALERTS MANAGEMENT.Common.User added to list successfully')

       this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: msg},
      });
      this.requestBody.userListforAdd=[]
      this.arrayforAdd.length=0
        this.requestBody.action='getUsers' //calling api for update user list
        this.getUsersForAdd();
      }
      
    },(Error) => {
      console.log("Error:", Error);
      if (Error.status === 403) {
        this.dialogRef.close
        // opens dialog for logout message
        this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true })
      }
      else if (Error.status === 401) {
        this.dialogRef.close
        this.router.navigateByUrl('')
      }
    })
    
    // add user to alerts
  }
  public message:string=''
  popupColor:string=''
  right:string=''
  left:string=''


closeDialog(){
  this.dialogRef.close(true)
}
}
