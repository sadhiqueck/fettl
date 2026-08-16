import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Delete,
  Param,
  UsePipes,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createExpenseSchema, updateExpenseSchema } from '@fettl/shared';
import type { CreateExpenseInput, UpdateExpenseInput } from '@fettl/shared';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('groups/:groupId/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createExpenseSchema))
  async addExpense(
    @Param('groupId') groupId: string,
    @GetUser('id') userId: string,
    @Body() body: CreateExpenseInput,
  ) {
    const result = await this.expensesService.addExpense(userId, groupId, body);

    // Broadcast to all connected group members via WebSocket
    this.chatGateway.server
      .to(`group_${groupId}`)
      .emit('expense:created', { groupId });

    return result;
  }

  @Patch(':expenseId')
  @UsePipes(new ZodValidationPipe(updateExpenseSchema))
  async updateExpense(
    @Param('groupId') groupId: string,
    @Param('expenseId') expenseId: string,
    @GetUser('id') userId: string,
    @Body() body: UpdateExpenseInput,
  ) {
    const result = await this.expensesService.updateExpense(
      userId,
      groupId,
      expenseId,
      body,
    );

    // Broadcast update to all connected group members
    this.chatGateway.server
      .to(`group_${groupId}`)
      .emit('expense:updated', { groupId });

    return result;
  }

  @Delete(':expenseId')
  async deleteExpense(
    @Param('groupId') groupId: string,
    @Param('expenseId') expenseId: string,
    @GetUser('id') userId: string,
  ) {
    const result = await this.expensesService.deleteExpense(
      userId,
      groupId,
      expenseId,
    );

    // Broadcast deletion to all connected group members
    this.chatGateway.server
      .to(`group_${groupId}`)
      .emit('expense:deleted', { groupId });

    return result;
  }
}
