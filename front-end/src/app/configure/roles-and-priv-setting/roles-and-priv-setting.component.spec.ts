import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesAndPrivSettingComponent } from './roles-and-priv-setting.component';

describe('RolesAndPrivSettingComponent', () => {
  let component: RolesAndPrivSettingComponent;
  let fixture: ComponentFixture<RolesAndPrivSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesAndPrivSettingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RolesAndPrivSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
