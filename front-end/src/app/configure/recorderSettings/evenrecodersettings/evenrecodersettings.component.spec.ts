import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvenrecodersettingsComponent } from './evenrecodersettings.component';

describe('EvenrecodersettingsComponent', () => {
  let component: EvenrecodersettingsComponent;
  let fixture: ComponentFixture<EvenrecodersettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvenrecodersettingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EvenrecodersettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
