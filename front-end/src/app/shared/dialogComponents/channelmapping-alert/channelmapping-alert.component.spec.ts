import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelmappingAlertComponent } from './channelmapping-alert.component';

describe('ChannelmappingAlertComponent', () => {
  let component: ChannelmappingAlertComponent;
  let fixture: ComponentFixture<ChannelmappingAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelmappingAlertComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChannelmappingAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
