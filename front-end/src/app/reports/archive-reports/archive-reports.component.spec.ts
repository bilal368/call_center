import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchiveReportsComponent } from './archive-reports.component';

describe('ArchiveReportsComponent', () => {
  let component: ArchiveReportsComponent;
  let fixture: ComponentFixture<ArchiveReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveReportsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ArchiveReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
