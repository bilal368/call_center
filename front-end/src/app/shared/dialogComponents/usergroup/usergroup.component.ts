import { Component, ElementRef, Inject, OnInit, ViewChild, AfterViewChecked } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatIcon } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UserMangerService } from '../../../core/services/userManger/user-manger.service';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PopUpComponent } from '../pop-up/pop-up.component';
@Component({
  selector: 'app-usergroup',
  standalone: true,
  imports: [MatCheckboxModule, MatSelectModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule,
    FormsModule, HttpClientModule, TranslateModule, MatTooltipModule, MatButtonModule, MatIconModule],
  templateUrl: './usergroup.component.html',
  styleUrl: './usergroup.component.css',
  providers: [UserMangerService]
})
export class UsergroupComponent implements OnInit {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  selectedRoleIds: any = []; // Use a Set to track selected role IDs
  // selectedRoleIdNames: any=[];
  ngOnInit(): void {
    // this.deletedItems = this.data.available
    if (this.deletedItems.length != 0) {
      this.allGroupsChecked = false
    }
    this.myForm = this.add.group({
      roleName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    })
    this.UpdateFormm = this.add.group({
      roleName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      roleId: ['', Validators.required]
    })
    this.getUserGroups()
  }
  constructor(
    public dialog: MatDialog,
    private userMangerapi: UserMangerService,
    private add: FormBuilder,
    private matdialoge: MatDialogRef<UsergroupComponent>,
    private snackBar: MatSnackBar,
    private matdialoges: MatDialog,
    @Inject(MAT_DIALOG_DATA)
    public data: { available: any },
  ) {
    // this.availableGroupName = this.data.available

  }

  allGroupsChecked = true;
  allGroupsCheckedUser = false;
  indexupdate: any;
  availableGroupName: string[] = []
  grouname: any = []
  deletedItems: any = [];
  UpdateFormm: any = FormGroup
  // availableGroupNameUsers: string[] = []
  toogle: boolean = false;
  selectedRoleId: number | null = null;
  myForm: any = FormGroup;
  searchTerm: string = '';
  filterData: any = []
  updateUserGroup: boolean = false;
  selectAll = false;
  roles: any = []
  toolTips: any = {
    XLS: 'Menu.CONFIGURE.EMPLOYEE MANAGER.XLS',
    View: 'Menu.CONFIGURE.EMPLOYEE MANAGER.View',
    Addlocation: 'Menu.CONFIGURE.EMPLOYEE MANAGER.Addlocation',
    Editlocation: 'Menu.CONFIGURE.EMPLOYEE MANAGER.Editlocation',
    Savelocation: 'Menu.CONFIGURE.EMPLOYEE MANAGER.Savelocation',
    Add: 'Menu.CONFIGURE.USER MANAGER.Addusergroup',
    UploadFile: 'Menu.CONFIGURE.EMPLOYEE MANAGER.UploadFile',
    Delete: 'Menu.CONFIGURE.USER MANAGER.Deleteusergroup',
    Edit: 'Menu.CONFIGURE.EMPLOYEE MANAGER.Edit',
    Previous: 'Menu.CONFIGURE.EMPLOYEE MANAGER.Previous',
    Next: 'Menu.CONFIGURE.EMPLOYEE MANAGER.Next',
    AddDepartment: 'Menu.CONFIGURE.EMPLOYEE MANAGER.AddDepartment',
    EditDepartment: 'Menu.CONFIGURE.EMPLOYEE MANAGER.EditDepartment',
    SaveDepartment: 'Menu.CONFIGURE.EMPLOYEE MANAGER.SaveDepartment',
    AddDivision: 'Menu.CONFIGURE.EMPLOYEE MANAGER.AddDivision',
    EditDivision: 'Menu.CONFIGURE.EMPLOYEE MANAGER.EditDivision',
    SaveDivision: 'Menu.CONFIGURE.EMPLOYEE MANAGER.SaveDivision',
    Close: 'Menu.CONFIGURE.USER MANAGER.CLOSE',
    saveuserGroup: 'Menu.CONFIGURE.USER MANAGER.SaveUserGroup',
    Apply: 'Menu.CONFIGURE.USER MANAGER.Applychanges'
  }
  @ViewChild('checkboxElem') checkboxElem: any;
  @ViewChild('status') status: any

  checkedfun(id: any): boolean {
    // Check if the roleId exists in the selectgroup array
    return this.deletedItems.some((value: any) => value.roleId === id);
  }
  toogleFuntion(data: any) {
    this.toogle = data

    if (this.toogle == false) {
      this.myForm.reset()
    }
  }
  fetchUserGroups() {
    // this.grouname=this.data.available,
    this.selectedRoleIds = this.data.available
    this.selectAll = this.roles.every((role: any) => this.selectedRoleIds.includes(role));

  }


