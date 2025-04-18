import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionMappingComponents } from './extension-mapping.component';

describe('ExtensionMappingComponent', () => {
  let component: ExtensionMappingComponents;
  let fixture: ComponentFixture<ExtensionMappingComponents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtensionMappingComponents]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExtensionMappingComponents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
