import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelmappingsiptrunkComponent } from './channelmappingsiptrunk.component';

describe('ChannelmappingsiptrunkComponent', () => {
  let component: ChannelmappingsiptrunkComponent;
  let fixture: ComponentFixture<ChannelmappingsiptrunkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelmappingsiptrunkComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChannelmappingsiptrunkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
