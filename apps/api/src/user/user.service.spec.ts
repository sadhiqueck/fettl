import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';

it('returns a not-found response for a deleted profile', async () => {
  const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
  const service = new UserService(prisma as unknown as PrismaService);
  await expect(service.getProfile('absent')).rejects.toBeInstanceOf(
    NotFoundException,
  );
});
