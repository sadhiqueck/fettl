import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { CreateSettlementInput } from '@fettl/shared';
import { withGroupLock } from '../groups/group-transaction';
import { PrismaService } from '../prisma/prisma.service';

type Parties = Pick<CreateSettlementInput, 'payerId' | 'receiverId' | 'amount'>;

async function checkOutstanding(
  tx: Prisma.TransactionClient,
  groupId: string,
  payment: Parties,
) {
  const balances = await tx.groupMemberBalance.findMany({
    where: { groupId, userId: { in: [payment.payerId, payment.receiverId] } },
  });
  const debt = -(
    balances.find((row) => row.userId === payment.payerId)?.balance ?? 0
  );
  const credit =
    balances.find((row) => row.userId === payment.receiverId)?.balance ?? 0;
  if (payment.amount > Math.min(debt, credit))
    throw new ConflictException(
      'Group balances have changed. Review the current amount before recording payment.',
    );
}

@Injectable()
export class SettlementsService {
  constructor(private prisma: PrismaService) {}

  createSettlement(
    userId: string,
    groupId: string,
    data: CreateSettlementInput,
  ) {
    if (data.payerId !== userId)
      throw new ForbiddenException('Only the payer can record this payment.');
    if (userId === data.receiverId)
      throw new BadRequestException('Choose a different receiver.');
    return withGroupLock(this.prisma, groupId, async (tx) => {
      const active = await tx.groupMember.count({
        where: {
          groupId,
          isActive: true,
          userId: { in: [userId, data.receiverId] },
        },
      });
      if (active !== 2)
        throw new ForbiddenException('Both parties must be active members.');
      await checkOutstanding(tx, groupId, data);
      const pending = await tx.settlement.findFirst({
        where: {
          groupId,
          payerId: userId,
          receiverId: data.receiverId,
          status: 'PENDING',
          isDeleted: false,
        },
      });
      if (pending)
        throw new ConflictException(
          'A payment to this member is already awaiting confirmation.',
        );
      const payment = await tx.settlement.create({
        data: { ...data, groupId, status: 'PENDING' },
      });
      await tx.activityLog.create({
        data: {
          groupId,
          userId,
          type: 'SETTLEMENT_CREATED',
          metadata: { action: 'reported a payment', amount: data.amount },
        },
      });
      return payment;
    });
  }

  review(
    userId: string,
    groupId: string,
    id: string,
    status: 'CONFIRMED' | 'REJECTED',
  ) {
    return withGroupLock(this.prisma, groupId, async (tx) => {
      const payment = await tx.settlement.findFirst({
        where: { id, groupId, isDeleted: false },
      });
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.receiverId !== userId)
        throw new ForbiddenException(
          'Only the receiver can review this payment.',
        );
      if (payment.status === status) return payment;
      if (payment.status !== 'PENDING')
        throw new ConflictException('This payment has already been reviewed.');
      if (status === 'CONFIRMED') {
        await checkOutstanding(tx, groupId, payment);
        for (const [member, delta] of [
          [payment.payerId, payment.amount],
          [userId, -payment.amount],
        ] as const) {
          await tx.groupMemberBalance.update({
            where: { groupId_userId: { groupId, userId: member } },
            data: { balance: { increment: delta } },
          });
        }
      }
      await tx.activityLog.create({
        data: {
          groupId,
          userId,
          type:
            status === 'CONFIRMED'
              ? 'SETTLEMENT_CONFIRMED'
              : 'SETTLEMENT_REJECTED',
          metadata: {
            action:
              status === 'CONFIRMED'
                ? 'confirmed a payment'
                : 'declined a payment',
            amount: payment.amount,
          },
        },
      });
      return tx.settlement.update({ where: { id }, data: { status } });
    });
  }
}
