import { ChangeDetectorRef, Component, OnInit, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DashboardService } from '../../core/services/dashboard/dashboard.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/authentication/auth.service';
import { switchMap } from 'rxjs';
import { AddDashboardDialogComponent } from '../../shared/dialogComponents/add-dashboard-dialog/add-dashboard-dialog.component';
import { LogoutSpinnerComponent } from '../../shared/dialogComponents/logout-spinner/logout-spinner.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


@Component({
  selector: 'app-newdasbord',
  standalone: true,
  imports: [MatIconModule, TranslateModule, CommonModule, FormsModule, MatIconModule, MatMenuModule, CommonModule, TranslateModule,
    MatSelectModule, MatButtonModule, ReactiveFormsModule, MatNativeDateModule, MatDatepickerModule, MatButtonToggleModule],
  templateUrl: './newdasbord.component.html',
  styleUrl: './newdasbord.component.css',
  providers: [DashboardService, DatePipe],
})
export class NewdasbordComponent implements OnInit, AfterViewInit {
  private destroy$ = new Subject<void>();
  filterValueGraph: number = 1;
  userId = this.authService.extractDataFromToken(localStorage.getItem('token')).userId;
  body: any = { "date": "today", "userId": this.userId, "sort": 'ASC' };
  ziptrunRecorderDashbord: any = false
  listdashbordwidget: any = [
    { id: 1, name: 'stationTime' },
    { id: 2, name: 'stationcallActivity' },
    { id: 4, name: 'frequentCall' },
    { id: 5, name: 'callTypeTraffic' },
    { id: 6, name: 'concurrentCallData' },
    { id: 7, name: 'agentTimeActivity' },
    { id: 8, name: 'agentCallActivity' },
    { id: 9, name: 'dailyCallTraffic' }
  ]
  commonValues: any
  constructor(public dialog: MatDialog, private dashboardApi: DashboardService,
    private authService: AuthService, private datePipe: DatePipe) {
  }
  ngAfterViewInit(): void {
    this.fetchsiptrunkeonedata()
  }
  // chartOptions1: any;
  selectedFilter: any = ''
  ngOnInit(): void {
    this.fecthsettings()
    this.fetchlicenseZiptrunk()
    // this.fetchsiptrunkeonedata()
  }

  ngOnDestroy() {
    this.stationtimeActivity.forEach((chartData: any) => {
      if (chartData.chart && chartData.chart instanceof Chart) {
        chartData.chart.destroy();
        chartData.chart = null;
      }
    });
  }

  dropDownChange(value: any) {
    this.getFillterData(value)
  }

  fecthsettings() {

    this.dashboardApi.fetchgeneralsetting().subscribe((result: any) => {
      const ids = result.data.map((item: any) => item.callRecordingDashboardFeatureId);
      this.commonValues = this.listdashbordwidget.filter((item: any) => ids.includes(item.id));
      this.commonValues.forEach((data: any) => {
        switch (data.name) {
          case 'stationTime':
            this.fetchChannelTimeReport();
            break;
          case 'stationcallActivity':
            this.fetchChannelCallReport();
            break;
          case 'frequentCall':
            this.fetchfrequantCall();
            break;
          case 'callTypeTraffic':
            this.calltypeTraffic();
            break;
          case 'concurrentCallData':
            this.concurrentData();
            break;
          case 'agentTimeActivity':
            this.fetchAgentTime();
            break;
          case 'agentCallActivity':
            this.fetchAgentCall();
            break;
          case 'dailyCallTraffic':
            this.fetchDialyTrafficReport();
            break;
          default:
            console.warn('No matching case found for:', data.name);
        }
      });
    })
  }

