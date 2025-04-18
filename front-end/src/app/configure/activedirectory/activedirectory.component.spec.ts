import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivedirectoryComponent } from './activedirectory.component';

describe('ActivedirectoryComponent', () => {
  let component: ActivedirectoryComponent;
  let fixture: ComponentFixture<ActivedirectoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivedirectoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActivedirectoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
