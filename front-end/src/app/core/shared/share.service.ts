import { AfterViewInit, ElementRef, Injectable, ViewChild } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf'; // Import the entire library
import html2canvas from 'html2canvas'; //for tiff export
import { saveAs } from 'file-saver';
import autoTable from 'jspdf-autotable'

import { SystemInfoServices } from '../services/systemInfo/systemInfo-service.service';
import { error } from 'highcharts';
@Injectable({
  providedIn: 'root'
})
 
export class SharedService {
  // Create a BehaviorSubject to hold the logout state (true when logged out)
  logoutSubject = new BehaviorSubject<boolean>(false);
  // Observable that other components can subscribe to
  logoutStatus$ = this.logoutSubject.asObservable();
  // Create a BehaviorSubject to hold the logout state (true when logged out)
  loginUser = new BehaviorSubject<string>('');
  // Observable that other components can subscribe to
  loginUserId$ = this.loginUser.asObservable();
  private componentMethodCallSource = new Subject<void>();
  // Observable that other components can subscribe to
  componentMethodCalled$ = this.componentMethodCallSource.asObservable();
  items: any;
  callComponentMethod() {
    this.componentMethodCallSource.next();
  }


  constructor(
    // private stationMonitor:StationMonitoringService 
    private logoApi: SystemInfoServices
  ) { }

  private getUsersSubject = new Subject<any>();
  getUsers$ = this.getUsersSubject.asObservable();
  private getUsersIDSubject = new Subject<any>();
  getUsersId$ = this.getUsersIDSubject.asObservable();
  dataSource: any;
  // getTing the role id from  one  component to another
  triggerGetUsers(roleId: any) {

    this.getUsersSubject.next(roleId);
  }
  // geTting the user id from  one  component to another
  triggerGetUserId(userId: any) {
    this.getUsersIDSubject.next(userId);
  }

  // Define your key mappings here if needed
  keyMapping: any = {
    firstname: 'Name', primaryEmail: 'Primary Email', phone: 'Phone'
  };

