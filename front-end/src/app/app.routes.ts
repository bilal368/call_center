import {  Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ActivedirectoryComponent } from './configure/activedirectory/activedirectory.component';
import { BaseComponent } from './base/base.component';
import { EmployeeManagerComponent } from './configure/employee-manager/employee-manager.component';
import { AuthGuard } from './core/services/auth/auth.guard';
import { UserManagerComponent } from './configure/user-manager/user-manager.component';
import { DashboardCallRecordingComponent } from './dashboard-call-recording/dashboard-call-recording.component';
import {  RolesPrivilegesComponent } from './configure//roles-privileges/roles-privileges.component';
import { StationMonitorComponent } from './station-monitor/station-monitor.component';
import { CallReportsComponent } from './reports/call-reports/call-reports.component';
import { ColorCodeComponent } from './reports/color-code/color-code.component';
import { ExtensionReportComponent } from './reports/extension-report/extension-report.component';
import { AgentReportComponent } from './reports/agent-report/agent-report.component';
import { FrequentCallsComponent } from './reports/frequent-calls/frequent-calls.component';
import { RecordingComponent } from './Alerts/recording/recording.component';
import { SystemComponent } from './Alerts/system/system.component';
import { ConfigChangesComponent } from './Alerts/config-changes/config-changes.component';
import { CallRecordsComponent } from './Alerts/call-records/call-records.component';
import { ArchiveComponent } from './Alerts/archive/archive.component';
import { ChannelsComponent } from './Alerts/channels/channels.component';
import { ExtensionMappingComponents } from './configure/extension-mapping/extension-mapping.component';
import { RouteProtectService } from './core/services/routeProtect/route-protect.service';
import { RecordersettingsAvayaComponent } from './configure/recorderSettings/recordersettings/recordersettings.component';
import { SiptrunkrecorderComponent } from './configure/recorderSettings/siptrunkrecorder/siptrunkrecorder.component';
import { SystemInfoComponent } from './configure/system-info/system-info.component';
import { DeletedCallsComponent } from './reports/deleted-calls/deleted-calls.component';
import { TimeLineReportsComponent } from './reports/time-line-reports/time-line-reports.component';
import { ConcurrentReportComponent } from './reports/concurrent-report/concurrent-report.component';
import { AuditTrailReportComponent } from './reports/audit-trail-report/audit-trail-report.component';
import { LoginTrackReportComponent } from './reports/login-track-report/login-track-report.component';
import { AnaloguerecodersettingsComponent } from './configure/recorderSettings/analoguesettings/analoguerecodersettings/analoguerecodersettings.component';
import { MediaproxysettingsComponent } from './configure/recorderSettings/mediaproxysettings/mediaproxysettings.component';
import { DigitalRecordersettingComponent } from './configure/recorderSettings/digital-recordersetting/digital-recordersetting.component';
import { ArchiveReportsComponent } from './reports/archive-reports/archive-reports.component';
import { EvenrecodersettingsComponent } from './configure/recorderSettings/evenrecodersettings/evenrecodersettings.component';
import { RolesAndPrivSettingComponent } from './configure/roles-and-priv-setting/roles-and-priv-setting.component';
// here AuthGuard used for determine license is valid or not.
// routeProtect used for privilege wise access to routes

