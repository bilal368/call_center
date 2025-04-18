import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginTrackReportServiceComponent } from './login-track-report-service.component';

describe('LoginTrackReportServiceComponent', () => {
  let component: LoginTrackReportServiceComponent;
  let fixture: ComponentFixture<LoginTrackReportServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginTrackReportServiceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginTrackReportServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
