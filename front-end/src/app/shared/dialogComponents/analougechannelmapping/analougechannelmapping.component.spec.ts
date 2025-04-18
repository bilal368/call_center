import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalougechannelmappingComponent } from './analougechannelmapping.component';

describe('AnalougechannelmappingComponent', () => {
  let component: AnalougechannelmappingComponent;
  let fixture: ComponentFixture<AnalougechannelmappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalougechannelmappingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnalougechannelmappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
