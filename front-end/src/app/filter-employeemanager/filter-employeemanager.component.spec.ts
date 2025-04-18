import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterEmployeemanagerComponent } from './filter-employeemanager.component';

describe('FilterEmployeemanagerComponent', () => {
  let component: FilterEmployeemanagerComponent;
  let fixture: ComponentFixture<FilterEmployeemanagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterEmployeemanagerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FilterEmployeemanagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
