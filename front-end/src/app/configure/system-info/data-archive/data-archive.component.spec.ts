import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataArchiveComponent } from './data-archive.component';

describe('DataArchiveComponent', () => {
  let component: DataArchiveComponent;
  let fixture: ComponentFixture<DataArchiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataArchiveComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DataArchiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
