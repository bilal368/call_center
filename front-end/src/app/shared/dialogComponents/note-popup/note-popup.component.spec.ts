import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotePopupComponent } from './note-popup.component';

describe('NotePopupComponent', () => {
  let component: NotePopupComponent;
  let fixture: ComponentFixture<NotePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotePopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NotePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
