import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaproxysettingsComponent } from './mediaproxysettings.component';

describe('MediaproxysettingsComponent', () => {
  let component: MediaproxysettingsComponent;
  let fixture: ComponentFixture<MediaproxysettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaproxysettingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MediaproxysettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
