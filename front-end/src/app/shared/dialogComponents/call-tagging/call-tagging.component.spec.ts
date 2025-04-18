import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallTaggingComponent } from './call-tagging.component';

describe('CallTaggingComponent', () => {
  let component: CallTaggingComponent;
  let fixture: ComponentFixture<CallTaggingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallTaggingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CallTaggingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
