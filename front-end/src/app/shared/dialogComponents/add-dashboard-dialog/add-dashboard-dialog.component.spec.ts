import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDashboardDialogComponent } from './add-dashboard-dialog.component';

describe('AddDashboardDialogComponent', () => {
  let component: AddDashboardDialogComponent;
  let fixture: ComponentFixture<AddDashboardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDashboardDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddDashboardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
