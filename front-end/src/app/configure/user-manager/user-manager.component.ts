import { ChangeDetectorRef, Component, OnInit, ViewChild, NgModule } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { UserMangerAlertComponent } from '../../shared/dialogComponents/user-manger-alert/user-manger-alert.component';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UserMangerService } from '../../core/services/userManger/user-manger.service';
import { AbstractControl, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedService } from '../../core/shared/share.service';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { AlertDialogComponent } from '../../shared/dialogComponents/alert-dialog/alert-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsergroupComponent } from '../../shared/dialogComponents/usergroup/usergroup.component';
import { forkJoin } from 'rxjs';
import { ConfirmationDialogComponent } from '../../shared/dialogComponents/confirmation-dialog/confirmation-dialog.component';
import { PopUpComponent } from '../../shared/dialogComponents/pop-up/pop-up.component';
import { AuthService } from '../../core/services/authentication/auth.service';

@Component({
  selector: 'app-user-manager',
  standalone: true,
  imports: [MatCheckboxModule, MatTooltipModule, MatPaginatorModule, ReactiveFormsModule, TranslateModule, MatIconModule, MatOption, MatSelect, MatToolbar, MatToolbarModule, MatSelectModule, MatMenuModule, FormsModule, MatButtonModule],
  templateUrl: './user-manager.component.html',
  styleUrl: './user-manager.component.css',
  providers: [UserMangerService]
})
export class UserManagerComponent implements OnInit {
  myForm: any = FormGroup;
  UpdateFormm: any = FormGroup

  toogle: boolean = false;
  updateUserGroup: boolean = false;
  allGroupsChecked = false;
  allGroupsCheckedUser = false;
  availableGroupName: string[] = []
  availableGroupNameUsers: string[] = []
  indexupdate: any;
  deletedItems: any = [];
  deletedItemsUser: any = [];
  selectedRoleId: number | null = null;
  selecRoleName: any;
  totalRecords: number = 0;    // Total number of records (from backend)
  currentPage: number = 1;     // Current page number
  recordsPerPage: number = 10; // Number of records per page
  offset: number = 0;          // Offset for pagination
  totalPages: number = 2;
  // pageNumber: number = 1;
  searchQuery: string = '';
  // filteredUsers: any[] = [];
  availableItems: any = []
  islpdapuserCheck: any = []
  allsectedGroups: any = []
  alltext: any = 'All'

  roleId: any;
  @ViewChild('checkboxElem') checkboxElem: any
  @ViewChild('status') status: any
  @ViewChild('checkboxuser') checkboxuser: any
  @ViewChild('statususer') statususer: any

  constructor(private dialog: MatDialog,
    private add: FormBuilder,
    private userMangerapi: UserMangerService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private router: Router,
    private matdialoge: MatDialog,
    private translate: TranslateService,
    private authService: AuthService
  ) { }
  ngOnInit(): void {
    this.userMangerapi.getUserRolesgroups({}).subscribe((result: any) => {
      if (result.status == true) {
        // this.grouname = result.groups
        // this.availableGroupName = result.groups
        this.allsectedGroups = result.groups;
        // this.availableItems=result.groups;


        this.fetchallData(this.allsectedGroups)
      }
    }, (error) => {
      console.log(error, 'error');
      // reomve token when unauthorized access
      if (error.status === 403) {
        // opens dialog for logout message
        this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' }, disableClose: true })
      }
      else if (error.status === 401) {
        this.router.navigateByUrl('')
        // this.dialogRef.open(LogoutSpinnerComponent,{data:{clickedType:'logOut'}})
      }
    })
    // //form for usergroup input
    this.myForm = this.add.group({
      roleName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    })
    //updating form for usergroup
    this.UpdateFormm = this.add.group({
      roleName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      roleId: ['', Validators.required]
    })

    this.offset = (this.currentPage - 1) * this.recordsPerPage;
    this.getUsers(this.availableItems, this.recordsPerPage, this.offset)
    //accseing the get users from another component
    // this.sharedService.getUsers$.subscribe(userId => {
    //   this.getUsers(userId, 'null', this.recordsPerPage, this.offset);
    // });

    this.calculateTotalPages();

  }


