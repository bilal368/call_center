import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogueBoxComponent } from '../../shared/activeDirectory/dialogue-box.component';
import { AuthenticationService } from '../../core/services/activeDirectory/authentication.service';
import { FormControl, } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { AlertDialogComponent } from '../../shared/dialogComponents/alert-dialog/alert-dialog.component';
import { UserService } from '../../core/services/user/user.service';
import { MatTabsModule } from '@angular/material/tabs';
import { JWT_OPTIONS, JwtHelperService, JwtModule } from '@auth0/angular-jwt';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/authentication/auth.service';
import { PopUpComponent } from '../../shared/dialogComponents/pop-up/pop-up.component';

// import {MatFormFieldModule} from '@angular/material/form-field';
interface Role {
  roleId: number;
  roleName: string;
  status: number | null;
}
@Component({
  selector: 'app-activedirectory',
  standalone: true,
  imports: [CommonModule, MatIconModule, JwtModule, MatButtonModule, MatToolbarModule, MatSidenavModule, FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatExpansionModule, MatTabsModule, MatDialogModule, MatCheckboxModule, MatSelectModule, MatMenuModule, MatTooltipModule,
    TranslateModule],
  providers: [AuthenticationService, JwtHelperService,
    { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
  ],
  templateUrl: './activedirectory.component.html',

  styleUrl: './activedirectory.component.css'
})
export class ActivedirectoryComponent implements OnInit {
  panelOpenState = false;
  dropdownvalidation: any = FormGroup;
  checkbox: any = false;
  buildDiv: any = 'authentication';
  ldapPassword: string = '';
  isActive: boolean = false;
  hide = true;
  dropdown: boolean = false
  dropdown1: boolean = false
  open: boolean = false
  count: any = 0;

  private hirechyService = inject(AuthenticationService);
  // dropdownvalidation: any = FormGroup;
  selectedOption: string | null = null;
  options1: any = [];
  locations: any = 'NOT SELECTED'
  locationIcon: any = 'block'
  locations1: any = 'NOT SELECTED'
  locationIcon1: any = 'block'
  toolTips: any = {
    Saveemployeedata:'Menu.CONFIGURE.ACTIVE DIRECTORY.EMPLOYEE DATA MAPPING.SaveEmployeData',
    saveUsergroups:'Menu.CONFIGURE.ACTIVE DIRECTORY.USER GROUP/ROLES.Saveusergroups'

  }
  // options2: any = [];
  authenticationForm = this.authForm.group({
    serverIp: ['', Validators.required],
    ldapUsername: ['', Validators.required],
    systemName: ['', Validators.required],
    domainName: ['', Validators.required],
    password: ['', Validators.required]

  })

  activeTab: string = 'authentication';

  options = this._formBuilder.group({
    bottom: 0,
    fixed: false,
    top: 0,
  });
  isChecked: any;


  FirstName: string = 'Select LDAP User Property';
  Middlename: string = 'Select LDAP User Property';
  LastName: string = 'Select LDAP User Property';
  PhoneNumber: string = 'Select LDAP User Property';
  Extension: string = 'Select LDAP User Property';
  EmailAddress: string = 'Select LDAP User Property';
  Designation: string = 'Select LDAP User Property';
  ReportingManager: string = 'Select LDAP User Property';
  EmployeeID: string = 'Select LDAP User Property';
  selectedOption10: string = 'Select LDAP User Property';
  selectedOption11: string = 'Select LDAP User Property';
  selectedOption12: string = 'Select LDAP User Property';
  hierarchy: string[] = [];
  hierarchall: any = [];
  hierarchall2: any = [];
  hierarchall3: any = [];
  hierarchall4: any = [];
  hierarchall5: any = [];
  hierarchall6: any = [];
  trialData: any
  trialData2: any

  expandedPanel: number | null = null;
  dataArray: any = [];
  // available groups
  availableGroup: Role[] = []

  selectedGroups: any = []
  items: any = []
  items2: any = []
  mainSelectedGroup: Role[] = []

  dropdownLocation: any = [{
    id: 1,
    context: "LOCATION",
    selection: "location_city",
    disabled: false

  }, {
    id: 2,
    context: "DEPARTMENT",
    selection: "widgets",
    disabled: true

  }, {
    id: 3,
    context: "DIVISION",
    selection: "widgets",
    disabled: true

  }];
  trialHierarchy: any = []


  selectedArray: any = []
  tempArray: any = []
  temArray2: any = []
  expandedPanels: any[] = Array(this.hierarchy.length).fill(false);

  allGroupsChecked = false;

  allSelectGroup = false;
  selectedString: string = 'OU=' //for send hierarchy to backend
  selectedHierarchyBody: object = {}
  constructor(private _formBuilder: FormBuilder,
    private router: Router,
    private authForm: FormBuilder,
    private jwtHelper: JwtHelperService,
    private matdialoge: MatDialog,
    private fb: FormBuilder,
    private dropdownFrom: FormBuilder,
    private drop: FormBuilder,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    public dialog:MatDialog
  ) {
    this.dropdownvalidation = this.dropdownFrom.group({
      FirstName: ['', Validators.required],
      MiddleName: [''],
      LastName: ['', Validators.required],
      PhoneNumber: ['', Validators.required],
      Extension: ['', Validators.required],
      Email: ['', Validators.required],
      Designation: [''],
      ReportingManager: [''],
      EmployeeID: ['', Validators.required]
    });
    this.checkbox = this.fb.group({
      isAdmin: ['', Validators.required]
    });
    this.checkbox.get('isAdmin').valueChanges.subscribe((value: any) => {
      this.isChecked = value;
    });
    // this.dropdownvalidation = this.drop.group({
    //   selectedOption: ['', Validators.required] // Add required validation to dropdown
    // });

  }




  togglePanel(index: number): void {
    this.expandedPanels[index] = !this.expandedPanels[index];

    if (this.expandedPanel === index) {

      this.expandedPanel = null;
      // Collapse the panel if it's already expanded
    } else {
      this.expandedPanel = index; // Expand the panel
      // this.open=false
    }
  }
  ngOnInit(): void {


    // check logged user's token valid or not :by using jwt helper service
    this.extractId()
    const loginStatus = this.jwtExpiredOrNot()
    if (loginStatus) {
      console.log("JWT false");
      this.matdialoge.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } ,disableClose:true})
      localStorage.removeItem('token')
      this.router.navigateByUrl('') // you need to login
    }
    else {
      console.log("JWT true");
      // dont need to login
      // this.router.navigateByUrl('/dG')
    }
  }
  packageId: any = [];
  // extract id from token
  extractId() {
    const extractData=this.authService.extractDataFromToken(localStorage.getItem('token')) //extract name from token     
    this.packageId = extractData.combinedPackageID
  }
  // function to set UI
  privileagedUI(input: any) {
    const status = input.some((item: number) => {
      return this.packageId.includes(item)
    })
    return status
  }
  // function for jwt expired or not
  jwtExpiredOrNot(): any {
    try {
      if (this.jwtHelper) {
        return this.jwtHelper.isTokenExpired(localStorage.getItem('token'))
        // status=true when jwt timed out  status=false when jwt time valid
      }
      else {
        console.log("not found");
      }
    }
    catch (error) {
      console.log("ERROR:", error);
      return true

    }
  }

  divFunction(name: string) {

    this.buildDiv = name
    if (this.activeTab === 'hierarchy') {
      this.getHierarchyData();
    }

  }
  showSubMenu1 = false;

  togglePasswordVisibility() {
    this.hide = !this.hide;
  }
  //getting hierarchydetails
  getHierarchyData() {
    console.log("Calling Hierarchy ");

    this.hirechyService.hirechydata({}).subscribe((result: any) => {
      this.trialHierarchy = result.hierarchy;
      console.log(result);

    }, (Error) => {
      console.log(Error);

    })
  }

  get f(): { [key: string]: AbstractControl } {
    return this.authenticationForm.controls;
  }
  openDialog() {
    this.matdialoge.open(DialogueBoxComponent, {
      disableClose: true,
      data: { type: false, authFormBody: this.authenticationForm },
      width: '350px',
      height: '200px',

    }).afterClosed().subscribe((resultStatus: any) => {
      resultStatus === true ? (this.isActive = true) && (this.buildDiv = 'hierarchy') && this.getHierarchyData() : this.isActive = false

    })
  }
  dropdownFunction() {
    this.dropdown = !this.dropdown
  }
  dropdownFuntion1() {

    this.dropdown1 = !this.dropdown1;
    console.log("dropdownFuntion1", this.dropdown1);


  }
  disableSelect = new FormControl(false);
  employemappingdialouge(message: string, height: string) {
    this.matdialoge.open(AlertDialogComponent, {
      disableClose: true,
      width: '350px',
      // height: '140px',
      data: {
        message: message,
        clickedStatus: 'activeD',
        height: height
      }

    })
  }
  onSubmit() {

    // if (this.checkbox.value.isAdmin === true) {

    //   this.employemappingdialouge('Selecting user groups/roles is successfully completed.')
    // } else {
    //   this.employemappingdialouge('Please select atleast one user group to save.')
    // }
  }


  //funtion for fecting user properties
  getEmployeeDataMapping() {

    this.hirechyService.employeeDataMapping({}).subscribe((result) => {
      this.options1 = result;


    },
      error => {
        console.error('Error saving data:', error);
      }
    )

  }
  //seleccting the dropdown list
  selectOption(option: string, field: number) {


    switch (field) {
      case 1:
        this.FirstName = option;
        this.dropdownvalidation.get('FirstName').setValue(option);
        break;
      case 2:
        this.Middlename = option;
        this.dropdownvalidation.get('MiddleName').setValue(option);
        break;
      case 3:
        this.LastName = option;
        this.dropdownvalidation.get('LastName').setValue(option);
        break;
      case 4:
        this.PhoneNumber = option;
        this.dropdownvalidation.get('PhoneNumber').setValue(option);
        break;
      case 5:
        this.Extension = option;
        this.dropdownvalidation.get('Extension').setValue(option);
        break;
      case 6:
        this.EmailAddress = option;
        this.dropdownvalidation.get('Email').setValue(option);
        break;
      case 7:
        this.Designation = option;
        this.dropdownvalidation.get('Designation').setValue(option);
        break;
      case 8:
        this.ReportingManager = option;
        this.dropdownvalidation.get('ReportingManager').setValue(option);
        break;
      case 9:
        this.EmployeeID = option;
        this.dropdownvalidation.get('EmployeeID').setValue(option);
        break;
    }
  }


  //saving employees details after mapping
  saveEmployeeDateMapping() {
    console.log(this.dropdownvalidation.valid.value, 'valuess');




    if (this.dropdownvalidation.valid) {
      console.log('Form submitted successfully');
      const dataList =
      {
        'firstName': this.FirstName,
        'MiddleName': this.Middlename,
        'lastname': this.LastName,
        'primaryMobileNo': this.PhoneNumber,
        'extension': this.Extension,
        'primaryEmail': this.EmailAddress,
        'designation': this.Designation,
        'employeeID': this.EmployeeID
      }



      this.hirechyService.savingempolyeData(dataList).subscribe((response: any) => {

        if (response.status == true) {
          this.buildDiv = 'usergroupsroles';
          this.getUserRole()
          this.employemappingdialouge('Employee Data Mapping successfully completed.', '200px')
        }


      },
        error => {
          console.error('Error saving data:', error);
        }
      )
    } else {
      console.log('Form is invalid');
    }


    // if (this.dropdownvalidation.valid) {
    //   console.log('Form Submitted!', this.dropdownvalidation.value);
    // } else {
    //   console.log('Form is invalid');
    // }

  }

  //getingfirstlasyerofdata in hirechy
  sendHirechyData(data: any) {

    this.selectedString = this.selectedString.concat('', data)
    console.log('data', this.selectedString);
    this.hierarchall = []
    this.hierarchall2 = []
    this.hierarchall3 = []
    this.hierarchall4 = []
    this.hierarchall5 = []
    const body = { "ou": data }
    this.hirechyService.getHirechyDataAll(body).subscribe((result: any) => {
      console.log(result);

      // this.options1 = result;
      this.hierarchall = result.hierarchy

      for (const iterator of this.hierarchall) {


      }


    },
      error => {
        console.error('Error saving data:', error);
      }
    )
  }
  //getingsecondlayerofdata in hirechy
  sendHirechyData2(data: any) {
    this.selectedString = this.selectedString.concat(',', data);
    console.log('data', this.selectedString);
    this.hierarchall2 = []
    this.hierarchall3 = []
    this.hierarchall4 = []
    this.hierarchall5 = []

    const body = { "ou": data }


    this.hirechyService.getHirechyDataAll(body).subscribe((result: any) => {

      // this.options1 = result;
      this.hierarchall2 = result.hierarchy


    },
      error => {
        console.error('Error saving data:', error);
      }
    )
  }
  //getingsecondlayerofdata in hirechy
  sendHirechyData3(data: any) {
    this.selectedString = this.selectedString.concat(',', data);
    console.log('data', this.selectedString);
    this.hierarchall3 = []
    this.hierarchall4 = []
    this.hierarchall5 = []

    const body = { "ou": data }

    this.hirechyService.getHirechyDataAll(body).subscribe((result: any) => {

      // this.options1 = result;
      this.hierarchall3 = result.hierarchy


    },
      error => {
        console.error('Error saving data:', error);
      }
    )

  }
  //getingthirdlayerofdata in hirechy
  sendHirechyData4(data: any) {
    this.selectedString = this.selectedString.concat(',', data);
    console.log('data', this.selectedString);
    this.hierarchall4 = []
    this.hierarchall5 = []


    const body = { "ou": data }
    this.hirechyService.getHirechyDataAll(body).subscribe((result: any) => {

      // this.options1 = result;
      this.hierarchall4 = result.hierarchy
      this.trialData = data

    },
      error => {
        console.error('Error saving data:', error);
      }
    )

  }
  //getingfourthlayerofdata in hirechy
  sendHirechyData5(data: any) {
    this.hierarchall5 = []
    this.hierarchall6 = []

    this.selectedString = this.selectedString.concat(',', data);
    console.log('data', this.selectedString);

    const body = { "ou": data }

    this.hirechyService.getHirechyDataAll(body).subscribe((result: any) => {

      // this.options1 = result;
      this.hierarchall5 = result.hierarchy
      this.trialData2 = data

    },
      error => {
        console.error('Error saving data:', error);
      }
    )

  }
  //getingfifthlayerofdata in hirechy
  sendHirechyData6(data: any) {
    this.selectedString = this.selectedString.concat(',', data);
    console.log('data', this.selectedString);
    this.hierarchall6 = []
    const body = { "ou": data }

    this.hirechyService.getHirechyDataAll(body).subscribe((result: any) => {

      // this.options1 = result;
      this.hierarchall6 = result.hierarchy


    },
      error => {
        console.error('Error saving data:', error);
      }
    )

  }
  //getting the user roles
  getUserRole() {
    console.log("Calls User roles");
    this.hirechyService.getUserRole({}).subscribe((result: any) => {
      console.log(result.groups.map((role: any) => role));
      if (result.groups) {
        this.availableGroup = result.groups
          .filter((role: any) => role.status === 0 || role.status === null)
        this.mainSelectedGroup = result.groups
          .filter((role: any) => role.status === 1)
      }
    },
      error => {
        console.error('Error saving data:', error);
      }
    )
  }
  //saving the user roles
  saveUserRoles() {
    const noselected = this.availableGroup.map(role => role.roleId)
    const selected = this.mainSelectedGroup.map(role => role.roleId)
    const body = { "selected": selected, "nonselected": noselected }

    if (body.selected.length == 0) {
      this.employemappingdialouge('Please Select any  groups/roles', '200px')
    } else {
      this.hirechyService.saveUserRole(body).subscribe((result: any) => {
        if (result.status == true) {
          this.employemappingdialouge('Selecting user groups/roles is successfully completed.', '127%')

        }
      },
        error => {
          console.error('Error saving data:', error);
        }
      )
    }
  }
  // save hierarchy
  saveHierarchy() {
    this.selectedHierarchyBody = { ...this.selectedHierarchyBody, "hierarchy": this.selectedString }

    const hierarchyArray = []
    hierarchyArray.push(this.selectedHierarchyBody)
    console.log("FINAL BODY:  ", hierarchyArray);
    this.hirechyService.saveHierarchy(hierarchyArray).subscribe((res: any) => {
      if (res.status === true) {
        this.buildDiv = 'employeeDetails';
        // this.snackBar.open('Hierarchy mapping saved successfully', 'Close', {
        //   duration: 3000,
        //   verticalPosition: 'top'
        // });
        this.dialog.open(PopUpComponent, {
          width: "500px",
          height: "290px",
          data: { message: 'Hierarchy mapping saved successfully'},
        });
      }


    }, (Error) => {
      console.log(Error);

    })
  }

  // check box on available groups
  toggleAllGroups(event: any) {
    this.allGroupsChecked = event.checked;
    if (event.checked === true) {
      this.availableGroup.forEach((data) => {
        this.items.push(data)
      })
    } else {
      this.items.splice(0, this.items.length)
    }
  }
  // check box on selected groups
  toggleSelectedGroups(event: any) {

    this.allSelectGroup = event.checked;
    if (event.checked === true) {
      this.mainSelectedGroup.forEach((data: any) => {
        this.items2.push(data)
      })
    } else {
      this.items2.splice(0, this.items2.length)

    }
  }
  //for checking checkbox available groups
  arraypushmethod(data: any, status: any) {
    console.log(data,);

    if (status._checked === true) {
      this.items.push(data);
    } else {
      const index = this.items.indexOf(data);
      if (index !== -1) {
        this.items.splice(index, 1);
        console.log(`"${data}" removed successfully.`);
      } else {
        console.log(`"${data}" not found in the array.`);
      }
    }
  }
  //for checking checkbox selected groups
  checkBoxActionSelected(value: any, status: any) {

    if (status._checked === true) {
      this.items2.push(value);

    } else {
      const index = this.items2.indexOf(value);
      if (index !== -1) {
        this.items2.splice(index, 1);
        console.log(`"${value}" removed successfully.`);
      } else {
        console.log(`"${value}" not found in the array.`);
      }

    }
  }
  @ViewChild('checkboxSelect') checkboxSelect: any
  @ViewChild('checkboxElem') checkboxElem: any
  @ViewChild('status') status: any

  //selectbuttongroupbuttonfuntion
  selectUserGroup() {

    // this.selectedGroups = new Set([...this.items, ...this.selectedGroups])
    // this.selectedGroups = Array.from(this.selectedGroups);
    this.items.forEach((data: any) => {
      if (!this.mainSelectedGroup.includes(data)) {
        this.mainSelectedGroup.push(data)
        this.availableGroup = this.availableGroup.filter(item => item !== data);

      }
    })
    if (this.items.length === 0) {
      this.employemappingdialouge('Please select atleast one user group to save.', '127%')
    }
    this.items.splice(0, this.items.length)
    this.allGroupsChecked = false
    this.checkboxElem.checked = false;
    this.status.checked = false;
    // this.availableGroup=[]
  }

  //removegroupdownbutton
  removeUserGroup() {
    this.items2.forEach((value: any) => {
      this.mainSelectedGroup = this.mainSelectedGroup.filter((item: any) => item !== value);
    })
    if (this.items2.length === 0) {
      this.employemappingdialouge('Please select atleast one user group to save.', '127%')
    }
    // const allPresent = this.items2.every((value: any) => this.availableGroup.includes(value));

    this.items2.forEach((data: any) => {
      if (!this.availableGroup.includes(data)) {
        this.availableGroup.push(data)
      }
    });

    this.items2.splice(0, this.items2.length)
    this.checkboxSelect.checked = false;
    this.allSelectGroup = false

  }

  //for the select the dropdown hirechey mapping
  locationSelectionData(data: any, item: any) {
    console.log(item.name);
    item.context = data.context
    item.selection = data.selection
    // console.log(data.context,'>>', data.selection, 'selection');
    if (data.context === 'LOCATION') {
      this.selectedHierarchyBody = { ...this.selectedHierarchyBody, 'LOCATION': `OU=${item.name}` }
      this.dropdownLocation[1].disabled = false
      this.dropdownLocation[0].disabled = true
    }
    if (data.context === 'DEPARTMENT') {
      this.selectedHierarchyBody = { ...this.selectedHierarchyBody, 'DEPARTMENT': item.name }
      this.dropdownLocation[2].disabled = false
      this.dropdownLocation[0].disabled = true
      this.dropdownLocation[1].disabled = true
    }
    if (data.context === 'DIVISION') {
      this.selectedHierarchyBody = { ...this.selectedHierarchyBody, 'DIVISION': item.name }
      this.dropdownLocation[2].disabled = true
      this.dropdownLocation[1].disabled = true
      this.dropdownLocation[0].disabled = true
    }
    console.log('BODY', this.selectedHierarchyBody);


  }
}
