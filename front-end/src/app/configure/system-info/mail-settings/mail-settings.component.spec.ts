import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MailSettingsComponent } from './mail-settings.component';

describe('MailerSettingsComponent', () => {
  let component: MailSettingsComponent;
  let fixture: ComponentFixture<MailSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MailSettingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MailSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
