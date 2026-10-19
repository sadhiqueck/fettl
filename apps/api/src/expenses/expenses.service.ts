import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { allocatePaise } from '@fettl/shared';
import type { CreateExpenseInput, UpdateExpenseInput } from '@fettl/shared';
import { Prisma } from '@prisma/client';
import { withGroupLock } from '../groups/group-transaction';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

interface ExpenseAmounts {
  paidById: string;
  amount: number;
  splits: { userId: string; amount?: number }[];
}

export function balanceChanges(expense: ExpenseAmounts) {
  const changes = new Map([[expense.paidById, expense.amount]]);
  for (const split of expense.splits) {
    changes.set(
      split.userId,
      (changes.get(split.userId) ?? 0) - (split.amount ?? 0),
    );
  }
  return changes;
}

async function postBalances(
  tx: Prisma.TransactionClient,
  groupId: string,
  expense: ExpenseAmounts,
  direction: 1 | -1,
) {
  const changes = balanceChanges(expense);
  if (direction === -1) {
    const affected = [...changes]
      .filter(([, delta]) => delta !== 0)
      .map(([id]) => id);
    const active = await tx.groupMember.count({
      where: { groupId, isActive: true, userId: { in: affected } },
    });
    if (active !== affected.length)
      throw new BadRequestException(
        'This change would reopen a balance for a member who has left the group.',
      );
  }
  for (const [userId, change] of changes) {
    if (change === 0) continue;
    const delta = direction * change;
    await tx.groupMemberBalance.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId, balance: delta },
      update: { balance: { increment: delta } },
    });
  }
}

