import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrequentCallsComponent } from './frequent-calls.component';

describe('FrequentCallsComponent', () => {
  let component: FrequentCallsComponent;
  let fixture: ComponentFixture<FrequentCallsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrequentCallsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FrequentCallsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
