
import { Component, OnInit, OnDestroy, NgModule } from '@angular/core';
import { FormControl, FormGroup, FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, Colors, registerables } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { MatDialog } from '@angular/material/dialog';
import { DashboardService } from '../../core/services/dashboard/dashboard.service';
import { AuthService } from '../../core/services/authentication/auth.service';
import { AddDashboardDialogComponent } from '../../shared/dialogComponents/add-dashboard-dialog/add-dashboard-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { CustomDateComponent } from '../../shared/dialogComponents/custom-date/custom-date.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { switchMap } from 'rxjs';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts';
Chart.register(...registerables);
@Component({
  selector: 'app-reportdashboard',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatMenuModule, CommonModule, TranslateModule, MatSelectModule, MatButtonModule, ReactiveFormsModule, MatNativeDateModule, MatProgressSpinnerModule, MatDatepickerModule,HighchartsChartModule],
  templateUrl: './reportdashboard.component.html',
  styleUrl: './reportdashboard.component.css',
  providers: [DashboardService, DatePipe],
})
export class ReportdashboardComponent implements OnInit, OnDestroy {

  disconnected: number = 0;
  idleConnect: number = 0;
  offData: number = 0;
  onLine: number = 0;
  private charts: Chart[] = [];
  public chartsData: any[] = []; // Initialize as an empty array
  userId: any;
  dashboardItems: { name: string, selected: boolean }[] = [];
  buildDiv: string = 'live';
  selectedFilter: any = ''
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  loading: boolean = true;
  callData: any = [];
  agentTimeData: any = [];
  agentCallData: any = [];
  channelBusyTimeData: any = [];
  channelIdelTimeData: any = [];
  totalCalls: any = [];
  labels: any = [];
  channelTimelabels: any = [];
  channelCalllabels: any = [];
  agentTimelabels: any = [];
  agentCalllabels: any = [];
  data: any = [];
  callDataTrafic: any = [];
  labelscalltype: any = [];
  channelTime: any = [];
  channelCall: any = [];
  channelAgentTime: any = [];
  channelAgentCall: any = [];

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
  body: any = { "date": "today" };
  startDate: any;
  endDate: any;
  currentCall: any = []
  // Define the columns to display in the table, including logoutTime
  displayedColumns: string[] = ['username', 'ipAddress', 'loginTime', 'statusCode'];
  displayedlogoutColumns: string[] = ['username', 'ipAddress', 'loginTime', 'logoutTime', 'statusCode'];


  // Initialize MatTableDataSource for active and recent users
  activeUsers = new MatTableDataSource<any>();
  recentUsers = new MatTableDataSource<any>();
  customFromDate: Date | null = null;
  customToDate: Date | null = null;
  startDateTime: any;
  endDateTime: any;


  constructor(public dialog: MatDialog, private dashboardApi: DashboardService,
    private authService: AuthService, private datePipe: DatePipe) {
  }


  ngOnInit(): void {
    // this.fetchChannelStatus();
    this.fetchDashboardFeatures();

    this.fetchGraphData(this.body);
    this.selectedFilter = 'Today';

  }
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {
    title: {
      text: 'Sample Chart'
    },
    xAxis: {
      categories: ['A', 'B', 'C']
    },
    series: [
      {
        type: 'line',
        name: 'Data',
        data: [1, 2, 3]
      }
    ],
    credits: {
      enabled: false // Disable the watermark
    }
  };

  // Function to convert HH:MM:SS to decimal hours
  convertToDecimalHours(time: string): number {
    if (time != null) {
      const parts = time.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseInt(parts[2], 10);

      // Convert time to hours
      return hours + minutes / 60 + seconds / 3600;
    }
    return 0;
  }
  // Fetch Agent Call Activity
  // fetchAgentCall(data: any) {
  //   const userId = this.authService.extractDataFromToken(localStorage.getItem('token')).userId;
  //   this.dashboardApi.fetchAgentCall(data, userId).subscribe((result: any) => {
  //     if (result.status == true) {

  //       this.channelAgentCall = result.channelCall;
  //       this.channelAgentCall.forEach((element: any) => {
  //         this.agentCalllabels.push(element.agentCode);

