import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicenseValidationComponent } from './license-validation.component';

describe('LicenseValidationComponent', () => {
  let component: LicenseValidationComponent;
  let fixture: ComponentFixture<LicenseValidationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LicenseValidationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LicenseValidationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