  stationtimeActivity: any = []
  fetchChannelTimeReport() {
    this.stationtimeActivity = []
    this.dashboardApi.fetchChannelTimeReport(this.body).subscribe((res: any) => {


      this.stationtimeActivity.push({ data: res.channelTime, type: ['bar', 'line'], variable: 'stationTime' })

      setTimeout(() => {
        this.stationtimeActivitydata()
      }, 500)



    })
  }
  stationcallActivty: any = []
  fetchChannelCallReport() {
    this.stationcallActivty = []
    this.dashboardApi.fetchChannelCallReport(this.body).subscribe((res: any) => {

      this.stationcallActivty.push({ data: res.channelCall, type: ['bar', 'line'], variable: 'stationcallActivity' })

      setTimeout(() => {
        this.StationCallActiviychart()
      }, 1000)
    })
  }
  frequantCall: any = []
  fetchfrequantCall() {
    this.frequantCall = []
    this.dashboardApi.fetchfrequantCall(this.body).subscribe((res: any) => {

      this.frequantCall.push({ data: res.data, type: ['bar', 'line', 'pie'], variable: 'frequentCall' })

      setTimeout(() => {
        this.frequanctCallChart()
      }, 1000)
    })
  }
  dailytrafficData: any = []
  fetchDialyTrafficReport() {
    this.dailytrafficData = []
    this.dashboardApi.fetchDialyTrafficReport(this.body).subscribe((res: any) => {

      this.dailytrafficData.push({ data: res.callDataDaily, type: ['bar', 'line'], variable: 'dailyCallTraffic' })

      setTimeout(() => {
        this.dailyTraficChart()
      }, 1000)
    })
  }
  calltypetraffic: any = []
  calltypeTraffic() {
    this.calltypetraffic = []
    this.dashboardApi.calltypeTraffic(this.body).subscribe((res: any) => {

      this.calltypetraffic.push({ data: res.data, type: ['bar', 'line'], variable: 'callTypeTraffic' })

      setTimeout(() => {
        this.calltypeTraficchart()
      }, 1000)

    })
  }
  agentCallActivity: any = []
  fetchAgentCall() {
    this.agentCallActivity = []
    this.dashboardApi.fetchAgentCall(this.body).subscribe((res: any) => {

      this.agentCallActivity.push({ data: res.channelCall, type: ['bar', 'line'], variable: 'agentCallActivity' })

      setTimeout(() => {
        this.chart()
      }, 500)

    })
  }
  currentData: any = []
  concurrentData() {
    this.currentData = []
    this.dashboardApi.concurrentData(this.body).subscribe((res: any) => {

      this.currentData.push({ data: res.data, type: ['bar', 'line'], variable: 'concurrentCallData' })

      setTimeout(() => {
        this.concurrentChart()
      }, 500)
    })
  }
  agenttimeActivity: any = []
  fetchAgentTime() {
    this.agenttimeActivity = []
    this.dashboardApi.fetchAgentTime(this.body).subscribe((res: any) => {

      this.agenttimeActivity.push({ data: res.channelCall, type: ['bar', 'line'], variable: 'agentTimeActivity' })



      setTimeout(() => {
        this.agenttimeActivityChart()
      }, 500)

    })

  }
  siptrunkEoneData: any = []
  fetchsiptrunkeonedata() {
    this.siptrunkEoneData = []
    this.dashboardApi.fetchsiptrunEone(this.body).subscribe((res: any) => {
      this.siptrunkEoneData.push({ data: res.data, type: ['bar', 'line'], variable: 'siptrunkData' })

      setTimeout(() => {
        this.siptrunkEonechart()
      }, 1000)  
    })
    
    
  }

