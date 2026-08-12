import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
    changes.set(split.userId, (changes.get(split.userId) ?? 0) - (split.amount ?? 0));
  }
  return changes;
}

async function postBalances(tx: Prisma.TransactionClient, groupId: string, expense: ExpenseAmounts, direction: 1 | -1) {
  for (const [userId, change] of balanceChanges(expense)) {
    if (change === 0) continue;
    const delta = direction * change;
    await tx.groupMemberBalance.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId, balance: delta },
      update: { balance: { increment: delta } },
    });
  }
}

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);
  constructor(private prisma: PrismaService, private pushService: PushService) {}

  async addExpense(userId: string, groupId: string, data: CreateExpenseInput) {
    const participants = new Set(data.splits.map((split) => split.userId));
    if (participants.size !== data.splits.length || data.splits.reduce((sum, split) => sum + (split.amount ?? 0), 0) !== data.amount) {
      throw new BadRequestException('Each participant must appear once and shares must add up to the expense.');
    }
    participants.add(data.paidById);
    participants.add(userId);
    const expense = await withGroupLock(this.prisma, groupId, async (tx) => {
      const active = await tx.groupMember.count({ where: { groupId, userId: { in: [...participants] }, isActive: true } });
      if (active !== participants.size) throw new ForbiddenException('Expenses can only include active group members.');
      const { splits, ...fields } = data;
      const record = await tx.expense.create({
        data: { ...fields, groupId, splits: { create: splits.map((s) => ({
          ...s, amount: s.amount ?? 0, percentage: s.percentage === undefined ? undefined : Math.round(s.percentage * 100),
        })) } },
      });
      await postBalances(tx, groupId, data, 1);
      await tx.activityLog.create({ data: { groupId, userId, expenseId: record.id, type: 'EXPENSE_ADDED',
        metadata: { action: 'added an expense', expenseTitle: record.title, amount: record.amount } } });
      return record;
    });
    void this.pushService.sendPushToGroupMembers(groupId, userId, {
      title: 'New group expense', body: expense.title, url: `/groups/${groupId}`,
    }).catch(() => this.logger.warn('Expense notification delivery failed'));
    return expense;
  }

  private async ownedExpense(tx: Prisma.TransactionClient, groupId: string, id: string, userId: string) {
    const expense = await tx.expense.findFirst({
      where: { id, groupId, isDeleted: false, group: { members: { some: { userId, isActive: true } } } },
      include: { splits: true },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.paidById !== userId) throw new ForbiddenException('Only the payer can change this expense.');
    return expense;
  }

  updateExpense(userId: string, groupId: string, id: string, data: UpdateExpenseInput) {
    return withGroupLock(this.prisma, groupId, async (tx) => {
      await this.ownedExpense(tx, groupId, id, userId);
      const updated = await tx.expense.update({ where: { id }, data });
      await tx.activityLog.create({ data: { groupId, userId, expenseId: id, type: 'EXPENSE_UPDATED',
        metadata: { action: 'edited an expense', expenseTitle: updated.title } } });
      return updated;
    });
  }

  deleteExpense(userId: string, groupId: string, id: string) {
    return withGroupLock(this.prisma, groupId, async (tx) => {
      const expense = await this.ownedExpense(tx, groupId, id, userId);
      const deleted = await tx.expense.update({ where: { id }, data: { isDeleted: true } });
      await postBalances(tx, groupId, expense, -1);
      await tx.activityLog.create({ data: { groupId, userId, expenseId: id, type: 'EXPENSE_DELETED',
        metadata: { action: 'deleted an expense', expenseTitle: expense.title } } });
      return deleted;
    });
  }
}
