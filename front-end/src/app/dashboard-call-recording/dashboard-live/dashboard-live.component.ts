import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, ChartItem, registerables } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { DashboardService } from '../../core/services/dashboard/dashboard.service';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { AuthService } from '../../core/services/authentication/auth.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WebSocketService } from '../../core/services/websocket/web-socket-service.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-live',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatTooltipModule, CommonModule, TranslateModule, MatSelectModule, MatButtonModule, ReactiveFormsModule, MatTableModule, MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule, MatButtonModule, MatButtonToggleModule],
  providers: [DashboardService],
  templateUrl: './dashboard-live.component.html',
  styleUrl: './dashboard-live.component.css'
})
export class DashboardLiveComponent {
  selectedChartType = 'bar';
  private socketSubscription!: Subscription;
  disconnected: number = 0;
  idleConnect: number = 0;
  offData: number = 0;
  onLine: number = 0;
  private charts: Chart[] = [];
  public chartsData: any[] = []; // Initialize as an empty array
  userId: any;
  dashboardItems: { name: string, selected: boolean }[] = [];
  buildDiv: string = 'live';
  selectedFilter: string = ''
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  loading: boolean = true;
  callData: any = [];
  labels: any = [];
  data: any = [];

  // Define the columns to display in the table, including logoutTime
  displayedColumns: string[] = ['username', 'ipAddress', 'loginTime', 'statusCode'];
  displayedlogoutColumns: string[] = ['username', 'ipAddress', 'loginTime', 'logoutTime', 'statusCode'];

  // Initialize MatTableDataSource for active and recent users
  activeUsers = new MatTableDataSource<any>();
  recentUsers = new MatTableDataSource<any>();

  constructor(public dialog: MatDialog, private dashboardApi: DashboardService, private authService: AuthService,
    private webSocketService: WebSocketService 
  ) { 
   
  }

  ngOnInit(): void {
    this.loading = true;
    this.fetchChannelStatus();
    // this.fetchDashboardFeatures();
    this.usersDetails();
    // this.updateChartData();
    this.getChannelCallData();
    this.listenForUserLogin();
  }

  listenForUserLogin(): void {
    this.socketSubscription = new Subscription();
  
    this.socketSubscription.add(
      this.webSocketService.listen('logIn').subscribe((username: string) => {
        console.log('User Logged In:', username);
        this.usersDetails();
      })
    );
  
    this.socketSubscription.add(
      this.webSocketService.listen('logout').subscribe((data: string) => {
        console.log('User Logged OUT:', data);
        setTimeout(() => {
          this.usersDetails()
        }, 1000)
      })
    );
  }
  