  chart() {

    this.agentCallActivity.forEach((chartData: any) => {

      const keys = Object.keys(chartData.data)
      const datasetValues: any = []

      const canvas = document.getElementById(chartData.variable) as HTMLCanvasElement

      keys.forEach((data: any) => {
        datasetValues.push(chartData.data[data].totalCalls)
      })

      if (canvas) {
        if (chartData.chart instanceof Chart) {
          return chartData.chart.destroy();
        }
        chartData.chart = new Chart(canvas, {
          type: chartData.type[0], // Initial chart type
          data: {
            labels: keys,
            datasets: [{
              label: 'Total Calls',
              data: datasetValues,
              backgroundColor: '',
            }]
          },
          options: {
            aspectRatio: 2,
          }
        });
      }
    });
  }
  agenttimeActivityChart() {
    this.agenttimeActivity.forEach((chartData: any) => {

      const keys = Object.keys(chartData.data)


      const datasetValues: any = []

      const canvas = document.getElementById(chartData.variable) as HTMLCanvasElement

      keys.forEach((data: any) => {
        datasetValues.push(
          chartData.data[data].duration
            .split(':')
            .reduce((acc: number, time: string) => 60 * acc + +time, 0)
        );




      })

      if (canvas) {
        if (chartData.chart instanceof Chart) {
          return chartData.chart.destroy();
        }
        chartData.chart = new Chart(canvas, {
          type: chartData.type[0], // Initial chart type
          data: {
            labels: keys,
            datasets: [{
              label: 'Duration',
              data: datasetValues,
              backgroundColor: '',
            }]
          },
          options: {
            aspectRatio: 2,
          }
        });
      }
    });
  }

