import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletedCallsComponent } from './deleted-calls.component';

describe('DeletedCallsComponent', () => {
  let component: DeletedCallsComponent;
  let fixture: ComponentFixture<DeletedCallsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeletedCallsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeletedCallsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
