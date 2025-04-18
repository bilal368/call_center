import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtMappingPopupComponent } from './ext-mapping-popup.component';

describe('ExtMappingPopupComponent', () => {
  let component: ExtMappingPopupComponent;
  let fixture: ComponentFixture<ExtMappingPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtMappingPopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExtMappingPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
