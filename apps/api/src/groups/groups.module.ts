import { ChatModule } from '../chat/chat.module';
import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [ChatModule],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
