import { BadRequestException } from '@nestjs/common';
import { UserController } from './user.controller';
import type { UserService } from './user.service';

it('rejects an empty directory search', () => {
  const users = { searchUsers: jest.fn() };
  expect(() =>
    new UserController(users as unknown as UserService).searchUsers('', 'user'),
  ).toThrow(BadRequestException);
  expect(users.searchUsers).not.toHaveBeenCalled();
});
