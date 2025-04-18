import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, } from '@angular/material/dialog';
import { AuthenticationService } from '../../core/services/activeDirectory/authentication.service';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-dialogue-box',
  standalone: true,
  imports: [MatIconModule,MatDialogModule,TranslateModule],
  providers: [AuthenticationService],
  templateUrl: './dialogue-box.component.html',
  styleUrl: './dialogue-box.component.css'
})
export class DialogueBoxComponent implements OnInit {

  showPreloader: any;
  connectionStatus: any;
  authenticationForm: any;
  authenticationError: any;
  constructor(@Inject(MAT_DIALOG_DATA) public data: { data: any, authFormBody: any, isAuthorized: boolean, type: string, },
    private authApi: AuthenticationService,
    public matdialoge: MatDialogRef<DialogueBoxComponent>,
    public dialog: MatDialog
  ) {

  }
  // dialog box for connection confirmation to LDAP
  ngOnInit(): void {
    this.connectionStatus = this.data.type
    this.authenticationForm = this.data.authFormBody;
    console.log(this.connectionStatus);
    this.getConnection()

  }
  // // api for connection  to LDAP
  getConnection() {
    const body = { password: this.authenticationForm.value.password, systemName: this.authenticationForm.value.systemName, systemIP: this.authenticationForm.value.serverIp, userName: this.authenticationForm.value.ldapUsername, domain: this.authenticationForm.value.domainName };
    this.authApi.authentication(body).subscribe((result: any) => {
      console.log(result, 'ress');
      if (result.status === true) {
        this.connectionStatus = true
      }
    }, (error: any) => {
      if (error.status === 500) {
        console.log("Error", error?.error.statusText);
        this.connectionStatus = null;
        this.authenticationError = false;

      }
      // console.log("ERROR",error?.error.statusText);

    })
  }
  closedialogue() {
    console.log("Close Function");
    this.matdialoge.close(this.connectionStatus)
  }


}