  fetchallData(alldata: any) {


    let roleidGroups: any = []
    alldata.forEach((element: any) => {

      roleidGroups.push(element.roleId)

    });

    this.availableItems = roleidGroups


    const body = { roleId: roleidGroups, limit: this.recordsPerPage, offset: this.offset }
    this.userMangerapi.getUserslistById(body).subscribe((result: any) => {
      if (result.status == true) {


        // this.filteredUsers = this.users;

        this.users = result.groups;
        // this.filteredUsers = result.groups;
        this.availableGroupNameUsers = result.groups
        this.totalRecords = result.count;
        this.calculateTotalPages();


      }

    },
      (error) => {
        console.log(error,);
        this.users = [];
        this.availableGroupNameUsers = []
        this.totalRecords = 0
        // console.log(result, 'userssss');

      }
    )
  }
  users: any = []
  grouname: any = []
  toolTips: any = {
    XLS: 'Menu.CONFIGURE.EMPLOYEE MANAGER.XLS',
    View: 'Menu.CONFIGURE.EMPLOYEE MANAGER.View',
    Addlocation: 'Menu.CONFIGURE.EMPLOYEE MANAGER.Addlocation',
    Editlocation: 'Menu.CONFIGURE.EMPLOYEE MANAGER.Editlocation',
    Savelocation: 'Menu.CONFIGURE.EMPLOYEE MANAGER.Savelocation',
    Add: 'Menu.CONFIGURE.USER MANAGER.Addnewuser',
    UploadFile: 'Menu.CONFIGURE.USER MANAGER.Import User',
    Delete: 'Menu.CONFIGURE.USER MANAGER.Delete Users',
    Edit: 'Menu.CONFIGURE.EMPLOYEE MANAGER.Edit',
    Previous: 'Menu.CONFIGURE.EMPLOYEE MANAGER.Previous',
    Next: 'Menu.CONFIGURE.EMPLOYEE MANAGER.Next',
    AddDepartment: 'Menu.CONFIGURE.EMPLOYEE MANAGER.AddDepartment',
    EditDepartment: 'Menu.CONFIGURE.EMPLOYEE MANAGER.EditDepartment',
    SaveDepartment: 'Menu.CONFIGURE.EMPLOYEE MANAGER.SaveDepartment',
    AddDivision: 'Menu.CONFIGURE.USER MANAGER.Addnewuser',
    EditDivision: 'Menu.CONFIGURE.USER MANAGER.SearchUsers',
    SaveDivision: 'Menu.CONFIGURE.EMPLOYEE MANAGER.SaveDivision',

  }
  //dialogue box for insert users deails
  openDialog(update: boolean, upload: any, roleId: any, roleName: any): void {
    this.roleId = roleId
    this.selecRoleName = roleName

    const dialogRef = this.dialog.open(UserMangerAlertComponent, {
      disableClose: true,
      data: { roleId: this.roleId, update, upload, roleName: this.selecRoleName },

    }

    
  );
  
    // console.log(dialogRef,'dialogRef');
    

    dialogRef.afterClosed().subscribe(result => {
      
        this.selecRoleName = result;
        let roleidGroups: any = []
       


        this.availableItems.forEach((element: any) => {

          roleidGroups.push(element.roleId)
        });


        const body = { roleId: this.availableItems, limit: this.recordsPerPage, offset: this.offset }


        this.userMangerapi.getUserslistById(body).subscribe((result: any) => {


          if (result) {


            this.users = result.groups;
          
            
            // this.filteredUsers = result.groups;
            this.availableGroupNameUsers = result.groups
            this.totalRecords = result.count;
            this.calculateTotalPages();
            // roleId = []

          }
          dialogRef.close()

        }, (error: any) => {
          console.log(error, 'Error');


        })
    

    });
    // }
  }
  //form validation
  get f(): { [key: string]: AbstractControl } {
    return this.myForm.controls;
  }
  //form validation for update user groups
  get update(): { [key: string]: AbstractControl } {

    return this.UpdateFormm.controls;
  }

  toogleFuntion(data: any) {
    this.toogle = data

    if (this.toogle == false) {
      this.myForm.reset()
    }
  }


