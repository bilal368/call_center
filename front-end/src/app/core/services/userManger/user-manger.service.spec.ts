import { TestBed } from '@angular/core/testing';

import { UserMangerService } from './user-manger.service';

describe('UserMangerService', () => {
  let service: UserMangerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserMangerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
