import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitalRecordersettingComponent } from './digital-recordersetting.component';

describe('DigitalRecordersettingComponent', () => {
  let component: DigitalRecordersettingComponent;
  let fixture: ComponentFixture<DigitalRecordersettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DigitalRecordersettingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DigitalRecordersettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
