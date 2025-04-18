import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionMappingComponent } from './extension-mapping.component';

describe('ExtensionMappingComponent', () => {
  let component: ExtensionMappingComponent;
  let fixture: ComponentFixture<ExtensionMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtensionMappingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExtensionMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
