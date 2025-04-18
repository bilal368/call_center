import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, Colors, registerables } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { AddDashboardDialogComponent } from '../shared/dialogComponents/add-dashboard-dialog/add-dashboard-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { DashboardService } from '../core/services/dashboard/dashboard.service';
import { LogoutSpinnerComponent } from '../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { AuthService } from '../core/services/authentication/auth.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
// import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DashboardLiveComponent } from "./dashboard-live/dashboard-live.component";
import { ReportdashboardComponent } from "./reportdashboard/reportdashboard.component";
import { NewdasbordComponent } from './newdasbord/newdasbord.component';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-call-recording',
  standalone: true,
  imports: [FormsModule, MatIconModule, CommonModule, TranslateModule, MatSelectModule, MatButtonModule, ReactiveFormsModule, MatTableModule, MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule, DashboardLiveComponent,NewdasbordComponent],
  providers: [DashboardService],
  templateUrl: './dashboard-call-recording.component.html',
  styleUrls: ['./dashboard-call-recording.component.css']
})
export class DashboardCallRecordingComponent implements OnInit, OnDestroy {
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
  callData: any = [

  ];

  labels: any = [];
  data: any = [];
  callDataTrafic: any = []
  labelscalltype: any = [];

  totalIncomingCallsData: any = [];
  totalOutgoingCallsData: any = [];
  totalAttendedCallsData: any = [];
  totalMissedCallsData: any = [];
  frequantCall: any = [];
  frequentLables: any = []
  frequentdatas: any = []
  currentcallLables: any = []
  maxConcurrentCalls: any = []
  peakTime: any = []
  peakOccurrences: any = []
  filterValueGraph: number = 1;
  body = { "date": "month" };
  startDate: any;
  endDate: any;
  currentCall: any = []
  // Define the columns to display in the table, including logoutTime
  displayedColumns: string[] = ['username', 'ipAddress', 'loginTime', 'statusCode'];
  displayedlogoutColumns: string[] = ['username', 'ipAddress', 'loginTime', 'logoutTime', 'statusCode'];


  // Initialize MatTableDataSource for active and recent users
  activeUsers = new MatTableDataSource<any>();
  recentUsers = new MatTableDataSource<any>();

  constructor(public dialog: MatDialog, private dashboardApi: DashboardService, private authService: AuthService,) { }

  ngOnInit(): void {
    // this.fetchChannelStatus();
    this.fetchDashboardFeatures();
    
    this.fetchGraphData(this.body)
    this.selectedFilter = 'This Month'
    this.updateChartData();

  }


