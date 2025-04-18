import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoltageenergygraphComponent } from './voltageenergygraph.component';

describe('VoltageenergygraphComponent', () => {
  let component: VoltageenergygraphComponent;
  let fixture: ComponentFixture<VoltageenergygraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoltageenergygraphComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VoltageenergygraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
