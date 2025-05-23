import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorCodeComponent } from './color-code.component';

describe('ColorCodeComponent', () => {
  let component: ColorCodeComponent;
  let fixture: ComponentFixture<ColorCodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorCodeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ColorCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