    // this.createdChart(result);
    // Update chart data and render the charts




  
  fetchGraphData(data: any) {

    this.dashboardApi.fetchDialyTrafficReport(data).subscribe((result: any) => {
      if (result.status == true) {
        this.callDataTrafic = result.callDataTrafic;

        this.callDataTrafic.forEach((item: any) => {
          this.labelscalltype.push(item.callDate); // Add the callDate to the labels array
          this.totalIncomingCallsData.push(parseInt(item.totalIncomingCalls)); // Add the totalIncomingCalls to its respective array
          this.totalOutgoingCallsData.push(parseInt(item.totalOutgoingCalls)); // Add the totalOutgoingCalls to its respective array
          this.totalAttendedCallsData.push(parseInt(item.totalAttendedCalls)); // Add the totalAttendedCalls to its respective array
          this.totalMissedCallsData.push(parseInt(item.totalMissedCalls)); // Add the totalMissedCalls to its respective array
        });

        this.frequantCall = result.frequentCall;
        this.frequantCall.forEach((element: any) => {
          this.frequentLables.push(element.customerNumber);
          this.frequentdatas.push(element.callCount)
        });

        this.currentCall = result.currentCall;
        this.currentCall.forEach((element: any) => {
          this.currentcallLables.push(element.callDate);
          this.maxConcurrentCalls.push(element.maxConcurrentCalls);
          this.peakTime.push(element.peakTime)
          this.peakOccurrences.push(element.peakOccurrences)

        });

        this.callData = result.callDataDaily
        this.callData.forEach((element: any) => {
          this.labels.push(element.callDate);
          this.data.push(element.numberOfCalls)
          this.loading = false
          setTimeout(() => {
            this.updateChartData();
            this.loading = true;

          }, 2000);
          // this.loading = true;

        });
        console.log(this.currentCall);









      } else {
        // this.callData = []
        // this.frequantCall = []
        // this.callDataTrafic = []
        // this.labelscalltype = []
        // this.totalIncomingCallsData = []
        // this.totalOutgoingCallsData = []
        // this.totalAttendedCallsData = []
        // this.totalMissedCallsData = []
        // this.frequentLables = []
        // this.frequentdatas = []
        // this.labels = []
        // this.data = []

        // this.loading = true;
      }
    }, (error: any) => {
      this.loading = false;
      setTimeout(() => {


        this.loading = true;


        this.charts.forEach(chart => chart.destroy());
      }, 2000);
      console.log(error);



    }
    )
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
      },
      (error) => {
        if (error.status === 403 || error.status === 401) {
          this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true });
        }
      }
    );
  }

  // Fetch Active and Recent Users
 

  // Method to update chart data after API response
  updateChartData(): void {
    this.chartsData.forEach((chartData, index) => {
      if (chartData.name === 'Channel Status') {
        chartData.datasets[0].data = [
          this.idleConnect,
          this.onLine,
          this.disconnected,
          this.offData
        ];
      }

      this.renderChart(index);
    });
  }
  // Remove Chart
  ngOnDestroy(): void {
    this.charts.forEach(chart => chart.destroy()); // Destroy all charts when component is destroyed
  }
  // Open Dialog
  openDialog(): void {
    const dialogRef = this.dialog.open(AddDashboardDialogComponent, {
      width: '30%',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createdChart(result);
        // Update chart data and render the charts
        this.updateChartData();
      }
    });
  }



  createdChart(result: { selectedItems: any[]; }) {
    const colorPalette = {
      idleConnect: 'red',
      onLine: 'green',
      disconnected: 'blue',
      offData: 'yellow'
    };
    // Transform the selected items into chart data
    this.chartsData = result.selectedItems.filter((item: { selected: any; }) => item.selected).map((item: { name: any; }) => {
      let result;

      // Common chart data configuration for all chart types
      const commonChartData = {
        labels: ['Idle Connect', 'Online', 'Disconnected', 'Off Data'],
        datasets: [
          {
            label: item.name,
            data: [
              this.idleConnect || 0,
              this.onLine || 0,
              this.disconnected || 0,
              this.offData || 0
            ],
            backgroundColor: [
              colorPalette.idleConnect,
              colorPalette.onLine,
              colorPalette.disconnected,
              colorPalette.offData
            ],
            borderColor: 'var(--h3)',
            fill: false
          }
        ],
        legend: true
      };

      // Determine the chart type and create the chart data object
      if (item.name === 'Channel Status') {
        result = {
          name: item.name,
          chartType: 'line', // Set to line for example
          ...commonChartData
        };
      }
      if (item.name == 'Daily Call Traffic') {
        result = {
          name: 'Daily Call Traffic',
          chartType: 'bar', // Default chart type
          labels: this.labels,
          datasets: [
            {
              label: 'Daily Call Traffic',
              data: this.data,
              borderColor: 'var(--h3)', // Replace with your desired color
              backgroundColor: 'rgba(135, 206, 235, 0.5)', // Example background color
              fill: true
            }
          ],
          legend: true,




        };
      }
      if (item.name == 'Station Time Activity') {
        result = {
          name: item.name,
          chartType: 'bar', // Default chart type
          labels: ['Idle Connect', 'Online', 'Disconnected', 'Off Data'],
          datasets: [
            {
              label: item.name,
              data: [
                this.idleConnect || 0,
                this.onLine || 0,
                this.disconnected || 0,
                this.offData || 0
              ],
              borderColor: 'var(--h3)',
              fill: false
            }
          ],
          legend: true
        };
      }
      if (item.name == 'Station Call Activity') {
        result = {
          name: item.name,
          chartType: 'bar', // Default chart type
          labels: ['Idle Connect', 'Online', 'Disconnected', 'Off Data'],
          datasets: [
            {
              label: item.name,
              data: [
                this.idleConnect || 0,
                this.onLine || 0,
                this.disconnected || 0,
                this.offData || 0
              ],
              borderColor: 'var(--h3)',
              fill: false
            }
          ],
          legend: true
        };
      }
      if (item.name == 'Frequent Call') {
        result = {
          name: 'Frequent Call',
          chartType: 'bar', // Default chart type
          labels: this.frequentLables,
          datasets: [
            {
              label: 'Frequent Call',
              data: this.frequentdatas,
              borderColor: 'var(--h3)', // Replace with your desired color
              backgroundColor: 'rgba(135, 206, 235, 0.5)', // Example background color
              fill: true
            }
          ],
          legend: true,




        };
      }
      if (item.name == 'Call Type Traffic') {
        result = {
          name: 'Call Type Traffic',
          chartType: 'bar', // Default chart type
          labels: this.labelscalltype,

          datasets: [
            {
              label: 'Total Incoming Calls',
              data: this.totalIncomingCallsData, // Y-axis data for total incoming calls
              // borderColor: 'rgba(54, 162, 235, 1)', // Customize the color
              backgroundColor: 'red', // Customize the background color
              fill: true
            },
            {
              label: 'Total Outgoing Calls',
              data: this.totalOutgoingCallsData, // Y-axis data for total outgoing calls
              // borderColor: 'rgba(255, 99, 132, 1)', // Customize the color
              backgroundColor: 'green', // Customize the background color
              fill: true
            },
            {
              label: 'Total Attended Calls',
              data: this.totalAttendedCallsData, // Y-axis data for total attended calls
              // borderColor: 'rgba(75, 192, 192, 1)', // Customize the color
              backgroundColor: 'yellow', // Customize the background color
              fill: true
            },
            {
              label: 'Total Missed Calls',
              data: this.totalMissedCallsData, // Y-axis data for total missed calls
              // borderColor: 'rgba(255, 206, 86, 1)', // Customize the color
              backgroundColor: 'orange', // Customize the background color
              fill: true
            }
          ],
          legend: true,




        };
      }
      if (item.name == 'Concurrent Call Data') {
        result = {
          name: item.name,
          chartType: 'bar', // Default chart type
          labels: this.peakTime,
          datasets: [
            {
              label: 'Max Concurrent Calls/Date',
              data: this.maxConcurrentCalls,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            },
            {
              label: 'Peak Occurrences/Time',
              data: this.peakOccurrences,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
            },

          ],
          legend: true,

        };

      }

      if (item.name == 'Agent Time Activity') {
        result = {
          name: item.name,
          chartType: 'bar', // Default chart type
          labels: ['Idle Connect', 'Online', 'Disconnected', 'Off Data'],
          datasets: [
            {
              label: item.name,
              data: [
                this.idleConnect || 0,
                this.onLine || 0,
                this.disconnected || 0,
                this.offData || 0
              ],
              borderColor: 'var(--h3)',
              fill: false
            }
          ],
          legend: true
        };
      }
      if (item.name == 'Agent Call Activity') {
        result = {
          name: item.name,
          chartType: 'bar', // Default chart type
          labels: ['Idle Connect', 'Online', 'Disconnected', 'Off Data'],
          datasets: [
            {
              label: item.name,
              data: [
                this.idleConnect || 0,
                this.onLine || 0,
                this.disconnected || 0,
                this.offData || 0
              ],
              borderColor: 'var(--h3)',
              fill: false
            }
          ],
          legend: true
        };
      }
      if (item.name == 'Active Users') {
        result = {
          name: item.name,
          chartType: 'bar', // Default chart type
          labels: ['Idle Connect', 'Online', 'Disconnected', 'Off Data'],
          datasets: [
            {
              label: item.name,
              data: [
                this.idleConnect || 0,
                this.onLine || 0,
                this.disconnected || 0,
                this.offData || 0
              ],
              borderColor: 'var(--h3)',
              fill: false
            }
          ],
          legend: true
        };
      }
      if (item.name == 'Recent Users') {
        result = {
          name: item.name,
          chartType: 'bar', // Default chart type
          labels: ['Idle Connect', 'Online', 'Disconnected', 'Off Data'],
          datasets: [
            {
              label: item.name,
              data: [
                this.idleConnect || 0,
                this.onLine || 0,
                this.disconnected || 0,
                this.offData || 0
              ],
              borderColor: 'var(--h3)',
              fill: false
            }
          ],
          legend: true
        };
      }
      return result
    });
  }
  // Render the chart
  renderChart(index: number): void {

    // console.log("index", index);

    // console.log(this.chartsData);

    const chartData = this.chartsData[index];
    setTimeout(() => {
      const canvas = document.getElementById(`chart${index}`) as HTMLCanvasElement | null;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Destroy existing chart if it exists
          const existingChart = this.charts[index];
          if (existingChart) {
            existingChart.destroy();
          }

          // Get the maximum data value for the y-axis
          const maxDataValue = Math.max(...chartData.datasets[0].data, 0); // Ensure we consider 0 for empty datasets

          // Define color palettes for pie charts
          const colors = ['red', 'green', 'blue', 'orange', 'purple', 'yellow'];

          // Check if the chart is of type 'pie', and assign colors to each slice
          // if (chartData.chartType === 'pie' || ) {
          chartData.datasets[0].backgroundColor = colors.slice(0, chartData.datasets[0].data.length);
          // }

          const chartConfig: ChartConfiguration = {
            type: chartData.chartType,
            data: {
              labels: chartData.labels,
              datasets: chartData.datasets
            },
            options: {
              aspectRatio: 2,
              plugins: {
                legend: {
                  display: chartData.legend
                }
              },
              scales: {
                x: chartData.chartType !== 'pie' ? {


                  title: {
                    display: true,
                    text: chartData.name === 'Daily Call Traffic' ? 'Date' : chartData.name === 'Call Type Traffic' ? 'Date' : chartData.name == 'Frequent Call' ? 'CustomerNumber' : 'No'
                  },
                  grid: {
                    display: true
                  }
                } : undefined, // Remove x-axis for pie charts
                y: chartData.chartType !== 'pie' ? {
                  title: {
                    display: true,
                    text: chartData.name == 'Daily Call Traffic' ? 'Number of Calls' : chartData.name === 'Call Type Traffic' ? 'Number of Calls' : chartData.name == 'Frequent Call' ? 'Count' : 'No',
                  },
                  min: 0,
                  max: maxDataValue + 25, // Add some padding to the max value
                  ticks: {
                    stepSize: 25 // Adjust the steps for the y-axis
                  }
                } : undefined // Remove y-axis for pie charts
              }
            }
          };

          const newChart = new Chart(ctx, chartConfig);
          this.charts[index] = newChart; // Store chart instance in array
        }
      }
    }, 100);
  }

  // Update chart type
  updateChartType(type: 'bar' | 'line' | 'pie', index: number): void {
    this.chartsData[index].chartType = type;
    this.renderChart(index);
  }
  // Close button
  removeChart(index: number, chartData: any): void {
    // Remove the chart data from the chartsData array
    this.chartsData.splice(index, 1);

    // Render the updated chart data
    // this.updateChartData();
  }

  // Fetch Dashboard Features and generate default charts
  fetchDashboardFeatures(): void {

    this.dashboardApi.fetchDashboardFeatures(this.authService.extractDataFromToken(localStorage.getItem('token')).userId).subscribe(
      (res: any) => {
        if (res.status) {
          // Process the selected dashboard features to pre-populate the chart
          const selectedItems = res.dashboardFeatures
            .filter((feature: any) => feature.userFeatureActive === 1)
            .map((feature: any) => ({
              name: feature.dashboardFeatureName,
              selected: true
            }));

          // Create charts based on the fetched dashboard features
          this.createdChart({ selectedItems });

          // this.updateChartData();
          // Update chart data and render the charts
          this.updateChartData();
        }
      },
      (error) => {
        if (error.status === 403 || error.status === 401) {
          this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } ,disableClose:true});
        }
      }
    );
  }
  divFunction(arg: string) {
    // this.updateChartData();
    this.buildDiv = arg
    // console.log(this.selectedOption, 'selected');

  }
  dropDownChange(value: any) {
    this.callData = []
    this.frequantCall = []
    this.callDataTrafic = []
    this.labelscalltype = []
    this.totalIncomingCallsData = []
    this.totalOutgoingCallsData = []
    this.totalAttendedCallsData = []
    this.totalMissedCallsData = []
    this.frequentLables = []
    this.frequentdatas = []
    this.labels = []
    this.data = []
    this.currentcallLables = []
    this.maxConcurrentCalls = []
    this.peakTime = []
    this.peakOccurrences = []
    this.filterValueGraph = value

    this.getFillterData(this.filterValueGraph)

    this.fetchGraphData(this.body)
    // this.charts.forEach(chart => chart.destroy());
  }
  getFillterData(filterValueGraph: any) {



    switch (filterValueGraph) {
      case "1":
        this.body = { "date": "today" };
        break;
      case "2":
        this.body = { "date": "week" };
        break;
      case "3":
        this.body = { "date": "month" };
        break;
      case "4":
        this.body = { "date": "year" };
        break;

      default:
        // Handle unexpected filterValueGraph values
        console.error("Invalid filterValueGraph:", this.filterValueGraph);
        break;
    }

  }
  onDateChange(event: any) {
    const startDate = event.source.start;
    const endDate = event.source.end;

    console.log("Start date:", event.source.start);
    console.log("End date:", endDate);
  }

}
