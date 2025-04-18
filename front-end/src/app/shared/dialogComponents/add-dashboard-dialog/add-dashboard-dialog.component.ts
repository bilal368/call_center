import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../core/services/dashboard/dashboard.service';
import { LogoutSpinnerComponent } from '../logout-spinner/logout-spinner.component';
import { AuthService } from '../../../core/services/authentication/auth.service';
import { SettingsDialogComponent } from './settings-dialog/settings-dialog.component';

@Component({
  selector: 'app-add-dashboard-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatCheckboxModule, MatIconModule, FormsModule],
  templateUrl: './add-dashboard-dialog.component.html',
  styleUrl: './add-dashboard-dialog.component.css',
})
export class AddDashboardDialogComponent {
  dashboardItems: { name: string, selected: boolean }[] = [];
  userId: any;
  filterChannelTimeSettings: any;
  filterChannelCallSettings: any;
  filterSettings: any = null;
  AgentfilterSettings: any;
  AgentCallfilterSettings: any;
  selectedTabIndex: any;
  extensions: any[] = [];

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<AddDashboardDialogComponent>,
    private dashboardApi: DashboardService,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.filterSettings = data;
    if (data) {
      this.AgentfilterSettings = data.agentdetails;
    }

  }

  ngOnInit(): void {
    this.fetchDashboardFeatures();
  }

  // Fetch channel status from the API
  fetchDashboardFeatures(): void {
    const extractData = this.authService.extractDataFromToken(localStorage.getItem('token'))
    this.userId = extractData.userId
    this.dashboardApi.fetchDashboardFeatures(this.userId).subscribe(
      (res: any) => {
        if (res.status) {
          // Update dashboardItems dynamically based on API response
          this.dashboardItems = res.dashboardFeatures.map((feature: any) => ({
            name: feature.dashboardFeatureName,
            selected: feature.userFeatureActive === 1, // Set selected based on 'active' flag
            callRecordingDashboardFeatureId: feature.callRecordingDashboardFeatureId
          }));
        }
      },
      (error) => {
        if (error.status === 403 || error.status === 401) {
          this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } ,disableClose:true});
        }
      }
    );
  }

  // Method to handle cancel action
  onCancel(): void {
    this.dialogRef.close();
  }

  // Method to check if all items are selected
  allSelected(): boolean {
    return this.dashboardItems.every(item => item.selected);
  }

  // Method to handle confirm action
  onConfirm(): void {

    const allSelected = this.allSelected();
    this.dashboardApi.updateDashboardFeatures(this.userId, this.dashboardItems, this.filterChannelTimeSettings, this.filterChannelCallSettings, this.selectedTabIndex, this.AgentfilterSettings, this.AgentCallfilterSettings).subscribe(
      (res: any) => {
        if (res.status) {
          // Return the status of the selection to the calling component
          this.dialogRef.close({
            status:true,
            allSelected: allSelected,
            selectedItems: this.dashboardItems.filter(item => item.selected)
          });
        }
      },
      (error) => {
        if (error.status === 403 || error.status === 401) {
          this.dialog.open(LogoutSpinnerComponent, { data: { clickedType: 'logOut' } ,disableClose:true});
        }
      }
    );

  }


  openSettingsDialog(item: any): void {
    if (this.filterSettings) {
      this.filterSettings.name = item.name
    }

    if (item.name == 'Station Time Activity' || item.name == 'Station Call Activity') {
      const dialogRef = this.dialog.open(SettingsDialogComponent, {
        width: '30vw',
        data: { filterSettings: this.filterSettings }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.selectedTabIndex = result.selectedTabIndex
          if (result.selectedTabIndex) {
            // Handle the selected items after the dialog is closed
            result.name = item.name
            if (item.name == "Station Time Activity") {
              this.filterChannelTimeSettings = result
            } else if (item.name == "Station Call Activity") {
              this.filterChannelCallSettings = result
            }
          } else {
            result.name = item.name
            if (item.name == "Station Time Activity") {
              this.filterChannelTimeSettings = result
              this.filterChannelTimeSettings.extensions = result.selectedExtensions.map((ext: any) => ext.extensionNumber);

            } else if (item.name == "Station Call Activity") {
              this.filterChannelCallSettings = result
              this.filterChannelCallSettings.extensions = result.selectedExtensions.map((ext: any) => ext.extensionNumber);

            }
          }
        }
      });
    } else if (item.name == 'Agent Time Activity' || item.name == 'Agent Call Activity') {

      if (!this.AgentfilterSettings) {
        this.AgentfilterSettings = {};  // Initialize as an empty object
        this.AgentfilterSettings.name = item.name
      }
      if (!this.AgentCallfilterSettings) {
        this.AgentCallfilterSettings = {};  // Initialize as an empty object
        this.AgentCallfilterSettings.name = item.name
      }

      const dialogRef = this.dialog.open(SettingsDialogComponent, {
        width: '30vw',
        data: { filterSettings: this.AgentfilterSettings, name:item.name }
      });

      dialogRef.afterClosed().subscribe(result => {

        if (result) {
          // Fetch all agentCode values into an array
          const agentCodes = result.map((item: { agentCode: any; }) => item.agentCode);
          if (item.name == "Agent Time Activity") {
            this.AgentfilterSettings = {}
            this.AgentfilterSettings.name = item.name
            this.AgentfilterSettings.agentCodes = agentCodes
          } else if (item.name == "Agent Call Activity") {
            this.AgentCallfilterSettings.name = item.name
            this.AgentCallfilterSettings.agentCodes = agentCodes
            // this.AgentCallfilterSettings.name = item.name
          }

          console.log("Final this.AgentfilterSettings", this.AgentfilterSettings);

          console.log("Final this.AgentCallfilterSettings", this.AgentCallfilterSettings);


          // if (result.selectedTabIndex) {
          //   // Handle the selected items after the dialog is closed
          //   result.name = item.name
          //   if (item.name == "Agent Time Activity") {
          //     this.filterChannelTimeSettings = result
          //   } else if (item.name == "Agent Call Activity") {
          //     this.filterChannelCallSettings = result
          //   }
          // } 
          // else {
          // result.name = item.name
          // if (item.name == "Agent Time Activity") {
          //   this.filterChannelTimeSettings = result
          //   this.filterChannelTimeSettings.extensions = result.selectedExtensions.map((ext: any) => ext.extensionNumber);

          // } else if (item.name == "Agent Call Activity") {
          //   this.filterChannelCallSettings = result
          //   this.filterChannelCallSettings.extensions = result.selectedExtensions.map((ext: any) => ext.extensionNumber);

          // }
          // }
        }
      });
    }

  }
}
