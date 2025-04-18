import { TestBed } from '@angular/core/testing';

import { TimelineConcurrentReportsService } from './timeline-concurrent-reports.service';

describe('TimelineConcurrentReportsService', () => {
  let service: TimelineConcurrentReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimelineConcurrentReportsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