  //         // Convert busyTime and idleTime to hours
  //         const totalCalls = element.totalCalls;

  //         // Push the busy time (you can also plot idle time in another dataset if needed)
  //         this.agentCallData.push(totalCalls);

  //         this.loading = false;
  //         setTimeout(() => {
  //           this.updateChartData();
  //           this.loading = true;
  //         }, 2000);
  //       });
  //     } else {
  //       // Handle error or invalid result
  //       this.loading = true;
  //     }
  //   }, (error: any) => {
  //     this.loading = false;
  //     setTimeout(() => {
  //       this.loading = true;
  //       this.charts.forEach(chart => chart.destroy());
  //     }, 2000);
  //     console.log(error);
  //   });
  // }
  // Fetch Agent Time
  // fetchAgentTime(data: any) {
  //   const userId = this.authService.extractDataFromToken(localStorage.getItem('token')).userId;
  //   this.dashboardApi.fetchAgentTime(data, userId).subscribe((result: any) => {
  //     if (result.status == true) {
  //       this.channelAgentTime = result.channelCall;
  //       this.channelAgentTime.forEach((element: any) => {
  //         this.agentTimelabels.push(element.agentCode);

  //         // Convert busyTime and idleTime to hours
  //         const agentTimeInHours = this.convertToDecimalHours(element.duration);

  //         // Push the busy time (you can also plot idle time in another dataset if needed)
  //         this.agentTimeData.push(agentTimeInHours);

  //         this.loading = false;
  //         setTimeout(() => {
  //           this.updateChartData();
  //           this.loading = true;
  //         }, 2000);
  //       });
  //     } else {
  //       // Handle error or invalid result
  //       this.loading = true;
  //     }
  //   }, (error: any) => {
  //     this.loading = false;
  //     setTimeout(() => {
  //       this.loading = true;
  //       this.charts.forEach(chart => chart.destroy());
  //     }, 2000);
  //     console.log(error);
  //   });
  // }
  // Fetch Time Status
  // fetchChannelTimeStatus(data: any) {
  //   const userId = this.authService.extractDataFromToken(localStorage.getItem('token')).userId;
  //   this.dashboardApi.fetchChannelTimeReport(data, userId).subscribe((result: any) => {
  //     if (result.status == true) {

  //       this.channelTime = result.channelTime;

  //       this.channelTime.forEach((element: any) => {
  //         this.channelTimelabels.push(element.extensionNumber);

  //         // Convert busyTime and idleTime to hours
  //         const busyTimeInHours = this.convertToDecimalHours(element.busyTime);
  //         const idleTimeInHours = this.convertToDecimalHours(element.idleTime);

  //         // Push the busy time (you can also plot idle time in another dataset if needed)
  //         this.channelBusyTimeData.push(busyTimeInHours);
  //         this.channelIdelTimeData.push(idleTimeInHours);

  //         this.loading = false;
  //         setTimeout(() => {
  //           this.updateChartData();
  //           this.loading = true;
  //         }, 2000);
  //       });
  //     } else {
  //       // Handle error or invalid result
  //       this.loading = true;
  //     }
  //   }, (error: any) => {
  //     this.loading = false;
  //     setTimeout(() => {
  //       this.loading = true;
  //       this.charts.forEach(chart => chart.destroy());
  //     }, 2000);
  //     console.log(error);
  //   });
  // }
  // Fetch Call Status
  // fetchChannelCallStatus(data: any) {
  //   const userId = this.authService.extractDataFromToken(localStorage.getItem('token')).userId;
  //   this.dashboardApi.fetchChannelCallReport(data, userId).subscribe((result: any) => {
  //     if (result.status == true) {

  //       this.channelCall = result.channelCall;

  //       this.channelCall.forEach((element: any) => {
  //         this.channelCalllabels.push(element.extensionNumber);

  //         // Push the busy time (you can also plot idle time in another dataset if needed)
  //         this.totalCalls.push(element.totalCalls);