  getUserGroups() {
    this.userMangerapi.getUserRolesgroups({}).subscribe((result: any) => {


      if (result.status == true) {
        this.grouname = result.groups
        this.filterData = result.groups;
        this.availableGroupName = result.groups
        // this.roles = result.groups
        this.availableGroupName.forEach((role: any) => {
          this.roles.push(role.roleId); // Add all roles to the selected set
        });
        this.fetchUserGroups()
      }
    }, (error: any) => {
      console.log(error, 'error');

    })
  }
  toggleSelectAll(checked: boolean) {
    this.selectAll = checked;
    if (checked) {
      this.selectedRoleIds = this.roles.map((role: any) => role); // Add all role IDs
    } else {
      this.selectedRoleIds = []; // Clear the array
    }
  }

  isRoleSelected(roleId: number): boolean {
    return this.selectedRoleIds.some((role: any) =>

      role === roleId);
  }


  toggleRoleSelection(roleId: number, isChecked: boolean,) {
    if (isChecked) {
      this.selectedRoleIds.push(roleId);

    } else {
      const index = this.selectedRoleIds.indexOf(roleId);
      if (index > -1) {
        this.selectedRoleIds.splice(index, 1);

      }
    }
    // Update "Select All" checkbox state
    this.selectAll = this.roles.every((role: any) => this.selectedRoleIds.includes(role));
    // console.log(this.selectedRoleIdNames, 'selectedRoleIds');
  }


  checkboxdataAdding(data: any, status: any) {
    console.log(data, 'Checkbox Data');

    if (status.checked) {
      console.log(status.checked, 'checked');

      // Check if data is already added to avoid duplicates
      if (!this.deletedItems.some((item: any) => item === data)) {
        this.deletedItems.push(data);
      }
    } else {
      console.log(status, 'uncheacked');

      // Find the index based on object properties if `data` is an object
      const index = this.deletedItems.findIndex((item: any) => item === data);
      if (index !== -1) {
        this.deletedItems.splice(index, 1);
      }
    }
    console.log(this.deletedItems, 'deleted');

    // this.checkIfAllSelected();
  }

  checkIfAllSelected() {
    if (this.availableGroupName.length === this.deletedItems.length) {
      this.checkboxElem.checked = true;



    } else {
      this.checkboxElem.checked = false;

    }


  }
  closeDialouge() {
    this.matdialoge.close()
  }
  applyFuntion() {

    if (this.selectedRoleIds.length == 0) {

      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: 'Please select atleast one group' },
      });
    } else {


      this.matdialoge.close({ 'selectedRoleids': this.selectedRoleIds, 'selectAll': this.selectAll })
    }

  }

  filterGroups() {
    if (this.searchTerm) {
      this.grouname = this.grouname.filter((group: any) =>
        group.roleName.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.grouname = this.filterData
    }
  }
  get f(): { [key: string]: AbstractControl } {
    return this.myForm.controls;
  }
  inserUserGroups() {
    let body = this.myForm.value


    this.userMangerapi.insertUser(body).subscribe(
      (result: any) => {
        if (result.status == true) {
          this.getUserGroups();
          this.toogle = false;
          this.myForm.reset();
          this.scrollToBottom()

        } else {

          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: result.statusText },
          });
        }
      },
      (error: any) => {

        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: error.error.statusText },
        });
      }
    );
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight
      }
      catch (err) { console.log(err) }
    }, 500)
  }

  deleteuserGroup() {
    this.matdialoges.open(AlertDialogComponent, {
      data: {
        clickedStatus: "deleteConfirmation",
        message: "Are you sure you want to delete the selected user groups?"
      },
      disableClose: true,
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {

          let body = { roleId: this.selectedRoleIds };
          

          this.userMangerapi.deleteUserGroups(body).subscribe(
            (result: any) => {              
              if (result.status) {
                this.getUserGroups()
              }
            },
            (error) => {
              console.log(error);
              if (error.status === 400) {

                this.dialog.open(PopUpComponent, {
                  width: "500px",
                  height: "290px",
                  data: { message: error.error.statusText },
                });
              }
            }
          );
        // });
      }
    });
  }
  get update(): { [key: string]: AbstractControl } {

    return this.UpdateFormm.controls;
  }
  updateFormClose() {
    this.indexupdate = null
  }
  UpdateUserRolesGroup() {

    let body = { roleId: this.UpdateFormm.value.roleId, roleName: this.UpdateFormm.value.roleName }
    this.userMangerapi.updateUserRolesGroup(body).subscribe((result: any) => {


      if (result.status == true) {
        this.getUserGroups()
        this.indexupdate = null
      }
    })


  }
  updateUserGroups(name: any, id: any, index: any) {
    this.indexupdate = id
    this.updateUserGroup = true
    this.UpdateFormm.patchValue({
      roleName: name,
      roleId: id
    });
  }

}
