import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnaloguerecodersettingsComponent } from './analoguerecodersettings.component';

describe('AnaloguerecodersettingsComponent', () => {
  let component: AnaloguerecodersettingsComponent;
  let fixture: ComponentFixture<AnaloguerecodersettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnaloguerecodersettingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnaloguerecodersettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
