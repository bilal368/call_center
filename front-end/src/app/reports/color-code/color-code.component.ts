import { Component, ViewChild, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckbox, MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { CustomDateComponent } from '../../shared/dialogComponents/custom-date/custom-date.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientModule } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { UserService } from '../../core/services/user/user.service';
import { SharedService } from '../../core/shared/share.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SystemInfoServices } from '../../core/services/systemInfo/systemInfo-service.service';
import * as ExcelJS from 'exceljs';




export interface Color {
  color: string;
  recordings: number;
  percentage: number;
  export: string;
}

let ELEMENT_DATA: Color[] = [];

@Component({
  selector: 'app-color-code',
  standalone: true,
  imports: [MatButtonModule,MatToolbarModule,MatTooltipModule,MatIconModule,MatSortModule,MatInputModule,MatSlideToggleModule,MatCheckboxModule,MatTableModule,
  MatPaginatorModule,TranslateModule,MatProgressBarModule,MatMenuModule,FormsModule,CommonModule,HttpClientModule],
  providers: [DatePipe],
  templateUrl: './color-code.component.html',
  styleUrl: './color-code.component.css'
})

export class ColorCodeComponent {

  @ViewChild(MatSort)
  sort!: MatSort;
  
  // displayedColumns: string[] = ['color', 'recordings', 'percentage', 'export'];
  displayedColumns: string[] = ['color', 'recordings', 'percentage', 'export'];

  dataSource = new MatTableDataSource<Color>(ELEMENT_DATA);
  
  clickedRows = new Set<Color>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataStatus: boolean = false;
  buildDiv: any;
  extension: any;
  selectedExtension: any;
  selectedAgent: [] = []
  agents: any;
  sortDirection: 'asc' | 'desc' = 'asc';
  totalLength: any;
  extensionReportBody: any;
  items: any = [];
  id: any;
  selectedColors: string[] = [];
  colors: any;
  colorcode: any;
isLoading: any;
filteredColorCodes: any;
  constructor(public dialog: MatDialog,private datePipe: DatePipe,private userApi: UserService,private SharedService: SharedService,private logoApi:SystemInfoServices) {this.dataSource = new MatTableDataSource(ELEMENT_DATA); }
  selectedDateRange: string ='Today';
  customFromDate: Date | null = null;
  customToDate: Date | null = null;
  data: Color[] = [];
  selectedExtensions: string = '';
  selectedAgents: string = '';
  selectedDirection: string = 'All';


  toolTips: any = {
    Download: 'Menu.REPORTS RECORDING.COLOUR CODED CALLS.Download',
    "apply": 'Menu.Apply Changes',
    "download": 'Menu.Download Reports',
    Previous: 'Menu.REPORTS RECORDING.AGENTS.Previous',
    Next: 'Menu.REPORTS RECORDING.AGENTS.Next'
  }


  toggleAll(event: any) {
    const checked = event.checked;
    this.dataSource.data.forEach((element: any) => element.checked = checked);
  }

    ngOnInit(): void {
      this.getColorCodeSummaryReport();
      this.getFilters();
      // this.filteredColorCodes = [...this.colorcode]; // Initialize filtered list with all color codes
      this.dataSource.sort = this.sort;
  
    }
    
    trackByColor(index: number, color: { colorCodeId: string; colorCode: string }): string {
      return color.colorCodeId;
    }
    
  callFilter: any = {
    inColorCodeId:null,
    inExtensionNumber: null,
    inCallDirection: null,
    inAgentCode: null,
    inCallStartDateTime: new Date().toISOString().split('T')[0] + ' 00:00:00', // Default to today
    inCallEndDateTime: new Date().toISOString().split('T')[0] + ' 23:59:59',
    inCallStartTime: null,
    inCallEndTime: null,
    inPageNumber: null,
    inRecordsPerPage: null,
    inUserId: null,
    inSortColumn: null,
    inSortOrder: null
  };

  applyFilters() {
    this.getColorCodeSummaryReport()
  }

  setDirection(direction: string) {
    // Update selected direction and filter based on input
    if (direction === '') {
      this.selectedDirection = 'All';
      this.callFilter.inCallDirection = '0,1'; // Set to include both directions
    } else if (direction === '0') {
      this.selectedDirection = 'Incoming';
      this.callFilter.inCallDirection = '0';
    } else if (direction === '1') {
      this.selectedDirection = 'Outgoing';
      this.callFilter.inCallDirection = '1';
    } else {
      console.warn("Unexpected direction value: ", direction);
    }
  }

  // Function for Date Range
  setDateRange(range: string) {
    this.selectedDateRange = range;
    const today = new Date();
    let startDateTime: string = '0000-00-00 00:00:00';
    let endDateTime: string = '0000-00-00 23:59:59';

    switch (range) {
      case 'Today':
        startDateTime = today.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = today.toISOString().split('T')[0] + ' ' + '23:59:59';
        break;
      case 'This Week':
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        const endOfWeek = new Date(today.setDate(startOfWeek.getDate() + 6));
        startDateTime = startOfWeek.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfWeek.toISOString().split('T')[0] + ' ' + '23:59:59';
        break;
      case 'This Month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 2);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        startDateTime = startOfMonth.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfMonth.toISOString().split('T')[0] + ' ' + '23:59:59';
        break;
      case 'This Quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        startDateTime = startOfQuarter.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfQuarter.toISOString().split('T')[0] + ' ' + '23:59:59';
        break;
      case 'This Year':
        const startOfYear = new Date(today.getFullYear(), 0, 2); // January is month 0
        const endOfYear = new Date(today.getFullYear(), 11, 32); // December is month 11
        startDateTime = startOfYear.toISOString().split('T')[0] + ' ' + '00:00:00';
        endDateTime = endOfYear.toISOString().split('T')[0] + ' ' + '23:59:59';
        break;

      case 'Custom':
        this.openCustomDateDialog(this.selectedDateRange);
        return;

      default:
        // Fallback to today
        startDateTime = today.toISOString().split('T')[0] + ' 00:00:00';
        endDateTime = today.toISOString().split('T')[0] + ' 23:59:59';
        break;
    }

    // Update the callFilter object
    this.callFilter.inCallStartDateTime = startDateTime;
    this.callFilter.inCallEndDateTime = endDateTime;
  }


  // Function openCustomDateDialog Date Range
  openCustomDateDialog(selectedDateRange:any) {
    this.selectedDateRange=selectedDateRange;

    const currentDate = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(currentDate.getMonth() + 1);
    const startDate = this.formatDate(currentDate);
    const endDate = this.formatDate(oneMonthFromNow);
    let dialogRef: any;

    const fromDate = this.customFromDate ? this.formatDate(new Date(this.customFromDate)) : startDate;

    const toDate = this.customToDate ? this.formatDate(new Date(this.customToDate)) : endDate;

    setTimeout(() => {
      dialogRef = this.dialog.open(CustomDateComponent, {
        minWidth: '300px', height: '245px',
        data: {
          fromDate,
          toDate
        }
      });
      dialogRef.afterClosed().subscribe((result: { fromDate: Date | null; toDate: Date | null; }) => {
        if (result) {
          this.customFromDate = result.fromDate;
          this.customToDate = result.toDate;

          // Fallback to current date if fromDate or toDate is null
          const customFromDate = this.customFromDate ? new Date(this.customFromDate) : new Date();
          const customToDate = this.customToDate ? new Date(this.customToDate) : new Date();

          this.selectedDateRange = `${this.formatDate(customFromDate)} to ${this.formatDate(customToDate)}`;

          const startDateTime = customFromDate.toISOString().split('T')[0] + ' ' + '00:00:00';
          const endDateTime = customToDate.toISOString().split('T')[0] + ' ' + '23:59:59';

          this.callFilter.inCallStartDateTime = startDateTime;
          this.callFilter.inCallEndDateTime = endDateTime;
        }
      });
    }, 500);
  }
  formatDate(date: Date | null): string {
    return date ? this.datePipe.transform(date, 'dd-MM-yyyy') || '' : '';
  }

  // Function for getcolor code
  getColorCodeSummaryReport(): void {
    let body = this.callFilter
    this.userApi.getColorcode(body).subscribe((result: any) => {

      if (result.status === true) {
          this.dataStatus = true;
          this.dataSource.data = result.data[0].map((item: any) => ({
            color: item.ColorCode,
            recordings: item.NoOfRecordings,
            percentage: parseFloat(item.PercentageOfRecordings),
            colorCodeId:item.colorCodeId
          })
        );

      }

    }, error => {
      console.error(error);
    });

  }
 
  getExcel(element: any) {
    const id = `'${element.colorCodeId}'`;
    const colorCodeName = element.color || "Color Code Report";
    const body = { ...this.callFilter, inColorCodeId: id.replace(/^'|'$/g, '') };
  
    this.userApi.getColorcodeExcel(body).subscribe((result: any) => {
      if (result && result.data && result.data.length > 0) {
  
        // Define headers
        const headers = [
          'Agent ID',
          'Agent Name',
          'Call Direction',
          'Date',
          'Start Time',
          'Caller ID',
          'Dialed Number',
          'Extension Label',
          'Extension Number'
        ];
  
        // Map data
        const data = result.data[0].map((item: any) => {
          const [date, time] = item.CallStartTime.split(' ');
          return {
            'Agent ID': item.AgentCode,
            'Agent Name': item.AgentName,
            'Call Direction': item.CallDirection,
            'Date': date,
            'Start Time': time,
            'Caller ID': item.CallerId,
            'Dialed Number': item.DialledNumber,
            'Extension Label': item.ExtensionLabel,
            'Extension Number': item.ExtensionNumber
          };
        });
  
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(colorCodeName);
  
        // Add title
        worksheet.mergeCells(1, 1, 2, headers.length);
        worksheet.getCell('A2').value = `Color Code Report - ${colorCodeName}`;
        worksheet.getCell('A2').font = { bold: true, size: 14 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
  
        // Add headers
        worksheet.getRow(3).values = headers;
        worksheet.getRow(3).font = { bold: true };
  
        // Add data rows
        let currentRow = 4;
        data.forEach((row: { [s: string]: ExcelJS.CellValue; } | ArrayLike<ExcelJS.CellValue>) => {
          worksheet.getRow(currentRow).values = Object.values(row);
          currentRow++;
        });
  
        // Adjust column widths
        worksheet.columns.forEach(column => (column.width = 20));
  
        const logoName = localStorage.getItem('logoName');
        if (logoName) {
          this.logoApi.getFiles(logoName).subscribe(
            (logoBlob) => {
              const reader = new FileReader();
              reader.onload = () => {
                const imageId = workbook.addImage({
                  buffer: reader.result as ArrayBuffer,
                  extension: 'jpeg'
                });
  
                worksheet.addImage(imageId, {
                  tl: { col: 0, row: 0 },
                  ext: { width: 60, height: 40 }
                });
  
                this.downloadExcel(workbook, colorCodeName);
              };
              reader.readAsArrayBuffer(logoBlob);
            },
            (logoError) => {
              console.error("Logo retrieval failed:", logoError);
              this.downloadExcel(workbook, colorCodeName);
            }
          );
        } else {
          console.warn("No logo found, proceeding without logo.");
          this.downloadExcel(workbook, colorCodeName);
        }
      } else {
        console.error("No data available to export.");
      }
    }, error => {
      console.error("Error occurred while calling API:", error);
    });
  }
  


  
  
  // Helper method to download Excel
  downloadExcel(workbook: ExcelJS.Workbook, colorCodeName: string) {
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
      link.download = `${colorCodeName.replace(/\s+/g, '_')}_${timestamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
  

  
  getColorFilterText(): string {
    if (this.selectedColors.length === 0) {
      return 'All'; // If no colors are selected
    } else if (this.selectedColors.length === 1 && !this.selectedColors.includes('All')) {
      return this.getColorName(this.selectedColors[0]); // If exactly one color is selected
    } else if (this.selectedColors.length > 1 && !this.selectedColors.includes('All')) {
      return 'Multiple'; // If more than one color is selected
    } else if (this.selectedColors.includes('All')) {
      return 'All'; // If 'All' is selected
    }
    return 'All'; // Default if none of the conditions match
  }
  








// Function for get extension filters

getFilters(): void {
  const body = {}; // Adjust the body parameters as needed
  this.userApi.getFilters(body).subscribe(
    (result: any) => {
      if (result.status === true) {
        this.extension = result.extensions;
        this.agents = result.agents;
        this.colorcode = result.colorcode; // Assign color codes from API response
        this.filteredColorCodes = [...this.colorcode];  // Store a copy for searching

      }
    },
    (error) => {
      console.error(error);
    }
  );
}

onColorSearchChange(event: any): void {
  const searchTerm = event.target.value.toLowerCase();
  this.filteredColorCodes = this.colorcode.filter((color: { colorCode: string; }) =>
    color.colorCode.toLowerCase().includes(searchTerm)
  );
}


  getColorName(colorCodeId: number | string): string {
    const color = this.colorcode.find((item: any) => item.colorCodeId === colorCodeId);
    return color ? color.colorCode : 'Unknown'; // Default to 'Unknown' if not found
}
isColorSelected(colorCodeId: string): boolean {
  return this.selectedColors.includes(colorCodeId);
}


toggleColor(color: string, event: any): void {
  const isChecked = event.checked;

  if (color === 'All') {
    if (isChecked) {
      // Select all colors
      this.selectedColors = this.colorcode.map((c: { colorCodeId: any }) => c.colorCodeId);
      this.selectedColors.push('All'); // Include 'All'
    } else {
      // Deselect all colors
      this.selectedColors = [];
    }
  } else {
    if (isChecked) {
      // Add the selected color
      if (!this.selectedColors.includes(color)) {
        this.selectedColors.push(color);
      }
      // Remove 'All' from selection if included
      this.selectedColors = this.selectedColors.filter((c) => c !== 'All');
    } else {
      // Remove the deselected color
      this.selectedColors = this.selectedColors.filter((c) => c !== color);

      // Deselect 'All' if any specific color is deselected
      if (this.selectedColors.includes('All')) {
        this.selectedColors = this.selectedColors.filter((c) => c !== 'All');
      }
    }
  }
  this.callFilter.inColorCodeId = this.selectedColors.filter(c => c !== 'All').join(',');

}


  // Function for sorting

  sortColor() {
    const data = this.dataSource.data; // Access the data property  
    if (data && Array.isArray(data)) {
      if (this.sortDirection === 'asc') {
        this.dataSource.data = data.sort((a, b) => a.color.localeCompare(b.color));
        this.sortDirection = 'desc';
      } else {
        this.dataSource.data = data.sort((a, b) => b.color.localeCompare(a.color));
        this.sortDirection = 'asc';
      }
    }
  }

  sortRecordings() {
    const data = this.dataSource.data;
    if (this.sortDirection === 'asc') {
      // Sort in ascending order by recordings (as a number)
      this.dataSource.data = data.sort((a, b) => a.recordings - b.recordings);
      this.sortDirection = 'desc';
    } else {
      // Sort in descending order by recordings (as a number)
      this.dataSource.data = data.sort((a, b) => b.recordings - a.recordings);
      this.sortDirection = 'asc';
    }
  }

  sortPercentage() {
    const data = this.dataSource.data; // Get the data array
    if (this.sortDirection === 'asc') {
      // Sort in ascending order by recordings (as a number)
      this.dataSource.data = data.sort((a, b) => a.percentage - b.percentage);
      this.sortDirection = 'desc';
    } else {
      // Sort in descending order by recordings (as a number)
      this.dataSource.data = data.sort((a, b) => b.percentage - a.percentage);
      this.sortDirection = 'asc';
    }
  }

  exportToExcel(): void {
    // Get the selected items, if no items are selected, fall back to all data in the table
    const exportData = this.items && this.items.length > 0 ? this.items : this.dataSource.data;

    if (exportData.length === 0) {

      this.SharedService.generateFile('Excel', exportData, 'Color Code Report');
    }
    else {

      // Pass the selected employee data to the export function
      this.SharedService.generateFile('Excel', exportData, 'Color Code Report');
    }
  }
  exportToFile(fileType: string) {
    const exportdata = this.dataSource.data.map(item => ({
      color: item.color,
      recordings: item.recordings,
      percentage: item.percentage
    }));
    this.SharedService.generateFile(fileType, exportdata, 'Color Code Report')
  }

}



