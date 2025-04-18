import { TestBed } from '@angular/core/testing';

import { RouteProtectService } from '../route-protect.service';

describe('RouteProtectService', () => {
  let service: RouteProtectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RouteProtectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
