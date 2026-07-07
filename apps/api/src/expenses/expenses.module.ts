import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { ChatModule } from '../chat/chat.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [ChatModule, PushModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
