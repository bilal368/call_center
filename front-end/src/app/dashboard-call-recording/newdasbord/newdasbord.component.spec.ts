import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewdasbordComponent } from './newdasbord.component';

describe('NewdasbordComponent', () => {
  let component: NewdasbordComponent;
  let fixture: ComponentFixture<NewdasbordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewdasbordComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewdasbordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
