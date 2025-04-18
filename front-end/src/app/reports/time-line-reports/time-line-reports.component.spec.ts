import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeLineReportsComponent } from './time-line-reports.component';

describe('TimeLineReportsComponent', () => {
  let component: TimeLineReportsComponent;
  let fixture: ComponentFixture<TimeLineReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeLineReportsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TimeLineReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
