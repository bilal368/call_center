import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioForkPlayerComponent } from './audio-fork-player.component';

describe('AudioForkPlayerComponent', () => {
  let component: AudioForkPlayerComponent;
  let fixture: ComponentFixture<AudioForkPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioForkPlayerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AudioForkPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