  // function to select wich file type we want
  generateFile(fileType: string, tableData: any, fileName: string) {
    const headers = this.getStandardHeadings(tableData)
    const timeNow = new Date().toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true // Optional: Use 24-hour format
    });
    const formattedDate = timeNow.replaceAll("/", "-");

    let fileNameWithTime = `${fileName}-${timeNow}`;

    switch (fileType) {
      case 'Excel':
        // call excel fn
        this.exportToExcel(tableData, fileName, fileNameWithTime, headers, formattedDate)
        break;
      case 'PDF':
        this.exportToPDF(tableData, formattedDate, fileNameWithTime, headers)
        break;
      case 'TIFF':
        // this.exportToTiff(tableData, formattedDate, fileNameWithTime, headers)
        break;
      default:
        break;
    }
  }


  exportToExcel(data: any[], sheetName: string, fileName: string, headers: any, reportDate: string): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Function to format the keys
    const formatKey = (key: string): string => {
      const specialCases = ['ID']; // Words that should remain fully uppercase

      return key
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before uppercase letters, but only for transitions
        .trim()                             // Remove leading/trailing spaces
        .split(' ')                         // Split into words
        .map(word =>
          specialCases.includes(word.toUpperCase())
            ? word.toUpperCase() // Keep special cases in uppercase
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() // Normal capitalization
        )
        .join(' ');                         // Join back with spaces
    };

    // Load the logo image
    const logoName = localStorage.getItem('logoName');
    if (logoName) {
      this.logoApi.getFiles(logoName).subscribe(logoBlob => {
        if (logoBlob) {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (result instanceof ArrayBuffer) {
              const imageId = workbook.addImage({
                buffer: result,
                extension: 'jpeg', // or 'png' depending on your logo format
              });

              // Add the logo image to the worksheet
              worksheet.addImage(imageId, {
                tl: { col: 0, row: 0 },
                ext: { width: 60, height: 40 }
              });

              let position = 'E1'
              console.log("sheetName", sheetName.length);
              if (sheetName.length > 20 && sheetName.length < 23) {
                position = 'G1'
              } else if (sheetName.length <= 20 && sheetName.length > 11) {
                position = 'F1'
              }
              else if (sheetName.length < 11) {
                position = 'D1'
              }
              else if (sheetName.length > 22 && sheetName.length < 40) {
                position = 'H1'
              }
              // Merge cells and add report title in the first row
              const reportText = `Report: ${sheetName}          Generated on: ${reportDate}`;

              worksheet.mergeCells('B1', position); // Adjust range based on your column count
              worksheet.getCell('B1').value = reportText;
              worksheet.getCell('B1').alignment = { horizontal: 'center', vertical: 'middle' };
              worksheet.getCell('B1').font = { bold: true };

              // Add a blank row after the title
              worksheet.addRow([]);

              // Add headers to the worksheet
              const formattedHeaders = headers.map((header: string) => formatKey(header));
              const headerRow = worksheet.addRow(formattedHeaders);
              headerRow.font = { bold: true };

              // Adjust column widths and enable text wrapping
              formattedHeaders.forEach((header: string | any[], index: number) => {
                const column = worksheet.getColumn(index + 1);
                column.width = Math.max(15, header.length + 5); // Set width based on header length
                column.alignment = { wrapText: true }; // Enable text wrapping
              });

              // Add data starting from row 4
              data.forEach(dataItem => {
                const filteredItem: any = {};
                for (const key of headers) {
                  if (dataItem.hasOwnProperty(key)) {
                    filteredItem[formatKey(key)] = dataItem[key];
                  } else {
                    console.warn(`Key "${key}" not found in dataItem:`, dataItem);
                  }
                }
                worksheet.addRow(Object.values(filteredItem));
              });

              // Write the workbook to a file
              workbook.xlsx.writeBuffer().then(buffer => {
                const blob = new Blob([buffer], { type: 'application/octet-stream' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${fileName}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }).catch((error) => {
                console.error('Error creating Excel file:', error);
              });
            } else {
              console.error("Error: FileReader result is not an ArrayBuffer.");
            }
          };
          reader.readAsArrayBuffer(logoBlob);
        } else {
          // Handle case without logo
          console.warn("Logo Blob is invalid or not found.");

          // Fallback: Print "Speechlogix" in the first cell
          worksheet.getCell('A1').value = "SPEECHLOGIX";
          worksheet.getCell('A1').alignment = { horizontal: 'left', vertical: 'middle' };
          worksheet.getCell('A1').font = { bold: true };

          // Merge cells and add report title in the first row
          const reportText = `Report: ${sheetName}          Generated on: ${reportDate}`;
          worksheet.mergeCells('B1', `E1`);
          worksheet.getCell('B1').value = reportText;
          worksheet.getCell('B1').alignment = { horizontal: 'center', vertical: 'middle' };
          worksheet.getCell('B1').font = { bold: true };

          // Add headers and data...
          const formattedHeaders = headers.map((header: string) => formatKey(header));
          const headerRow = worksheet.addRow(formattedHeaders);
          headerRow.font = { bold: true };

          formattedHeaders.forEach((header: string | any[], index: number) => {
            const column = worksheet.getColumn(index + 1);
            column.width = Math.max(15, header.length + 5);
            column.alignment = { wrapText: true };
          });

          data.forEach(dataItem => {
            const filteredItem: any = {};
            for (const key of headers) {
              if (dataItem.hasOwnProperty(key)) {
                filteredItem[formatKey(key)] = dataItem[key];
              } else {
                console.warn(`Key "${key}" not found in dataItem:`, dataItem);
              }
            }
            worksheet.addRow(Object.values(filteredItem));
          });

          workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${fileName}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }).catch((error) => {
            console.error('Error creating Excel file:', error);
          });
        }
      }, ((error) => {
        if (error.status === 403) {
          // this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } })
        }
        else if (error.status === 404) {
          // this.noDataFound = true;
        }
        // Fallback: Print "Speechlogix" in the first cell
        worksheet.getCell('A1').value = "SPEECHLOGIX";
        worksheet.getCell('A1').alignment = { horizontal: 'left', vertical: 'middle' };
        worksheet.getCell('A1').font = { bold: true };

        // Merge cells and add report title in the first row
        const reportText = `Report: ${sheetName}          Generated on: ${reportDate}`;
        worksheet.mergeCells('B1', `E1`);
        worksheet.getCell('B1').value = reportText;
        worksheet.getCell('B1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getCell('B1').font = { bold: true };

        // Add headers and data...
        const formattedHeaders = headers.map((header: string) => formatKey(header));
        const headerRow = worksheet.addRow(formattedHeaders);
        headerRow.font = { bold: true };

        formattedHeaders.forEach((header: string | any[], index: number) => {
          const column = worksheet.getColumn(index + 1);
          column.width = Math.max(15, header.length + 5);
          column.alignment = { wrapText: true };
        });

        data.forEach(dataItem => {
          const filteredItem: any = {};
          for (const key of headers) {
            if (dataItem.hasOwnProperty(key)) {
              filteredItem[formatKey(key)] = dataItem[key];
            } else {
              console.warn(`Key "${key}" not found in dataItem:`, dataItem);
            }
          }
          worksheet.addRow(Object.values(filteredItem));
        });

        workbook.xlsx.writeBuffer().then(buffer => {
          const blob = new Blob([buffer], { type: 'application/octet-stream' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${fileName}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }).catch((error) => {
          console.error('Error creating Excel file:', error);
        });

      }))
    } else {
      console.warn("No logo name found in localStorage.");

      // Merge cells and add report title in the first row
      const reportText = `Report: ${sheetName}          Generated on: ${reportDate}`;
      worksheet.mergeCells('A1', `E1`); // Adjust range based on your column count
      worksheet.getCell('A1').value = reportText;
      worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell('A1').font = { bold: true };

      // Add headers
      const formattedHeaders = headers.map((header: string) => formatKey(header));
      const headerRow = worksheet.addRow(formattedHeaders);
      headerRow.font = { bold: true };

      // Adjust column widths and enable text wrapping
      formattedHeaders.forEach((header: string | any[], index: number) => {
        const column = worksheet.getColumn(index + 1);
        column.width = Math.max(15, header.length + 5); // Adjust width
        column.alignment = { wrapText: true }; // Enable text wrapping
      });

      // Add data
      data.forEach(dataItem => {
        const filteredItem: any = {};
        for (const key of headers) {
          if (dataItem.hasOwnProperty(key)) {
            filteredItem[formatKey(key)] = dataItem[key];
          } else {
            console.warn(`Key "${key}" not found in dataItem:`, dataItem);
          }
        }
        worksheet.addRow(Object.values(filteredItem));
      });

      // Write the workbook to a file without an image
      workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }).catch((error) => {
        console.error('Error creating Excel file:', error);
      });
    }
  }


  getStandardHeadings(data: any[]): string[] {
    if (data.length > 0) {
      return Object.keys(data[0]);
    }
    return [];
  }

  // exporting to PDF
  exportToPDF(tableData: any, timeNow: any, fileName: string, tableHeaders: any) {
    const logoName = localStorage.getItem('logoName') || null; // Retrieve logo from localStorage

    if (logoName) {
      this.logoApi.getFiles(logoName).subscribe(logoURL => {
        if (logoURL) {
          console.log("Logo URL/Base64:", logoURL);
          this.createPDF(logoURL, tableData, timeNow, fileName, tableHeaders);
        } else {
          console.warn("Logo URL is invalid or not found.");
          this.createPDF(null, tableData, timeNow, fileName, tableHeaders); // Call with null logo
        }
      }, (error) => {
        console.error("Error getting logo:>>", error);
        this.createPDF(null, tableData, timeNow, fileName, tableHeaders); // Call with null logo

      });
    } else {
      console.warn("No logo name found in localStorage.");
      
      this.createPDF(null, tableData, timeNow, fileName, tableHeaders); // Call with null logo
    }
  }



  createPDF(logoBlob: Blob | null, tableData: any[], reportDate: string, fileName: string, tableHeaders: string[]): void {
    const doc = new jsPDF();

    const formatKey = (key: string): string => {
        const specialCases = ["ID"];
        return key
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .trim()
            .split(" ")
            .map((word) =>
                specialCases.includes(word.toUpperCase())
                    ? word.toUpperCase()
                    : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
    };

    const formattedHeaders = tableHeaders.map(formatKey);
    const tableDataArray = tableData.map((data: any) =>
        tableHeaders.map(header => data[header] === null ? '' : data[header])
    );

    const img = new Image();
    const columnStyles: any = {};

    if (logoBlob) {
        const objectURL = URL.createObjectURL(logoBlob);
        img.src = objectURL;
    } else {
        img.src = '';
    }

    const ReportName = fileName.replace(/-\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} [ap]m$/, "").trim();

    img.onload = () => {
        doc.addImage(img, 'JPEG', 10, 10, 50, 20);
        doc.setFontSize(10);
        doc.text(`Report: ${ReportName}`, 14, 40);

        // ✅ Position "Generated on: ..." at the top-right, aligned with the heading
        const pageWidth = doc.internal.pageSize.width;
        const textWidth = doc.getTextWidth(`Generated on: ${reportDate}`);
        doc.text(`Generated on: ${reportDate}`, pageWidth - textWidth - 14, 35);

        autoTable(doc, {
            head: [formattedHeaders],
            body: tableDataArray,
            startY: 50,
            styles: {
                fontSize: 6,
                cellPadding: 2,
                lineWidth: 0.2,
                lineColor: [200, 200, 200],
                halign: 'center',
                valign: 'middle',
                overflow: 'linebreak',
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: [255, 255, 255],
                fontSize: 6,
                fontStyle: 'bold',
            },
            bodyStyles: {
                fillColor: [245, 245, 245],
            },
            columnStyles: columnStyles,
            margin: { top: 50 },
            pageBreak: 'auto',
            showHead: 'everyPage'
        });

        doc.save(`${fileName}.pdf`);
    };

    img.onerror = () => {
        console.error("Error loading logo");
        doc.setFontSize(10);
        doc.text(`Report: ${ReportName}`, 14, 10);

        // ✅ Position "Generated on: ..." at the top-right, aligned with the heading
        const pageWidth = doc.internal.pageSize.width;
        const textWidth = doc.getTextWidth(`Generated on: ${reportDate}`);
        doc.text(`Generated on: ${reportDate}`, pageWidth - textWidth - 14, 10);

        // Conditionally apply custom settings for "Deleted Call Report"
          if (fileName.includes("Deleted Call Report")) {
            columnStyles[5] = { cellWidth: 50 };  // Apply custom width for the "notes" column
        }

        if (fileName.includes("Employee Details")) {
          columnStyles[0] = { cellWidth: 10};  
          columnStyles[1] = { cellWidth: 10};  
          columnStyles[2] = { cellWidth: 10}; 
          columnStyles[3] = { cellWidth: 20}; 
          columnStyles[4] = { cellWidth: 15};  
          columnStyles[5] = { cellWidth: 20};  
          columnStyles[6] = { cellWidth: 20};  
          columnStyles[7] = { cellWidth: 15};  
          columnStyles[8] = { cellWidth: 15};  
          columnStyles[9] = { cellWidth: 20};  
          columnStyles[10] = { cellWidth: 20};  
          columnStyles[11] = { cellWidth:15};  
  
        }

        autoTable(doc, {
            head: [formattedHeaders],
            body: tableDataArray,
            startY: 20,
            styles: {
                fontSize: 7,
                cellPadding: 1,
                lineWidth: 0.2,
                lineColor: [200, 200, 200],
                halign: 'center',
                valign: 'middle',
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: [255, 255, 255],
                fontSize: 7,
                fontStyle: 'bold',
            },
            bodyStyles: {
                fillColor: [245, 245, 245],
            },
            columnStyles: columnStyles,
            pageBreak: 'auto',
            showHead: 'everyPage'
        });

        doc.save(`${fileName}.pdf`);
    };
}




  @ViewChild('myCanvas') myCanvas: ElementRef | undefined;
  ngAfterViewInit() {
    // for initialize value
    if (this.myCanvas) {
      const canvas = this.myCanvas.nativeElement;
      const dataURL = canvas.toDataURL('image/tiff');
      const blob = new Blob([dataURL], { type: 'image/tiff' });
      saveAs(blob, 'my-image.tiff');
    }
  }


  // Helper function to generate TIFF without logo
  generateTiffWithoutLogo(
    reportDate: string,
    fileName: string,
    formattedHeaders: string[],
    tableDataArray: any[]
  ) {
    // Create a canvas to draw everything
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 800; // Set the canvas width
    canvas.height = 600; // Set the canvas height

    // Draw the report date


    // Create TIFF encoder

    // Finish the TIFF file


    // Trigger download
    const link = document.createElement('a');

    link.download = `${fileName}.tiff`;
    link.click();

    URL.revokeObjectURL(link.href);
  }

  // Helper function to format headers
  formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters
      .trim()                     // Remove leading/trailing spaces
      .split(' ')                 // Split into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter
      .join(' ');                 // Join back with spaces
  }



}
