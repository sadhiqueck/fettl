import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Delete,
  Param,
  ForbiddenException,
  NotFoundException,
  UsePipes,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createExpenseSchema, updateExpenseSchema } from '@settleup/shared';
import type { CreateExpenseInput, UpdateExpenseInput } from '@settleup/shared';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('groups/:groupId/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createExpenseSchema))
  addExpense(
    @Param('groupId') groupId: string,
    @GetUser('id') userId: string,
    @Body() body: CreateExpenseInput,
  ) {
    return this.expensesService.addExpense(userId, groupId, body);
  }

  @Patch(':expenseId')
  @UsePipes(new ZodValidationPipe(updateExpenseSchema))
  async updateExpense(
    @Param('groupId') groupId: string,
    @Param('expenseId') expenseId: string,
    @GetUser('id') userId: string,
    @Body() body: UpdateExpenseInput,
  ) {
    // Authorization check: Ensure user is part of the group and is the payer
    const expense = await this.expensesService.getExpenseById(expenseId);
    if (!expense || expense.groupId !== groupId) {
      throw new NotFoundException('Expense not found');
    }
    if (expense.paidBy.id !== userId) {
      throw new ForbiddenException('You can only edit your own expenses');
    }

    return this.expensesService.updateExpense(expenseId, body);
  }

  @Delete(':expenseId')
  async deleteExpense(
    @Param('groupId') groupId: string,
    @Param('expenseId') expenseId: string,
    @GetUser('id') userId: string,
  ) {
    // Authorization check
    const expense = await this.expensesService.getExpenseById(expenseId);
    if (!expense || expense.groupId !== groupId) {
      throw new NotFoundException('Expense not found');
    }
    if (expense.paidBy.id !== userId) {
      throw new ForbiddenException('You can only delete your own expenses');
    }

    return this.expensesService.deleteExpense(expenseId);
  }
}
