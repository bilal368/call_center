import { TestBed } from '@angular/core/testing';
import { SystemInfoServices } from './systemInfo-service.service';

describe('SystemInfoServices', () => {
  let service: SystemInfoServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SystemInfoServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
