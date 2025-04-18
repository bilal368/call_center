import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConcurrentReportComponent } from './concurrent-report.component';

describe('ConcurrentReportComponent', () => {
  let component: ConcurrentReportComponent;
  let fixture: ComponentFixture<ConcurrentReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConcurrentReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConcurrentReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
