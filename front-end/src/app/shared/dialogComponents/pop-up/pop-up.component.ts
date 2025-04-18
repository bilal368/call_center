import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/authentication/auth.service';

@Component({
  selector: 'app-pop-up',
  standalone: true,
  imports: [MatToolbarModule, TranslateModule],
  templateUrl: './pop-up.component.html',
  styleUrl: './pop-up.component.css'
})
export class PopUpComponent {
  [x: string]: any;

  constructor(@Inject(MAT_DIALOG_DATA) public datas: any,
    public dialogRef: MatDialogRef<PopUpComponent>,
    private authService: AuthService,
    public translate: TranslateService) { }

  message: any = ''
  heading: any = ''

  ngOnInit() {
    console.log(this.datas);
    // this.heading = this.datas.heading
    this.message = this.datas.message
    const token = localStorage.getItem('token')

    if (token) {
      const extractedData = this.authService.extractDataFromToken(token)
      const language = extractedData.languageFileName || 'en-us';
      this.translate.use(language);
    } else {
      this.translate.use('en-us');
    }
  }
  onClose(): void {
    this.dialogRef.close();
  }
}
