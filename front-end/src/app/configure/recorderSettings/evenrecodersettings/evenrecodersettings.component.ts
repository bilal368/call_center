import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { RecorderserviceService } from '../../../core/services/recorderSettings/recorderservice.service';
import { PopUpComponent } from '../../../shared/dialogComponents/pop-up/pop-up.component';
import { MatDialog } from '@angular/material/dialog';
import { SharedService } from '../../../core/shared/share.service';
import { ChannelmappingAlertComponent } from '../../../shared/dialogComponents/channelmapping-alert/channelmapping-alert.component';
import { ConfirmationDialogComponent } from '../../../shared/dialogComponents/confirmation-dialog/confirmation-dialog.component';
import { LogarithmicScale } from 'chart.js';

export interface tableData {
  didLabelingId: number;
  didNumber: string;
  didLabel: string;
}
let ELEMENT_DATA: tableData[] = [
];

@Component({
  selector: 'app-evenrecodersettings',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, FormsModule, MatMenuModule, MatCheckboxModule, MatFormFieldModule, MatTooltipModule, MatSelectModule, MatIconModule, MatButtonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule, MatSortModule, MatInputModule, HttpClientModule, TranslateModule,],
  templateUrl: './evenrecodersettings.component.html',
  styleUrl: './evenrecodersettings.component.css',
  providers: [RecorderserviceService]
})
export class EvenrecodersettingsComponent implements OnInit {
  isStaticChannelEnabled = true;
  myForm: any = FormGroup;
  dataSource = new MatTableDataSource<tableData>(ELEMENT_DATA);
  displayedColumns: string[] = ['select', 'didNumber', 'didLabel', 'action'];

  buildDiv: string = 'e-oneRecorder';

  constructor(
    private add: FormBuilder,
    private recorderserive: RecorderserviceService,
    private popUp: MatDialog,
    private dialog: MatDialog,
    private exportService: SharedService,
    private matDialogue: MatDialog
  ) {

  }
  ngOnInit(): void {
    this.myForm = this.add.group({
      DataPath: new FormControl('/opt/app/DATA', Validators.required),
      ACH: new FormControl(),
      chindex: new FormControl(),
      mediafwdip: new FormControl(),
      mediaproxy: new FormControl(),
      logstatus: new FormControl(),
      log: '0',
      Maxfilesize: new FormControl(),
      staticchannel: ['1'],
      basenumber: new FormControl(),
      basenumberstart: new FormControl(),
    })

    this.getDatas()


  }
  ngAfterViewInit(): void {
    // Ensure the initial state is set after the view has been initialized
    this.recorderserive.fetchlicenseData().subscribe((res: any) => {
      this.eonerecorderchannelCount = res.result.dg.e1.E1_ShCTI.channels
      this.myForm.get('ACH')?.patchValue(this.eonerecorderchannelCount);
      this.myForm.controls['ACH'].disable();

    })
  }
  divFunction(arg: string) {
    this.buildDiv = arg
    if (arg == "didLabeling") {
      this.getTableData()

    }


  }
  getDatas() {
    this.recorderserive.geteonerecorderData({}).subscribe((result: any) => {

      if (result) {
        this.myForm.patchValue({
          DataPath: result.data.DATADRIVE || '/opt/app/DATA',
          ACH: result.data.ECH || 8,
          mediaproxy: result.data.MEDIA_PROXY_IP || '172.18.0.4',
          mediafwdip: result.data.MEDIA_FORWARD_IP || '172.18.0.3',
          chindex: result.data.CHINDEX || '001',
          logstatus: result.data.LOGGER_STATUS || 'Off',
          log: result.data.LOG || 0,
          Maxfilesize: result.data.MAXFILESIZE || 5,
          staticchannel: result.data.STATIC_CHANNELS || 1,
          basenumber: result.data.BASE_NUMBER || '009148426746',
          basenumberstart: result.data.BASE_NUMBER_START || '00'
        })
        this.updateVisibility()
      }
    })
  }
  savebutton() {

    if (this.myForm.valid) {
      let body = { value: this.myForm.getRawValue() }
      this.recorderserive.insertE1recoderData(body).subscribe((result: any) => {
        if (result.status == true) {
          const dialogRef = this.popUp.open(PopUpComponent, { width: "500px", height: "250px", data: { message: 'E1 recorder settings added successfully.' } });

        } else {
          this.dialog.open(PopUpComponent, {
            width: "500px",
            height: "290px",
            data: { message: result.statusText },
          });
        }

      })
    }

  }
  eonerecorderchannelCount: any

