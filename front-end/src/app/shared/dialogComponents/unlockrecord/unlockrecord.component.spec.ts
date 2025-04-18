import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnlockrecordComponent } from './unlockrecord.component';

describe('UnlockrecordComponent', () => {
  let component: UnlockrecordComponent;
  let fixture: ComponentFixture<UnlockrecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnlockrecordComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UnlockrecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
