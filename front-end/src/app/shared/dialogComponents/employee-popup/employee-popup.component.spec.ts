import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeePopupComponent } from './employee-popup.component';

describe('EmployeePopupComponent', () => {
  let component: EmployeePopupComponent;
  let fixture: ComponentFixture<EmployeePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeePopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmployeePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
