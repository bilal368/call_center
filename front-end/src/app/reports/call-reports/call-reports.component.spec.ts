import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallReportsComponent } from './call-reports.component';

describe('CallReportsComponent', () => {
  let component: CallReportsComponent;
  let fixture: ComponentFixture<CallReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallReportsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CallReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
