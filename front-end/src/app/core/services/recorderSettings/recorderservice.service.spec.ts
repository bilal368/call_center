import { TestBed } from '@angular/core/testing';

import { RecorderserviceService } from './recorderservice.service';

describe('RecorderserviceService', () => {
  let service: RecorderserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecorderserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
