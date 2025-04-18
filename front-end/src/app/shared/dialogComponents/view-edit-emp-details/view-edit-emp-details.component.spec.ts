import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewEditEmpDetailsComponent } from './view-edit-emp-details.component';

describe('ViewEditEmpDetailsComponent', () => {
  let component: ViewEditEmpDetailsComponent;
  let fixture: ComponentFixture<ViewEditEmpDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewEditEmpDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewEditEmpDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
