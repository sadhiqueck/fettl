import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  UsePipes,
} from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createSettlementSchema } from '@settleup/shared';
import type { CreateSettlementInput } from '@settleup/shared';
import { GetUser } from '../common/decorators/get-user.decorator';
import { GroupRoleGuard } from '../groups/guards/group-role.guard';
import { RequireGroupRoles } from '../groups/decorators/require-group-roles.decorator';
import { GroupRole } from '@prisma/client';

@Controller('groups/:id/settlements')
@UseGuards(JwtAuthGuard, GroupRoleGuard)
@RequireGroupRoles(GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MEMBER)
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createSettlementSchema))
  async createSettlement(
    @Param('id') groupId: string,
    @GetUser('id') userId: string,
    @Body() body: CreateSettlementInput,
  ) {
    const settlement = await this.settlementsService.createSettlement(
      userId,
      groupId,
      body,
    );

    return {
      message: 'Settlement recorded successfully',
      settlement,
    };
  }
}