  //insert user groups
  inserUserGroups() {
    let body = this.myForm.value


    this.userMangerapi.insertUser(body).subscribe(
      (result: any) => {
        if (result.status == true) {
          this.getUserGroups();
          this.toogle = false;
          this.myForm.reset();
        } else {
          // Show the error message immediately
          // this.snackBar.open(result.statusText, 'Close', {
          //   duration: 5000,
          //   verticalPosition: 'top'
          // });
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: result.statusText },
          });
        }
      },
      (error: any) => {


        // Handle other potential errors
        // this.snackBar.open(error.error.statusText, 'Close', {
        //   duration: 5000,
        //   verticalPosition: 'top'
        // });
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: error.error.statusText },
        });
      }
    );


  }
  //geting user group list
  getUserGroups() {
    this.userMangerapi.getUserRolesgroups({}).subscribe((result: any) => {
      if (result.status == true) {
        this.grouname = result.groups
        this.availableGroupName = result.groups
        // this.allsectedGroups=result.groups;
      }
    }, (error) => {
      console.log(error, 'error');
      // reomve token when unauthorized access
      if (error.status === 403) {
        // opens dialog for logout message
        this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } })
      }
      else if (error.status === 401) {
        this.router.navigateByUrl('')
        // this.dialogRef.open(LogoutSpinnerComponent,{data:{clickedType:'logOut'}})
      }
    })
  }
  //update  user group form validation
  updateUserGroups(name: any, id: any, index: any) {
    this.indexupdate = id
    this.updateUserGroup = true
    this.UpdateFormm.patchValue({
      roleName: name,
      roleId: id
    });
  }
  //update user group api
  UpdateUserRolesGroup() {

    let body = { roleId: this.UpdateFormm.value.roleId, roleName: this.UpdateFormm.value.roleName }
    this.userMangerapi.updateUserRolesGroup(body).subscribe((result: any) => {
      if (result.status == true) {
        this.getUserGroups()
        this.indexupdate = null
      }
    })


  }
  //form update funti
  updateFormClose() {
    this.indexupdate = null
  }
  // all check box selection for user group
  allcheckboxSelection(event: any) {




    this.allGroupsChecked = event.checked;
    console.log(event.checked, this.allGroupsChecked, 'event');
    if (event.checked === true) {

      this.deletedItems = [...this.availableGroupName];



    } else {
      this.deletedItems = [];

    }

  }
  //single selection check box
  checkboxdataAdding(data: any, status: any) {
    if (status.checked === true) {
      this.deletedItems.push(data);


    } else {
      const index = this.deletedItems.indexOf(data);
      if (index !== -1) {

        this.deletedItems.splice(index, 1);

      }


    }

    this.checkIfAllSelected();
  }
  checkIfAllSelected() {
    if (this.availableGroupName.length === this.deletedItems.length) {
      this.checkboxElem.checked = true;



    } else {
      this.checkboxElem.checked = false;

    }


  }

  //delete user groups api

  deleteuserGroup() {
    this.matdialoge.open(AlertDialogComponent, {
      data: {
        clickedStatus: "deleteConfirmation",
        message: "Are you sure you want to delete the selected user groups?"
      },
      disableClose: true,
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.deletedItems.forEach((data: any) => {
          let body = { roleId: data.roleId };
          this.userMangerapi.deleteUserGroups(body).subscribe(
            (result: any) => {
              if (result.status) {
                this.getUserGroups();
                this.allGroupsChecked = false;
                this.checkboxElem.checked = false;
                this.status.checked = false;
                this.offset = (this.currentPage - 1) * this.recordsPerPage;
                this.getUsers(this.availableItems, this.recordsPerPage, this.offset);
              }
            },
            (error) => {
              console.log(error);
              if (error.status === 400) {
                // this.snackBar.open(
                //   `${error.error.statusText}`, 'Close', {
                //   duration: 3000,
                //   verticalPosition: 'top'
                // }
                // );
                this.dialog.open(PopUpComponent, {
                  width: "500px",
                  height: "290px",
                  data: { message: error.error.statusText },
                });
              }
            }
          );
        });
      }
    });
  }

  //fecting user list 

  getUsers(list: any, limit: any, offset: any) {

    const body = { roleId: list, limit: this.recordsPerPage, offset: this.offset }


    this.userMangerapi.getUserslistById(body).subscribe((result: any) => {
      if (result.status == true) {
        this.users = result.groups;
        this.availableGroupNameUsers = result.groups
        this.totalRecords = result.count;
        this.calculateTotalPages();


      }

    },
      (error) => {
        console.log(error, 'ereereyroeryeiory');
        this.users = [];
        this.availableGroupNameUsers = []
        this.totalRecords = 0
        // console.log(result, 'userssss');

      }
    )
  }

  checkIfAllSelectedUsers() {
    if (this.availableGroupNameUsers.length === this.deletedItemsUser.length) {
      this.checkboxuser.checked = true;
    }


  }
  //delete user list 
  deleteUsers() {
    this.islpdapuserCheck = [];
    this.deletedItemsUser = [];
    const isAnyItemSelected = this.users != null && this.users.some((t: any) => t.checked);

    if (isAnyItemSelected) {
      this.users.forEach((element: any) => {
        // console.log("element",element);

        if (element.isLDAPUser == 1 && element.checked) {
          this.islpdapuserCheck.push(element);
        } else if (element.checked) {


          this.deletedItemsUser.push(element.userId);
        }
      });


      if (this.deletedItemsUser.length > 0) {
        this.matdialoge.open(ConfirmationDialogComponent, {
          data: {
            clickedStatus: "deleteConfirmation",
            message: "Are you sure you want to delete user(s)?",
          },
          disableClose: true,
        }).afterClosed().subscribe((result: { confirmed: boolean }) => {

          if (result) {
            const body = { userIdDetails: this.deletedItemsUser };

            this.userMangerapi.deleteUsers(body).subscribe(
              (deleteResult: any) => {

                if (deleteResult.status === true) {
                  this.offset = (this.currentPage - 1) * this.recordsPerPage;
                  this.getUsers(this.availableItems, this.recordsPerPage, this.offset);
                  this.allGroupsCheckedUser = false;

                  const lpdapCount = this.islpdapuserCheck.length;
                  let dbUserCount = this.deletedItemsUser.length;;


                  const loginId = this.authService.extractDataFromToken(localStorage.getItem('token')).userId;

                  const status = this.deletedItemsUser.includes(loginId)




                  if (status) {


                    --dbUserCount
                  }
                  let message =
                    lpdapCount > 0
                      ? `${dbUserCount} user(s) deleted successfully. ${lpdapCount} user(s) belong to LDAP and cannot be deleted.`
                      : `${dbUserCount} user(s) deleted successfully.`;

                  // Append the deleteResult.message if it is not null or empty
                  if (deleteResult.message) {
                    message += ` ${deleteResult.message}`;
                  }
                  this.dialog.open(PopUpComponent, {
                    width: "500px",
                    height: "290px",
                    data: { message: message },
                  });
                  this.deletedItemsUser = [];
                  //not fecting the data if any bug have to check this funtion
                  // this.fetchallData(this.allsectedGroups);
                }
              },
              (error) => {
                const lpdapCount = this.islpdapuserCheck.length;
                const dbUserCount = this.deletedItemsUser.length;

                // const loginId = this.authService.extractDataFromToken(localStorage.getItem('token')).userId;
                // const status = this.deletedItemsUser.include(loginId)
                // console.log("status", status);

                let message = ''
                //   lpdapCount > 0
                //     ? `${dbUserCount} user(s) deleted successfully. ${lpdapCount} user(s) belong to LDAP and cannot be deleted.`
                //     : `${lpdapCount} user(s) belong to LDAP and cannot be deleted.`;

                // Append the deleteResult.message if it is not null or empty
                if (error.error.message) {
                  message += `${error.error.message}${error.error.statusText}`;
                }
                console.error(error);
                this.dialog.open(PopUpComponent, {
                  width: "500px",
                  height: "290px",
                  data: { message: message },
                });
                this.deletedItemsUser = [];
              }
            );
          }
        });
      } else if (this.islpdapuserCheck.length > 0) {
        const lpdapCount = this.islpdapuserCheck.length;
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: `${lpdapCount} user(s) belong to LDAP and cannot be deleted.` },
        });

      }
    } else {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "260px",
        data: { message: `Select the user(s) to be deleted` },
      });
    }

    this.selectedUsers = [];
    this.allGroupsCheckedUser = false;
    this.isIndeterminate = false;

  }

  //fecting user list by user id
  getUserId(userId: any) {
    this.sharedService.triggerGetUserId(userId);
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.users.forEach((element: any) => {
        element.checked = false
      });
      this.allGroupsCheckedUser = false
      this.currentPage++;
      this.offset = (this.currentPage - 1) * this.recordsPerPage;
      this.getUsers(this.availableItems, this.recordsPerPage, this.offset);
    }

  }
  previousPage(): void {
    if (this.currentPage > 1) {
      this.users.forEach((element: any) => {
        element.checked = false
      });
      this.allGroupsCheckedUser = false
      this.currentPage--;
      this.offset = (this.currentPage - 1) * this.recordsPerPage;
      this.getUsers(this.availableItems, this.recordsPerPage, this.offset);
    }
  }

  // Function to handle items per page change
  onItemsPerPageChange(event: MatSelectChange): void {
    this.users.forEach((element: any) => {
      element.checked = false
    });
    this.allGroupsCheckedUser = false
    this.currentPage = 1; // Reset to the first page
    this.getUsers(this.availableItems, this.recordsPerPage, this.offset)
    this.calculateTotalPages();
  }
  getPagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  // Function to jump to a specific page
  goToPage(event: any): void {
    this.users.forEach((element: any) => {
      element.checked = false
    });
    this.allGroupsCheckedUser = false
    this.offset = (this.currentPage * this.recordsPerPage) - this.recordsPerPage
    this.currentPage = Number(event.value);
    // this.loadUsers();
    this.getUsers(this.availableItems, this.recordsPerPage, this.offset)
  }
  calculateTotalPages() {
    return this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
  }
  unLockUser(userId: any) {
    const message = this.translate.instant('Are you sure you want to unlock the selected user?')
    this.dialog.open(ConfirmationDialogComponent, { data: { clickedStatus: "unlockUser", message }, }).afterClosed().subscribe((result: any) => {
      if (result == true) {

        // this.dialog.open(AlertDialogComponent, { data: { clickedStatus: "unlockUser" }, }).afterClosed().subscribe((result: any) => {
        //   if (result == true) {
        // call api to unlock user
        this.userMangerapi.unLockUser({ userId }).subscribe((result: any) => {
          if (result.status === true) {
            this.getUsers(this.availableItems, this.recordsPerPage, this.offset);
          }

        }, (Error) => {
          console.error(Error)
        })
      }
    })
  }

  searchFuntion() {
    const query = this.searchQuery.trim();

    if (query) {

      const body = { query: query }
      this.userMangerapi.searchData(body).subscribe((result: any) => {
        if (result.status == true) {

          // this.filteredUsers = this.users;

          this.users = result.groups;
          // this.filteredUsers = result.groups;
          this.availableGroupNameUsers = result.groups
          this.totalRecords = result.groups.length;
          this.calculateTotalPages();
        }
      },
        (error) => {
          this.users = [];
          this.availableGroupNameUsers = []
          this.totalRecords = 0
        }
      )

    } else {
      this.getUsers(this.availableItems, this.recordsPerPage, this.offset);
    }
  }
  userGroupDialougue() {
    if (this.availableItems.length <= 0) {
      let array: any = [];
      this.allsectedGroups.forEach((role: any) => {
        array.push(role.roleId)
      })
      this.availableItems = array
    }
    const dialogRef = this.matdialoge.open(UsergroupComponent, {
      disableClose: true,
      data: { available: this.availableItems },
      width: '30vw',
      height: '84vh'
    });

    // Use afterClosed to execute code after dialog closes
    dialogRef.afterClosed().subscribe(result => {
      let roleId: any = []

      if (result != null) {
        this.availableItems = Array.from(result.selectedRoleids)

        roleId = Array.from(result.selectedRoleids)

        if (result.selectAll == true) {
          this.alltext = 'All'

        } else if (roleId.length > 1) {
          this.alltext = 'Multiple'
        } else {

          const selectedRole = this.allsectedGroups.find((group: any) => group.roleId === roleId[0]);
          this.alltext = selectedRole.roleName
        }
        const body = { roleId: roleId, limit: this.recordsPerPage, offset: this.offset }
        this.userMangerapi.getUserslistById(body).subscribe((result: any) => {
          if (result) {
            this.users = result.groups;
            // this.filteredUsers = result.groups;
            this.availableGroupNameUsers = result.groups
            this.totalRecords = result.count;
            this.calculateTotalPages();

          } else {
            this.users = [];
            // this.filteredUsers = result.groups;
            this.availableGroupNameUsers = []
            this.totalRecords = 0;
            this.calculateTotalPages();
          }

        }, (error: any) => {
          console.log(error);
          this.users = [];
          // this.filteredUsers = result.groups;
          this.availableGroupNameUsers = []
          this.totalRecords = 0;
          this.calculateTotalPages();

        })
      } else {
        console.log('Dialog was closed without any result');
      }
    });
  }

  selectedUsers: any[] = []; // Tracks selected users
  isIndeterminate = false;

  // Handle the master checkbox
  allcheckboxSelectionUsers(event: any) {
    this.allGroupsCheckedUser = event.checked;
    this.isIndeterminate = false;

    this.users.forEach((element: any) => {
      element.checked = true

    });

    if (this.allGroupsCheckedUser) {
      // Select all users
      this.users.forEach((element: any) => {
        element.checked = true

      });
    } else {
      // Deselect all users
      this.users.forEach((element: any) => {
        element.checked = false

      });
    }
  }


  // Handle individual checkboxes
  checkboxdataAddingUsers(user: any, event: any) {
    this.allGroupsCheckedUser = this.users != null && this.users.every((t: any) => t.checked);


  }


}
