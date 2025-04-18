import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallRecordsComponent } from './call-records.component';

describe('CallRecordsComponent', () => {
  let component: CallRecordsComponent;
  let fixture: ComponentFixture<CallRecordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallRecordsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CallRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