async function checkExpensePayments(
  tx: Prisma.TransactionClient,
  expenseId: string,
) {
  const payment = await tx.settlement.findFirst({
    where: {
      expenseId,
      isDeleted: false,
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: { id: true },
  });
  if (payment) {
    throw new ConflictException(
      'The split can’t change and the expense can’t be deleted while it has pending or confirmed payments.',
    );
  }
}

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);
  constructor(
    private prisma: PrismaService,
    private pushService: PushService,
  ) {}

  private async checkSplits(
    tx: Prisma.TransactionClient,
    groupId: string,
    userId: string,
    data: Pick<
      CreateExpenseInput,
      'splits' | 'splitMethod' | 'amount' | 'paidById'
    >,
  ) {
    const splits: CreateExpenseInput['splits'] = data.splits;
    const participants = new Set(splits.map((s) => s.userId));
    if (
      participants.size !== splits.length ||
      splits.reduce((sum, s) => sum + (s.amount ?? 0), 0) !== data.amount
    ) {
      throw new BadRequestException(
        'Each participant must appear once and shares must add up to the expense.',
      );
    }
    if (['PERCENTAGE', 'SHARES', 'EQUAL'].includes(data.splitMethod)) {
      const weights = splits.map((s) =>
        data.splitMethod === 'PERCENTAGE'
          ? Math.round((s.percentage ?? 0) * 100)
          : data.splitMethod === 'SHARES'
            ? (s.shares ?? 0)
            : 1,
      );
      if (
        !weights.some((w) => w > 0) ||
        (data.splitMethod === 'PERCENTAGE' &&
          weights.reduce((a, b) => a + b, 0) !== 10000)
      )
        throw new BadRequestException('Invalid split weights.');
      const expected = allocatePaise(data.amount, weights);
      if (expected.some((v, i) => v !== (splits[i].amount ?? 0)))
        throw new BadRequestException(
          'Amounts do not match the selected split method.',
        );
    }
    participants.add(userId);
    participants.add(data.paidById);
    const active = await tx.groupMember.count({
      where: { groupId, userId: { in: [...participants] }, isActive: true },
    });
    if (active !== participants.size)
      throw new ForbiddenException(
        'Expenses can only include active group members.',
      );
  }

  async addExpense(userId: string, groupId: string, data: CreateExpenseInput) {
    const expense = await withGroupLock(this.prisma, groupId, async (tx) => {
      await this.checkSplits(tx, groupId, userId, data);
      const { splits, ...fields } = data;
      const record = await tx.expense.create({
        data: {
          ...fields,
          groupId,
          splits: {
            create: splits.map((s) => ({
              ...s,
              amount: s.amount ?? 0,
              percentage:
                s.percentage === undefined
                  ? undefined
                  : Math.round(s.percentage * 100),
            })),
          },
        },
      });
      await postBalances(tx, groupId, data, 1);
      await tx.activityLog.create({
        data: {
          groupId,
          userId,
          expenseId: record.id,
          type: 'EXPENSE_ADDED',
          metadata: {
            action: 'added an expense',
            expenseTitle: record.title,
            amount: record.amount,
          },
        },
      });
      return record;
    });
    void this.pushService
      .sendPushToGroupMembers(groupId, userId, {
        title: 'New group expense',
        body: expense.title,
        url: `/groups/${groupId}`,
      })
      .catch(() => this.logger.warn('Expense notification delivery failed'));
    return expense;
  }

  private async ownedExpense(
    tx: Prisma.TransactionClient,
    groupId: string,
    id: string,
    userId: string,
  ) {
    const expense = await tx.expense.findFirst({
      where: {
        id,
        groupId,
        isDeleted: false,
        group: { members: { some: { userId, isActive: true } } },
      },
      include: { splits: true },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.paidById !== userId)
      throw new ForbiddenException('Only the payer can change this expense.');
    return expense;
  }

  updateExpense(
    userId: string,
    groupId: string,
    id: string,
    data: UpdateExpenseInput,
  ) {
    return withGroupLock(this.prisma, groupId, async (tx) => {
      const old = await this.ownedExpense(tx, groupId, id, userId);
      const { splits, amount, splitMethod, paidById, ...metadata } = data;
      const financialChange = [splits, amount, splitMethod, paidById].some(
        (field) => field !== undefined,
      );
      if (financialChange) {
        await checkExpensePayments(tx, id);
        if (!splits || !amount || !splitMethod || !paidById)
          throw new BadRequestException(
            'Provide all allocations when changing a split.',
          );
        await this.checkSplits(tx, groupId, userId, {
          splits,
          amount,
          splitMethod,
          paidById,
        });
        await postBalances(tx, groupId, old, -1);
        await tx.expenseSplit.deleteMany({ where: { expenseId: id } });
        await tx.expenseSplit.createMany({
          data: splits.map((s) => ({
            ...s,
            expenseId: id,
            amount: s.amount ?? 0,
            percentage:
              s.percentage === undefined
                ? undefined
                : Math.round(s.percentage * 100),
          })),
        });
        await postBalances(tx, groupId, { splits, amount, paidById }, 1);
      }
      const updated = await tx.expense.update({
        where: { id },
        data: { ...metadata, paidById, amount, splitMethod },
      });
      await tx.activityLog.create({
        data: {
          groupId,
          userId,
          expenseId: id,
          type: 'EXPENSE_UPDATED',
          metadata: {
            action: 'edited an expense',
            expenseTitle: updated.title,
          },
        },
      });
      return updated;
    });
  }

  deleteExpense(userId: string, groupId: string, id: string) {
    return withGroupLock(this.prisma, groupId, async (tx) => {
      const expense = await this.ownedExpense(tx, groupId, id, userId);
      await checkExpensePayments(tx, id);
      const deleted = await tx.expense.update({
        where: { id },
        data: { isDeleted: true },
      });
      await postBalances(tx, groupId, expense, -1);
      await tx.activityLog.create({
        data: {
          groupId,
          userId,
          expenseId: id,
          type: 'EXPENSE_DELETED',
          metadata: {
            action: 'deleted an expense',
            expenseTitle: expense.title,
          },
        },
      });
      return deleted;
    });
  }
}
