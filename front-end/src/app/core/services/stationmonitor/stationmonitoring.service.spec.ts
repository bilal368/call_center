import { TestBed } from '@angular/core/testing';

import { StationmonitoringService } from './stationmonitoring.service';

describe('StationmonitoringService', () => {
  let service: StationmonitoringService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StationmonitoringService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
