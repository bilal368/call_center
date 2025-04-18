import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordersettingsAvayaComponent } from './recordersettings.component';

describe('RecordersettingsComponent', () => {
  let component: RecordersettingsAvayaComponent;
  let fixture: ComponentFixture<RecordersettingsAvayaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordersettingsAvayaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecordersettingsAvayaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