  updateVisibility() {
    const staticChannelValue = this.myForm.get('staticchannel')?.value;
    this.isStaticChannelEnabled = staticChannelValue === '1';
  }


  newLabeling(status: any, element: any): void {
    const dialogRef = this.dialog.open(ChannelmappingAlertComponent, {
      disableClose: true,
      data: { element: element, didLabeling: status },


    });

    dialogRef.afterClosed().subscribe(result => {

      this.getTableData()
    });
  }
  limit: any = 10;
  offset: any = 0;
  totalPages = 1;
  currentPage = 1;
  TotalRecords: number = 0;
  alldata: any = []
  @ViewChild(MatSort, { static: true })
  sort: any = MatSort;
  paginator: any = MatPaginator;
  getTableData() {
    const body = { limit: this.limit, offset: this.offset, recorderTypeId: 4 }
    // recorderTypeId =4 for E one recorder

    this.recorderserive.getDIDlabelData(body).subscribe((result: any) => {
      if (result.status == true) {
        console.log(result);

        this.dataSource = new MatTableDataSource<tableData>(ELEMENT_DATA);
        this.dataSource = result.data;
        this.alldata = result.data;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.TotalRecords = result.count;
        this.calculateTotalPages()
      }

    })
  }
  selectAll = false;
  selectedIds: any = [];

  deleteFunction(message: any, id: any) {
    if (this.selectedIds.length == 0) {
      this.dialog.open(PopUpComponent, {
        width: "500px",
        height: "290px",
        data: { message: 'No data is selected' },
      });
    } else {
      let body = { 'id': id }
      this.matDialogue.open(ConfirmationDialogComponent, {
        data: {
          clickedStatus: "deleteConfirmation",
          message: message
        },
        disableClose: true,
      }).afterClosed().subscribe((result: any) => {


        if (result == true) {
          this.recorderserive.deleteDIDlabel(body).subscribe((result: any) => {
            if (result.status == true) {
              this.getTableData()
              this.matDialogue.closeAll()

              this.dialog.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: { message: 'DID label deleted successfully' },
              });
            } else {

              this.dialog.open(PopUpComponent, {
                width: "500px",
                height: "290px",
                data: { message: 'Failed to deleted data!' },
              });
            }
          })
        }
      })
    }


  }
  isLoading = false;
  downloadData: any = []
  exportToFile(fileType: string) {
    console.log('file download');
    
    this.isLoading = true;
    const body = { limit: 1000, offset: 0 , recorderTypeId: 4 }

      this.recorderserive.getDIDlabelData(body).subscribe((result: any) => {
        this.downloadData = result.data;
        console.log('DAta',this.downloadData);
        
        const exceldata = this.downloadData.map((item: any) => ({
          "Sl.No": item.didLabelingId,
          "DID Number": item.didNumber,
          "DID Label": item.didLabel
        }));
        this.exportService.generateFile(fileType, exceldata, 'E-One DID Labels ')
        this.isLoading = false;
      },(Error)=>{
        this.isLoading = false;
        console.error(Error)
      })
 
  }
  onItemsPerPageChange(event: MatSelectChange) {

    this.limit = event.value;
    this.offset = 0;
    this.getTableData()
    this.calculateTotalPages();



  }
  goToPage(event: any) {
    this.currentPage = event.value;
    this.offset = (this.currentPage - 1) * this.limit;
    this.getTableData()


  }
  getPagesArray() {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }
  previousPage() {
    if (this.offset > 0) {
      this.offset -= this.limit; // Decrease offset for the previous page
    }
    this.getTableData()
  }
  nextPage() {
    if (this.offset + this.limit < this.TotalRecords) {
      this.offset += this.limit; // Increase offset for the next page

    }
    this.getTableData()

  }
  calculateTotalPages() {
    this.totalPages = Math.ceil(this.TotalRecords / this.limit);
  }
  toggleRoleSelection(id: number, isChecked: boolean,) {
    if (isChecked) {
      this.selectedIds.push(id);

    } else {
      const index = this.selectedIds.indexOf(id);
      if (index > -1) {
        this.selectedIds.splice(index, 1);

      }
    }
    // Update "Select All" checkbox state
    this.selectAll = this.alldata.map((role: any) => role.recorderChannelMappingId).every((id: any) => this.selectedIds.includes(id));

  }
  isRoleSelected(roleId: number): boolean {
    return this.selectedIds.some((role: any) =>
      role === roleId);
  }
  toggleSelectAll(checked: boolean) {
    this.selectAll = checked;
    if (checked) {
      this.selectedIds = this.alldata.map((role: any) => role.recorderChannelMappingId); // Add all role IDs
    } else {
      this.selectedIds = []; // Clear the array
    }


  }

}
