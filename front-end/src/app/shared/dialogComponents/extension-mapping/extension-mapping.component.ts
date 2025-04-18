import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-extension-mapping',
  standalone: true,
  imports: [FormsModule,MatFormFieldModule,ReactiveFormsModule],
  templateUrl: './extension-mapping.component.html',
  styleUrl: './extension-mapping.component.css'
})
export class ExtensionMappingComponent {
  myForm: any = FormGroup;

}
