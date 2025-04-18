import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMangerAlertComponent } from './user-manger-alert.component';

describe('UserMangerAlertComponent', () => {
  let component: UserMangerAlertComponent;
  let fixture: ComponentFixture<UserMangerAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMangerAlertComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserMangerAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
