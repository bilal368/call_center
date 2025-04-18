import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MergeAndPlayaudioComponent } from './merge-and-playaudio.component';

describe('MergeAndPlayaudioComponent', () => {
  let component: MergeAndPlayaudioComponent;
  let fixture: ComponentFixture<MergeAndPlayaudioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MergeAndPlayaudioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MergeAndPlayaudioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
