import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoutSpinnerComponent } from './logout-spinner.component';

describe('LogoutSpinnerComponent', () => {
  let component: LogoutSpinnerComponent;
  let fixture: ComponentFixture<LogoutSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoutSpinnerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LogoutSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
