import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Membership, balance checks and ledger writes share one lock per group.
export function withGroupLock<T>(
  prisma: PrismaService,
  groupId: string,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return prisma.$transaction(async (tx) => {
    const group = await tx.$queryRaw<
      { id: string }[]
    >`SELECT id FROM groups WHERE id = ${groupId} FOR UPDATE`;
    if (!group.length) throw new NotFoundException('Group not found');
    return work(tx);
  });
}