  chartChange(data: any, type: any) {
    const currentChart = data.data

    const keys = Object.keys(currentChart)
    const datasetValues: any = []

    keys.forEach((data: any) => {
      datasetValues.push(currentChart[data].totalCalls)
    })

    if (data.chart) {
      data.chart.destroy(); // Destroy the existing chart instance
    }

    data.chart = new Chart(data.variable, {
      type: type,
      data: {
        labels: keys,
        datasets: [
          {
            label: 'Total Calls',
            data: datasetValues,
            backgroundColor: ''
          },
        ],
      },
      options: {
        aspectRatio: 2,
      },
    });
  }
  chartChangeagenttime(data: any, type: any) {


    const currentChart = data.data
    const keys = Object.keys(currentChart)
    const datasetValues: any = []

    keys.forEach((data: any) => {

      datasetValues.push(
        currentChart[data].duration
          .split(':')
          .reduce((acc: number, time: string) => 60 * acc + +time, 0)
      );
    })


    if (data.chart) {
      data.chart.destroy(); // Destroy the existing chart instance
    }

    data.chart = new Chart(data.variable, {
      type: type,
      data: {
        labels: keys,
        datasets: [
          {
            label: 'Duration',
            data: datasetValues,
            backgroundColor: ''
          },
        ],
      },
      options: {
        aspectRatio: 2,
      },
    });
  }
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
              if (result.status) {

                this.fecthsettings()


              }
            });
          } else {
            const dialogRef = this.dialog.open(AddDashboardDialogComponent, {
              width: '30%',
              data: { agentdetails } // Passing only agent details since filterdata is not available
            });

            dialogRef.afterClosed().subscribe(result => {
              if (result) {

              }
            });
          }
        },
        (error) => {
          if (error.status === 403 || error.status === 401) {
            this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' }, disableClose: true });
          } else if (error.status === 404) {
            const dialogRef = this.dialog.open(AddDashboardDialogComponent, {
              width: '30%',
              data: { agentdetails } // In case of 404, show the dialog with agentdetails
            });

            dialogRef.afterClosed().subscribe(result => {
              if (result.status) {

                this.fecthsettings()


              }
            });
          }
        }
      );
  }

  getFillterData(filterValueGraph: any) {

    switch (filterValueGraph) {
      case "1":
        this.body = { "date": "today", userId: this.userId, "sort": 'ASC' };
        this.fecthsettings();
        this.fetchsiptrunkeonedata()
        // this.startDateTime = ''
        // this.endDateTime = ''
        break;
      case "2":
        this.body = { "date": "week", userId: this.userId, "sort": 'ASC' };
        this.fecthsettings()
        this.fetchsiptrunkeonedata()
        // this.startDateTime = ''
        // this.endDateTime = ''
        break;
      case "3":
        this.body = { "date": "month", userId: this.userId, "sort": 'ASC' };
        this.fecthsettings()
        this.fetchsiptrunkeonedata()
        // this.startDateTime = ''
        // this.endDateTime = ''
        break;
      case "4":
        this.body = { "date": "year", userId: this.userId, "sort": 'ASC' };
        this.fecthsettings()
        this.fetchsiptrunkeonedata()
        // this.startDateTime = ''
        // this.endDateTime = ''
        break;
      case "5":
        // this.openCustomDateDialog()
        break;

      default:
        // Handle unexpected filterValueGraph values
        console.error("Invalid filterValueGraph:", this.filterValueGraph);
        break;
    }

  }
  convertToSeconds = (timeString: string) => {
    const parts = timeString.split(':').map(Number);
    return parts[0] * 3600 + parts[1] * 60 + parts[2]; // Convert to seconds
  };

  stationtimeActivitydata() {
    this.stationtimeActivity.forEach((chartData: any) => {

      const keys = Object.keys(chartData.data)




      const datasetValues: any = []
      const datasetValuesidel: any = []

      const canvas = document.getElementById(chartData.variable) as HTMLCanvasElement


      keys.forEach((data: any) => {
        const idleTimeInMinutes = chartData.data[data].idleTime
          .split(':')
          .reduce((acc: number, time: string) => 60 * acc + +time, 0);

        const busyTimeInMinutes = chartData.data[data].busyTime
          .split(':')
          .reduce((acc: number, time: string) => 60 * acc + +time, 0);
        datasetValues.push(idleTimeInMinutes);
        datasetValuesidel.push(busyTimeInMinutes);





      })



      if (canvas) {


        if (chartData.chart && chartData.chart instanceof Chart) {

          chartData.chart.destroy();
          chartData.chart = null;
        }
        chartData.chart = new Chart(canvas, {
          type: chartData.type[0], // Initial chart type
          data: {
            labels: keys,
            datasets: [{
              label: 'Idle Time',
              data: datasetValues,
              backgroundColor: '',
            },
            {
              label: 'Busy Time',
              data: datasetValuesidel,
              backgroundColor: '',
            }
            ]
          },
          options: {
            aspectRatio: 2,
            plugins: {
              legend: {
                display: true
              }
            }
          }
        });

      }



    });
  }
  chartChangestationtime(data: any, type: any) {
    const currentChart = data.data
    const keys = Object.keys(currentChart)
    const datasetValues: any = []
    const datasetValuesidel: any = []

    keys.forEach((data: any) => {

      datasetValues.push(
        currentChart[data].idleTime
          .split(':')
          .reduce((acc: number, time: string) => 60 * acc + +time, 0)
      );
    })
    keys.forEach((data: any) => {

      datasetValuesidel.push(
        currentChart[data].busyTime
          .split(':')
          .reduce((acc: number, time: string) => 60 * acc + +time, 0)
      );
    })


    if (data.chart) {
      data.chart.destroy(); // Destroy the existing chart instance
    }

    data.chart = new Chart(data.variable, {
      type: type,
      data: {
        labels: keys,
        datasets: [
          {
            label: 'Idle Time',
            data: datasetValues,
            backgroundColor: ''
          },
          {
            label: 'Busy Time',
            data: datasetValuesidel,
            backgroundColor: ''
          },
        ],
      },
      options: {
        aspectRatio: 2,
      },
    });
  }

  StationCallActiviychart() {

    this.stationcallActivty.forEach((chartData: any) => {



      const keys = Object.keys(chartData.data)
      const datasetValues: any = []

      const canvas = document.getElementById(chartData.variable) as HTMLCanvasElement

      keys.forEach((data: any) => {
        datasetValues.push(chartData.data[data].totalCalls)
      })

      if (canvas) {
        if (chartData.chart instanceof Chart) {
          return chartData.chart.destroy();
        }
        chartData.chart = new Chart(canvas, {
          type: chartData.type[0], // Initial chart type
          data: {
            labels: keys,
            datasets: [{
              label: 'Total Calls',
              data: datasetValues,
              backgroundColor: '',
            }]
          },
          options: {
            aspectRatio: 2,
          }
        });
      }


    });
  }

  chartstationCallactivity(data: any, type: any) {

    const currentChart = data.data

    const keys = Object.keys(currentChart)
    const datasetValues: any = []

    keys.forEach((data: any) => {
      datasetValues.push(currentChart[data].totalCalls)
    })

    if (data.chart) {
      data.chart.destroy(); // Destroy the existing chart instance
    }

    data.chart = new Chart(data.variable, {
      type: type,
      data: {
        labels: keys,
        datasets: [
          {
            label: 'Total Calls',
            data: datasetValues,
            backgroundColor: ''
          },
        ],
      },
      options: {
        aspectRatio: 2,
      },
    });
  }

  calltypeTraficchart() {
    this.calltypetraffic.forEach((chartData: any) => {



      const keys = Object.keys(chartData.data)
      const datasetValues: any = [];
      const totalIncomingCalls: any = []
      const totalMissedCalls: any = []
      const totalOutgoingCalls: any = []

      const canvas = document.getElementById(chartData.variable) as HTMLCanvasElement

      keys.forEach((data: any) => {

        datasetValues.push(chartData.data[data].totalAttendedCalls)
        totalIncomingCalls.push(chartData.data[data].totalIncomingCalls)
        totalMissedCalls.push(chartData.data[data].totalMissedCalls)
        totalOutgoingCalls.push(chartData.data[data].totalOutgoingCalls)
      })



      if (canvas) {
        if (chartData.chart instanceof Chart) {
          return chartData.chart.destroy();
        }
        chartData.chart = new Chart(canvas, {
          type: chartData.type[0], // Initial chart type
          data: {
            labels: keys,
            datasets: [
              {
                label: 'Total Attended Calls',
                data: datasetValues,
                backgroundColor: '',
              },
              {
                label: 'Total Incoming Calls',
                data: totalIncomingCalls,
                backgroundColor: '',
              },
              {
                label: 'Total Missed Calls',
                data: totalMissedCalls,
                backgroundColor: '',
              }, {
                label: 'Total Outgoing Calls',
                data: totalOutgoingCalls,
                backgroundColor: '',
              }
            ]
          },
          options: {
            aspectRatio: 2,
          }
        });
      }
    });
  }
  calltypetrafficchartChange(data: any, type: any) {
    const currentChart = data.data

    const keys = Object.keys(currentChart)
    const datasetValues: any = []
    const totalIncomingCalls: any = []
    const totalMissedCalls: any = []
    const totalOutgoingCalls: any = []


    keys.forEach((data: any) => {
      datasetValues.push(currentChart[data].totalAttendedCalls);
      totalIncomingCalls.push(currentChart[data].totalIncomingCalls)
      totalMissedCalls.push(currentChart[data].totalMissedCalls)
      totalOutgoingCalls.push(currentChart[data].totalOutgoingCalls)
    })

    if (data.chart) {
      data.chart.destroy(); // Destroy the existing chart instance
    }

    data.chart = new Chart(data.variable, {
      type: type,
      data: {
        labels: keys,
        datasets: [
          {
            label: 'Total Attended Calls',
            data: datasetValues,
            backgroundColor: ''
          },
          {
            label: 'Total Incoming Calls',
            data: totalIncomingCalls,
            backgroundColor: '',
          },
          {
            label: 'Total Missed Calls',
            data: totalMissedCalls,
            backgroundColor: '',
          }, {
            label: 'Total Outgoing Calls',
            data: totalOutgoingCalls,
            backgroundColor: '',
          }
        ],
      },
      options: {
        aspectRatio: 2,
      },
    });
  }

  frequanctCallChart() {
    this.frequantCall.forEach((chartData: any) => {



      const keys = Object.keys(chartData.data)
      const callCount: any = [];
      const customerNumber: any = []


      const canvas = document.getElementById(chartData.variable) as HTMLCanvasElement

      keys.forEach((data: any) => {

        callCount.push(chartData.data[data].callCount)
        customerNumber.push(chartData.data[data].customerNumber)
        // totalMissedCalls.push(chartData.data[data].totalMissedCalls)
        // totalOutgoingCalls.push(chartData.data[data].totalOutgoingCalls)
      })



      if (canvas) {
        if (chartData.chart instanceof Chart) {
          return chartData.chart.destroy();
        }
        chartData.chart = new Chart(canvas, {
          type: chartData.type[0], // Initial chart type
          data: {
            labels: keys,
            datasets: [
              {
                label: 'Call Count',
                data: callCount,
                backgroundColor: '',
              },
              {
                label: 'Customer Number',
                data: customerNumber,
                backgroundColor: '',
              },

            ]
          },
          options: {
            aspectRatio: 2,
          }
        });
      }
    });
  }
  frequantCartChange(data: any, type: any) {
    const currentChart = data.data

    const keys = Object.keys(currentChart)
    const callCount: any = []
    const customerNumber: any = []
    const totalMissedCalls: any = []
    const totalOutgoingCalls: any = []


    keys.forEach((data: any) => {
      callCount.push(currentChart[data].callCount);
      customerNumber.push(currentChart[data].customerNumber)

    })

    if (data.chart) {
      data.chart.destroy(); // Destroy the existing chart instance
    }

    data.chart = new Chart(data.variable, {
      type: type,
      data: {
        labels: keys,
        datasets: [
          {
            label: 'Call Count',
            data: callCount,
            backgroundColor: ''
          },
          {
            label: 'Customer Number',
            data: customerNumber,
            backgroundColor: '',
          },

        ],
      },
      options: {
        aspectRatio: 2,
      },
    });
  }
  dailyTraficChart() {
    this.dailytrafficData.forEach((chartData: any) => {



      const keys = Object.keys(chartData.data)
      const numberOfCalls: any = [];


      const canvas = document.getElementById(chartData.variable) as HTMLCanvasElement

      keys.forEach((data: any) => {

        numberOfCalls.push(chartData.data[data].numberOfCalls)

      })



      if (canvas) {
        if (chartData.chart instanceof Chart) {
          return chartData.chart.destroy();
        }
        chartData.chart = new Chart(canvas, {
          type: chartData.type[0], // Initial chart type
          data: {
            labels: keys,
            datasets: [
              {
                label: 'Number of calls',
                data: numberOfCalls,
                backgroundColor: '',
              },


            ]
          },
          options: {
            aspectRatio: 2,
          }
        });
      }
    });
  }
  dailytrafficChartChange(data: any, type: any) {
    const currentChart = data.data

    const keys = Object.keys(currentChart)
    const numberOfCalls: any = []



    keys.forEach((data: any) => {
      numberOfCalls.push(currentChart[data].numberOfCalls);

    })

    if (data.chart) {
      data.chart.destroy(); // Destroy the existing chart instance
    }

    data.chart = new Chart(data.variable, {
      type: type,
      data: {
        labels: keys,
        datasets: [
          {
            label: 'Number of calls',
            data: numberOfCalls,
            backgroundColor: ''
          },


        ],
      },
      options: {
        aspectRatio: 2,
      },
    });
  }
  concurrentChart() {
    this.currentData.forEach((chartData: any) => {



      const keys = Object.keys(chartData.data)
      const maxConcurrentCalls: any = [];
      const peakOccurrences: any = []
      const peakTime: any = []

      const canvas = document.getElementById(chartData.variable) as HTMLCanvasElement

      keys.forEach((data: any) => {

        maxConcurrentCalls.push(chartData.data[data].maxConcurrentCalls)
        peakOccurrences.push(chartData.data[data].peakOccurrences);
        peakTime.push(chartData.data[data].peakTime)
      })



      if (canvas) {
        if (chartData.chart instanceof Chart) {
          return chartData.chart.destroy();
        }
        chartData.chart = new Chart(canvas, {
          type: chartData.type[0], // Initial chart type
          data: {
            labels: keys,
            datasets: [
              {
                label: 'Max Concurrent Calls',
                data: maxConcurrentCalls,
                backgroundColor: '',
              },
              {
                label: 'Peak Occurrences',
                data: peakOccurrences,
                backgroundColor: '',
              },
              {
                label: 'Peak Time',
                data: peakTime,
                backgroundColor: '',
              },


            ]
          },
          options: {
            aspectRatio: 2,
          }
        });
      }
    });
  }
  concurrentChartChange(data: any, type: any) {
    const currentChart = data.data

    const keys = Object.keys(currentChart)
    const maxConcurrentCalls: any = [];
    const peakOccurrences: any = []
    const peakTime: any = []




    keys.forEach((data: any) => {
      maxConcurrentCalls.push(currentChart[data].maxConcurrentCalls);
      peakOccurrences.push(currentChart[data].peakOccurrences);
      peakTime.push(currentChart[data].peakTime);

    })

    if (data.chart) {
      data.chart.destroy(); // Destroy the existing chart instance
    }

    data.chart = new Chart(data.variable, {
      type: type,
      data: {
        labels: keys,
        datasets: [
          {
            label: 'Max Concurrent Calls',
            data: maxConcurrentCalls,
            backgroundColor: ''
          },
          {
            label: 'Peak Occurrences',
            data: peakOccurrences,
            backgroundColor: ''
          },
          {
            label: 'Peak Time',
            data: peakTime,
            backgroundColor: ''
          },


        ],
      },
      options: {
        aspectRatio: 2,
      },
    });
  }

  siptrunkEonechart() {

    this.siptrunkEoneData.forEach((chartData: any) => {

      const keys = Object.keys(chartData.data)
      const datasetValues: any = []
      const outgoingCalls: any = []

      const canvas = document.getElementById(chartData.variable) as HTMLCanvasElement

      keys.forEach((data: any) => {
        datasetValues.push(chartData.data[data].totalIncomingCalls)
        outgoingCalls.push(chartData.data[data].totalOutgoingCalls)
      })

      if (canvas) {
        if (chartData.chart instanceof Chart) {
          return chartData.chart.destroy();
        }
        chartData.chart = new Chart(canvas, {
          type: chartData.type[0], // Initial chart type
          data: {
            labels: keys,
            datasets: [{
              label: 'Total Incoming Calls',
              data: datasetValues,
              backgroundColor: '',
            },
            {
              label: 'Total Outgoing Calls',
              data: outgoingCalls,
              backgroundColor: '',
            }
            ]
          },
          options: {
            aspectRatio: 2,
          }
        });
      }
    });
  }
  eventRecorderDashboard: any
  fetchlicenseZiptrunk() {
    this.dashboardApi.fetchlicenseData().subscribe((res: any) => {
      this.ziptrunRecorderDashbord = res.result.dg.e1.st
      if (res.result.dg.pi.SipTrunk_recorder.channels > 0) {
        this.eventRecorderDashboard = true
      } else {
        this.eventRecorderDashboard = false
      }
    })
  }
  siptrunkChartChange(data: any, type: any) {
    const currentChart = data.data
    const keys = Object.keys(currentChart)
    const datasetValues: any = []
    const outgoingCalls: any = []
    keys.forEach((data: any) => {
      datasetValues.push(currentChart[data].totalIncomingCalls);
      outgoingCalls.push(currentChart[data].totalOutgoingCalls);
      // peakTime.push(currentChart[data].peakTime);

    })

    if (data.chart) {
      data.chart.destroy(); // Destroy the existing chart instance
    }

    data.chart = new Chart(data.variable, {
      type: type,
      data: {
        labels: keys,
        datasets: [
          {
            label: 'Total Incoming Calls',
            data: datasetValues,
            backgroundColor: ''
          },
          {
            label: 'Total Outgoing Calls',
            data: outgoingCalls,
            backgroundColor: ''
          },



        ],
      },
      options: {
        aspectRatio: 2,
      },
    });
  }


}
