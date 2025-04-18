import { TestBed } from '@angular/core/testing';

import { RolesAndPrivilegesService } from './roles-and-privileges.service';

describe('RolesAndPrivilegesService', () => {
  let service: RolesAndPrivilegesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RolesAndPrivilegesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