  // Fetch channel status from the API
  fetchChannelStatus(): void {
    this.dashboardApi.fetchChannelStatus().subscribe(
      (res: any) => {
        this.disconnected = res.ChannelStatusCounts.disconnected;
        this.idleConnect = res.ChannelStatusCounts.idleConnect;
        this.offData = res.ChannelStatusCounts.offData;
        this.onLine = res.ChannelStatusCounts.onLine;

        // Update chart data and render the chart
        this.updateChartData();
        this.loading = false;
      },
      (error) => {
        if (error.status === 403 || error.status === 401) {
          this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' }, disableClose: true });
        }
      }
    );
  }
  // Fetch Active and Recent Users
  usersDetails(): void {
    
    this.dashboardApi.fetchusersDetails().subscribe(
      (res: any) => {
        const convertUtcToLocal = (utcDateString: string, name: any): string => {
          // Parse the input UTC date string
          // Parse the input UTC date string
       
          const dateParts = utcDateString.split(',');
        
          const datePart = dateParts[0].trim();  // Extract date part (DD/MM/YYYY)
          const timeWithPeriod = dateParts[1]?.trim();  // Extract time with AM/PM

            const [day, month, year] = datePart.split("/").map(Number);
            let [time, meridian] = timeWithPeriod.split(" ");
            let [hours, minutes, seconds] = time.split(":").map(Number);

            if (meridian) {
              // Adjust hours for 12-hour format
              if (meridian.toLowerCase() === "pm" && hours < 12) {
                hours += 12;
              } else if (meridian.toLowerCase() === "am" && hours === 12) {
                hours = 0;
              }

              // Format the date and time as YYYY-MM-DDTHH:mm:ss (ISO format)
              const formattedDateTime = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}Z`;

              // Convert to system local time
              const localDate = new Date(formattedDateTime);

            // Extract components
            const formattedDate = `${String(localDate.getDate()).padStart(2, "0")}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${localDate.getFullYear()}`;
            const formattedTime = localDate.toLocaleTimeString(); // Keep time format as system locale

            return `${formattedDate}, ${formattedTime}`;
          }

          return "Invalid Date";

        };



        // Map activeUsers to match the frontend column structure
        this.activeUsers = new MatTableDataSource(
          res.activeUsers.map((user: any) => ({
            username: user.Username,
            ipAddress: user.IPAddress,
            loginTime: convertUtcToLocal(user.LoginTime, user.Username),
            statusCode: user.StatusCode === 'Authenticated' ? 'Auth' : user.StatusCode
          }))
        );


        // Map recentUsers to match the frontend column structure
        this.recentUsers = new MatTableDataSource(
          res.recentUsers.map((user: any) => ({
            username: user.Username,
            ipAddress: user.IPAddress,
            loginTime: convertUtcToLocal(user.LoginTime, user.Username),
            logoutTime: user.LogoutTime !== null ? convertUtcToLocal(user.LogoutTime, user.Username) : null,
            statusCode: user.StatusCode === 'Authenticated' ? 'Auth' : user.StatusCode
          }
          ))
        );
      },
      (error) => {
        console.error(error);
      }
    );
  }

  // Render the chart


  // Method to update chart data after API response
  updateChartData(): void {
    if (this.chartsData.length == 0) {
      // this.fetchDashboardFeatures();
    }
    this.chartsData.forEach((chartData, index) => {
      if (chartData.name === 'Channel Status') {
        chartData.datasets[0].data = [
          this.idleConnect,
          this.onLine,
          this.disconnected,
          this.offData
        ];
      }
      // Render chart only after the data has been updated
      // this.renderChart(index);
    });
  }

  // Update chart type
  updateChartType(type: 'bar' | 'line' | 'pie', index: number): void {
    this.chartsData[index].chartType = type;
  }



  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;


  currentData: any = []
  getChannelCallData() {
    this.currentData = []
    this.dashboardApi.fetchChannelStatus().subscribe((res: any) => {
      this.currentData.push({ data: res.ChannelStatusCounts, type: ['bar', 'line', 'pie'], variable: 'chart1', selectedType: 'bar' })
      setTimeout(() => {
        this.currentData.forEach((data: any) => this.createChart(data));
      }, 500)
    })
  
    
  }



  createChart(dataItem: any) {
    // Recreate canvas before creating a new chart
    this.recreateCanvas(dataItem.variable);

    // Get the new canvas element
    const canvas = document.getElementById(dataItem.variable) as HTMLCanvasElement;
    if (!canvas) {

      return;
    }

    // Get the 2D context
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Ensure previous chart instance is destroyed
    if (dataItem.chartInstance) {
      dataItem.chartInstance.destroy();
      dataItem.chartInstance = null; // Clear the reference
    }

    // Create new chart instance
    dataItem.chartInstance = new Chart(ctx, {
      type: dataItem.selectedType,
      data: {
        labels: Object.keys(dataItem.data),
        datasets: [{
          label: 'Channel Status',
          data: Object.values(dataItem.data),
        }]
      },
      options: {
        responsive: true,
        aspectRatio: 2,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  // Function to properly recreate the canvas element
  recreateCanvas(canvasId: string) {
    const oldCanvas = document.getElementById(canvasId);

    if (oldCanvas && oldCanvas.parentNode) {
      const parent = oldCanvas.parentNode;

      // Remove the old canvas
      parent.removeChild(oldCanvas);

      // Create a new canvas and append it
      const newCanvas = document.createElement('canvas');
      newCanvas.id = canvasId;
      parent.appendChild(newCanvas);
    }
  }


  updateChartTypef(dataItem: any, newType: string) {
    // Destroy the existing chart before updating
    if (dataItem.chartInstance) {
      dataItem.chartInstance.destroy();
      dataItem.chartInstance = null; // Clear reference
    }

    // Update chart type
    dataItem.selectedType = newType;

    // Recreate the chart with the new type
    this.createChart(dataItem);
  }
  
}