export const routes: Routes = [
    {
      path: '',
      component: LoginComponent,
      canActivate: [AuthGuard]
    },
    {
      path: 'dG',
      component: BaseComponent,
      canActivate: [AuthGuard],
      data:{'hari':"15"},
      children: [
        {
          path: 'configure',
          children: [
            {
              path: 'active-directory',
              component: ActivedirectoryComponent,
              canActivate:[RouteProtectService],
              data:{privileges:[18,19,20,21],header:"Menu.MODULES.Active Directory"}
            },
            {
              path: 'user-manager',
              component: UserManagerComponent,
              canActivate:[RouteProtectService],
              data:{privileges:[23],header:"Menu.MODULES.User Manager"}
            },
            {
              path: 'employee-management',
              component: EmployeeManagerComponent,
              canActivate:[RouteProtectService],
              data:{privileges:[24],header:"Menu.MODULES.Employee Manager"}
            },
            {
              path: 'hierarchy-management',
              component: EmployeeManagerComponent,
              canActivate:[RouteProtectService],
              data:{privileges:[32],header:"Menu.MODULES.Hierarchy Management"}
            },
            {
              path: 'roles-privileges',
              component: RolesAndPrivSettingComponent,
              canActivate:[RouteProtectService],
              data:{privileges:[22],header:"Menu.MODULES.Roles and Privileges"}
            
            },
            {
              path: 'extension-mapping',
              component: ExtensionMappingComponents,
              data:{privileges:[25],header:"Menu.MODULES.Extension Mapping"}

            },   
            {
              path: 'recorder-settings',
              children:[
                {
                  path: 'avaya',
                  component: RecordersettingsAvayaComponent,
                  data:{header:"Menu.MODULES.Recorder Settings.Avaya"}
                },
                {
                  path: 'sip-trunk',
                  component: SiptrunkrecorderComponent,
                  data:{header:"Menu.MODULES.Recorder Settings.SipTrunk"}
                
                },
                {
                  path: 'analouge',
                  component: AnaloguerecodersettingsComponent, 
                  data:{header:"Menu.MODULES.Recorder Settings.Analogue"}
                }
                ,
                {
                  path: 'mediaproxy',
                  component: MediaproxysettingsComponent, 
                  data:{header:"Menu.MODULES.Recorder Settings.MediaProxy"}
                },
                {
                  path: 'digital',
                  component: DigitalRecordersettingComponent, 
                  data:{header:"Menu.MODULES.Recorder Settings.Digital"}
                },
                {
                  path: 'e-one',
                  component: EvenrecodersettingsComponent, 
                  data:{header:"Menu.MODULES.Recorder Settings.E-One"}
                }


              ],
              data:{privileges:[26]}

            },
            {
              path: 'system-management',
              component: SystemInfoComponent,
              data:{privileges:[27],header:"Menu.MODULES.System Management"}
              
            }
            
            
          ]
        },
        {
          path: 'dashboard',
          component: DashboardCallRecordingComponent,
          canActivate:[RouteProtectService],
          data:{privileges:[15],header:"Menu.MODULES.Dashboard"}
        },
        {
          path: 'station-monitor',
          component: StationMonitorComponent,
          canActivate:[RouteProtectService],
          data:{privileges:[1],header:"Menu.MODULES.Station Monitor"}
        },
        {
          path: 'reports',
          children: [
            
            {
              path: 'archive-report',
              component: ArchiveReportsComponent,
              canActivate:[RouteProtectService],
              data:{privileges:[34],header:"Menu.MODULES.Archive Report"}
            },
            {
              path: 'call-reports',
              component: CallReportsComponent,
              canActivate:[RouteProtectService],
              data:{privileges:[7],header:"Menu.MODULES.Call Report"}
            },
            {
              path: 'color-code-report',
              component: ColorCodeComponent,
              data:{privileges:[30],header:"Menu.MODULES.Color Code Report"}

            },
            {
              path: 'extension-report',
              component: ExtensionReportComponent,
              data:{privileges:[28],header:"Menu.MODULES.Extension Report"}

            },
            {
              path: 'agent-report',
              component: AgentReportComponent,
              data:{privileges:[33],header:"Menu.MODULES.Agent Report"}

            },
            {
              path: 'frequent-calls-report',
              component: FrequentCallsComponent,
              data:{privileges:[35],header:"Menu.MODULES.Frequent Call Report"}

            },
            {
              path: 'time-line-report',
              component: TimeLineReportsComponent,
              data:{privileges:[11],header:"Menu.MODULES.Timeline Report"}

            },
            {
              path: 'concurrent-report',
              component: ConcurrentReportComponent,
              data:{privileges:[13],header:"Menu.MODULES.Concurrent Report"}

            },
            {
              path: 'deleted-calls-report',
              component: DeletedCallsComponent,
              data:{privileges:[12],header:"Menu.MODULES.Deleted Call Report"}
            },
            {
              path: 'login-track-report',
              component: LoginTrackReportComponent,
              data:{privileges:[29],header:"Menu.MODULES.Login Track Report"}

            },
            {
              path:'audit-trail-report',
              component:AuditTrailReportComponent,
                data:{privileges:[16],header:"Menu.MODULES.audit-trail-report"}
			}
          ]
        },
        {
          path: 'alerts',
          canActivate:[RouteProtectService],
          data:{privileges:[6]},
          children: [
            {
              path: 'recording',
              component: RecordingComponent,
              data:{header:"Menu.MODULES.Recording Alerts"}

              
            },
            {
              path: 'system',
              component: SystemComponent,
              data:{header:"Menu.MODULES.System Alerts"}

            },
            {
              path: 'config-changes',
              component: ConfigChangesComponent,
              data:{header:"Menu.MODULES.Config Change Alerts"}

            },
            {
              path: 'call-records',
              component: CallRecordsComponent,
              data:{header:"Menu.MODULES.Call Records Alerts"}

            },
            {
              path: 'archive',
              component: ArchiveComponent,
              data:{header:"Menu.MODULES.Archive Alerts"}

            },
            {
              path: 'extensions',
              component: ChannelsComponent,
              data:{header:"Menu.MODULES.Channel Alerts"}

            }
          ]
        }
      ]
    }
  ];
