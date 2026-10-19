import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { CreateSettlementInput, ExpensePayments } from '@fettl/shared';
import { decryptVpaSafe } from '../common/utils/encryption';
import { withGroupLock } from '../groups/group-transaction';
import { PrismaService } from '../prisma/prisma.service';

type Parties = Pick<CreateSettlementInput, 'payerId' | 'receiverId'>;

async function groupPaymentLimit(
  tx: Prisma.TransactionClient,
  groupId: string,
  { payerId, receiverId }: Parties,
  reservePending: boolean,
) {
  const balances = await tx.groupMemberBalance.findMany({
    where: { groupId, userId: { in: [payerId, receiverId] } },
  });
  let debt = -(balances.find((row) => row.userId === payerId)?.balance ?? 0);
  let credit = balances.find((row) => row.userId === receiverId)?.balance ?? 0;
  if (reservePending) {
    const pending = await tx.settlement.findMany({
      where: {
        groupId,
        status: 'PENDING',
        isDeleted: false,
        OR: [{ payerId }, { receiverId }],
      },
      select: { payerId: true, receiverId: true, amount: true },
    });
    for (const payment of pending) {
      if (payment.payerId === payerId) debt -= payment.amount;
      if (payment.receiverId === receiverId) credit -= payment.amount;
    }
  }
  return Math.max(0, Math.min(debt, credit));
}

async function getExpensePayments(
  tx: Prisma.TransactionClient,
  groupId: string,
  userId: string,
  expenseId: string,
) {
  const expense = await tx.expense.findFirst({
    where: { id: expenseId, groupId, isDeleted: false },
    select: {
      title: true,
      paidById: true,
      paidBy: { select: { vpa: true } },
      splits: { where: { userId }, select: { amount: true } },
      settlements: {
        where: {
          isDeleted: false,
          OR: [{ payerId: userId }, { receiverId: userId }],
        },
        select: {
          id: true,
          payerId: true,
          payer: { select: { name: true } },
          amount: true,
          status: true,
          note: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!expense) throw new NotFoundException('Expense not found.');
  return expense;
}

type ExpensePaymentRecord = Awaited<ReturnType<typeof getExpensePayments>>;

function remainingShare(expense: ExpensePaymentRecord) {
  if (expense.settlements.some((payment) => payment.status === 'PENDING')) {
    return 0;
  }
  const confirmedAmount = expense.settlements.reduce(
    (total, payment) =>
      payment.status === 'CONFIRMED' ? total + payment.amount : total,
    0,
  );
  return Math.max(0, (expense.splits[0]?.amount ?? 0) - confirmedAmount);
}

@Injectable()
export class SettlementsService {
  constructor(private prisma: PrismaService) {}

  async expensePayments(
    userId: string,
    groupId: string,
    expenseId: string,
  ): Promise<ExpensePayments> {
    return this.prisma.$transaction(
      async (tx) => {
        const expense = await getExpensePayments(
          tx,
          groupId,
          userId,
          expenseId,
        );
        const share = expense.paidById === userId ? 0 : remainingShare(expense);
        let availableAmount = 0;
        if (share > 0) {
          const receiverId = expense.paidById;
          const receiver = await tx.groupMember.findUnique({
            where: { userId_groupId: { groupId, userId: receiverId } },
            select: { isActive: true },
          });
          if (receiver?.isActive) {
            const limit = await groupPaymentLimit(
              tx,
              groupId,
              { payerId: userId, receiverId },
              true,
            );
            availableAmount = Math.min(share, limit);
          }
        }
        return {
          availableAmount,
          receiverVpa:
            availableAmount > 0 ? decryptVpaSafe(expense.paidBy.vpa) : null,
          payments: expense.settlements.map(({ payer, ...payment }) => ({
            ...payment,
            name: payment.payerId === userId ? 'You' : payer.name,
          })),
        };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }

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

      const { expenseId, reportId } = data;
      if (reportId) {
        const existing = await tx.settlement.findUnique({
          where: {
            groupId_payerId_reportId: { groupId, payerId: userId, reportId },
          },
        });
        if (existing) {
          if (
            existing.expenseId !== expenseId ||
            existing.receiverId !== data.receiverId ||
            existing.amount !== data.amount ||
            existing.note !== (data.note ?? null)
          ) {
            throw new ConflictException(
              'This payment report has already been used.',
            );
          }
          return existing;
        }
      }

      let expenseTitle: string | undefined;
      if (expenseId) {
        const expense = await getExpensePayments(
          tx,
          groupId,
          userId,
          expenseId,
        );
        if (expense.paidById !== data.receiverId || !expense.splits.length) {
          throw new ForbiddenException(
            'Payment must go to the person who paid for your expense.',
          );
        }
        if (data.amount > remainingShare(expense)) {
          throw new ConflictException(
            'This share has changed or has a payment awaiting confirmation.',
          );
        }
        expenseTitle = expense.title;
      } else {
        const pending = await tx.settlement.findFirst({
          where: {
            groupId,
            payerId: userId,
            receiverId: data.receiverId,
            status: 'PENDING',
            isDeleted: false,
          },
          select: { id: true },
        });
        if (pending) {
          throw new ConflictException(
            'A payment to this member is already awaiting confirmation.',
          );
        }
      }

      if (data.amount > (await groupPaymentLimit(tx, groupId, data, true))) {
        throw new ConflictException(
          'Group balances have changed. Review the current amount before recording payment.',
        );
      }
      const payment = await tx.settlement.create({
        data: { ...data, groupId, status: 'PENDING' },
      });
      await tx.activityLog.create({
        data: {
          groupId,
          userId,
          expenseId,
          type: 'SETTLEMENT_CREATED',
          metadata: {
            action: expenseTitle
              ? 'reported a payment for'
              : 'reported a payment',
            amount: data.amount,
            expenseTitle,
          },
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
        include: { expense: { select: { title: true } } },
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
        // A linked payment records funds already received. Changes to other
        // expenses since it was reported still belong in the net balances.
        if (
          !payment.expenseId &&
          payment.amount >
            (await groupPaymentLimit(tx, groupId, payment, false))
        ) {
          throw new ConflictException(
            'Group balances have changed. Review the current amount before recording payment.',
          );
        }
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
      const action =
        status === 'CONFIRMED' ? 'confirmed a payment' : 'declined a payment';
      await tx.activityLog.create({
        data: {
          groupId,
          userId,
          expenseId: payment.expenseId,
          type:
            status === 'CONFIRMED'
              ? 'SETTLEMENT_CONFIRMED'
              : 'SETTLEMENT_REJECTED',
          metadata: {
            action: payment.expense ? `${action} for` : action,
            amount: payment.amount,
            expenseTitle: payment.expense?.title,
          },
        },
      });
      return tx.settlement.update({ where: { id }, data: { status } });
    });
  }
}
