import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCallRecordingComponent } from './dashboard-call-recording.component';

describe('DashboardCallRecordingComponent', () => {
  let component: DashboardCallRecordingComponent;
  let fixture: ComponentFixture<DashboardCallRecordingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCallRecordingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DashboardCallRecordingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
