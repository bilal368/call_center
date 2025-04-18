import { TestBed } from '@angular/core/testing';

import { CallReportService } from './call-report.service';

describe('CallReportService', () => {
  let service: CallReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CallReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
