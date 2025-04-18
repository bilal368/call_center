import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginTrackReportComponent } from './login-track-report.component';

describe('LoginTrackReportComponent', () => {
  let component: LoginTrackReportComponent;
  let fixture: ComponentFixture<LoginTrackReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginTrackReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginTrackReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
