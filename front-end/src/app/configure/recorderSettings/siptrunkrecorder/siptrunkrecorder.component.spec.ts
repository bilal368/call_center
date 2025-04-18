import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiptrunkrecorderComponent } from './siptrunkrecorder.component';

describe('SiptrunkrecorderComponent', () => {
  let component: SiptrunkrecorderComponent;
  let fixture: ComponentFixture<SiptrunkrecorderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiptrunkrecorderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SiptrunkrecorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