  //         this.loading = false;
  //         setTimeout(() => {
  //           this.updateChartData();
  //           this.loading = true;
  //         }, 2000);
  //       });
  //     } else {
  //       // Handle error or invalid result
  //       this.loading = true;
  //     }
  //   }, (error: any) => {
  //     this.loading = false;
  //     setTimeout(() => {
  //       this.loading = true;
  //       this.charts.forEach(chart => chart.destroy());
  //     }, 2000);
  //     console.log(error);
  //   });
  // }


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
          this.peakTime.push(element.peakTime.split('/')[0])
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
    // fetchFilterAgentSettings
    let agentdetails: any = null;

    // First API call
    this.dashboardApi.fetchFilterAgentSettings(this.authService.extractDataFromToken(localStorage.getItem('token')).userId)
      .pipe(
        // Use switchMap to handle the next API call after the first one completes
        switchMap((res: any) => {
          agentdetails = res.data;
          // Call the second API after the first one completes
          return this.dashboardApi.fetchFilterSettingsDetails(this.authService.extractDataFromToken(localStorage.getItem('token')).userId);
        })
      )
      .subscribe(
        (res: any) => {
          if (res.data[0].length > 0) {
            const filterdata = res.data[0];
            const dialogRef = this.dialog.open(AddDashboardDialogComponent, {
              width: '30%',
              data: { filterdata, agentdetails }
            });

            dialogRef.afterClosed().subscribe(result => {
              if (result) {
                this.createdChart(result);
                // Update chart data and render the charts
                this.updateChartData();
              }
            });
          } else {
            const dialogRef = this.dialog.open(AddDashboardDialogComponent, {
              width: '30%',
              data: { agentdetails } // Passing only agent details since filterdata is not available
            });

            dialogRef.afterClosed().subscribe(result => {
              if (result) {
                this.createdChart(result);
                // Update chart data and render the charts
                this.updateChartData();
              }
            });
          }
        },
        (error) => {
          if (error.status === 403 || error.status === 401) {
            this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true });
          } else if (error.status === 404) {
            const dialogRef = this.dialog.open(AddDashboardDialogComponent, {
              width: '30%',
              data: { agentdetails } // In case of 404, show the dialog with agentdetails
            });

            dialogRef.afterClosed().subscribe(result => {
              if (result) {
                this.createdChart(result);
                // Update chart data and render the charts
                this.updateChartData();
              }
            });
          }
        }
      );
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
      const channelChartData = {
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
          ...channelChartData
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
          labels: this.channelTimelabels,
          datasets: [
            {
              label: 'Busy Time',
              data: this.channelBusyTimeData, // Busy time data for each extension
              backgroundColor: 'blue', // Single color for all extensions
              fill: false
            },
            {
              label: 'Idle Time',
              data: this.channelIdelTimeData, // Y-axis data for total outgoing calls
              // borderColor: 'rgba(255, 99, 132, 1)', // Customize the color
              backgroundColor: 'yellow', // Customize the background color
              fill: true
            },
          ],
          legend: true
        };
      }
      if (item.name == 'Station Call Activity') {
        result = {
          name: item.name,
          chartType: 'bar', // Default chart type
          labels: this.channelCalllabels,
          datasets: [
            {
              label: "Number of calls",
              data: this.totalCalls,
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
          legend: true
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
          labels: this.agentTimelabels,
          datasets: [
            {
              label: 'Duration',
              data: this.agentTimeData, // Busy time data for each extension
              backgroundColor: 'blue', // Single color for all extensions
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
          labels: this.agentCalllabels,
          datasets: [
            {
              label: "Number of calls",
              data: this.agentCallData, // Busy time data for each extension
              backgroundColor: 'blue', // Single color for all extensions
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
          let colors

          if (this.chartsData[index].name == 'Station Time Activity' || this.chartsData[index].name == 'Station Call Activity') {
            colors = ['gray']
          } else {
            colors = ['red', 'green', 'blue', 'orange', 'purple', 'yellow'];
          }

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
                    text: chartData.name === 'Daily Call Traffic' ? 'Date' : chartData.name === 'Call Type Traffic' ? 'Date' : chartData.name == 'Frequent Call' ? 'Customer Number' : chartData.name == 'Station Call Activity' ? 'Stations' : chartData.name === 'Station Time Activity' ? 'Stations' : chartData.name === 'Agent Time Activity' ? 'Agents' : chartData.name === 'Agent Call Activity' ? 'Agents' : chartData.name === 'Concurrent Call Data' ? 'Date' : 'No'
                  },
                  grid: {
                    display: true
                  }
                } : undefined, // Remove x-axis for pie charts
                y: chartData.chartType !== 'pie' ? {
                  title: {
                    display: true,
                    text: chartData.name == 'Daily Call Traffic' ? 'Number of Calls' : chartData.name === 'Call Type Traffic' ? 'Number of Calls' : chartData.name == 'Frequent Call' ? 'Number of Calls' : chartData.name == 'Station Call Activity' ? 'Number of calls' : chartData.name === 'Station Time Activity' ? 'Time (hrs)' : chartData.name === 'Agent Time Activity' ? 'Duration (hrs)' : chartData.name === 'Agent Call Activity' ? 'Number of calls' : chartData.name === 'Concurrent Call Data' ? 'Number of calls' : 'No',
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


    const userId = this.authService.extractDataFromToken(localStorage.getItem('token')).userId
    this.dashboardApi.removeUpdateDashboardFeatures(userId, chartData.name).subscribe(
      (res: any) => {
        if (res.status) {
          console.log("Updated successfully");
        }
      },
      (error) => {
        if (error.status === 403 || error.status === 401) {
          this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true });
        }
      }
    );

    // Render the updated chart data
    this.updateChartData();
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
          this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' },disableClose:true });
        }
      }
    );
  }
  divFunction(arg: string) {
    this.updateChartData();
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
    // this.fetchChannelTimeStatus(this.body)
    // this.charts.forEach(chart => chart.destroy());
  }
  getFillterData(filterValueGraph: any) {



    switch (filterValueGraph) {
      case "1":
        this.body = { "date": "today" };
        this.startDateTime = ''
        this.endDateTime = ''
        break;
      case "2":
        this.body = { "date": "week" };
        this.startDateTime = ''
        this.endDateTime = ''
        break;
      case "3":
        this.body = { "date": "month" };
        this.startDateTime = ''
        this.endDateTime = ''
        break;
      case "4":
        this.body = { "date": "year" };
        this.startDateTime = ''
        this.endDateTime = ''
        break;
      case "5":
        this.openCustomDateDialog()
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
  openCustomDateDialog() {
    const currentDate = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(currentDate.getMonth() + 1);
    const startDate = this.formatDate(currentDate);
    const endDate = this.formatDate(oneMonthFromNow);
    let dialogRef: any;
    setTimeout(() => {
      dialogRef = this.dialog.open(CustomDateComponent, {
        minWidth: '300px', height: '245px',
        data: {
          fromDate: this.customFromDate || startDate,
          toDate: this.customToDate || endDate
        }
      });
      dialogRef.afterClosed().subscribe((result: { fromDate: Date | null; toDate: Date | null; }) => {
        if (result) {
          this.customFromDate = result.fromDate;
          this.customToDate = result.toDate;

          // Fallback to current date if fromDate or toDate is null
          const customFromDate = this.customFromDate ? new Date(this.customFromDate) : new Date();
          const customToDate = this.customToDate ? new Date(this.customToDate) : new Date();

          // this.selectedDateRange = `${this.formatDate(customFromDate)} to ${this.formatDate(customToDate)}`;

          this.startDateTime = customFromDate.toISOString().split('T')[0] + ' ' + '00:00:00';
          this.endDateTime = customToDate.toISOString().split('T')[0] + ' ' + '23:59:59';
          this.body = {
            "date": 'custom',
            "startDate": this.startDateTime,
            "endDate": this.endDateTime
          }
          this.fetchGraphData(this.body)
          this.selectedFilter = 'Custom'
          // this.callFilter.inCallStartDateTime = startDateTime;
          // this.callFilter.inCallEndDateTime = endDateTime;
        }
      });
    }, 500);
  }

  formatDate(date: Date | null): string {
    return date ? this.datePipe.transform(date, 'dd-MM-yyyy') || '' : '';
  }

}
