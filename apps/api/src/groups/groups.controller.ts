import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  UsePipes,
  UseGuards,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ChatGateway } from '../chat/chat.gateway';
import { GroupsService } from './groups.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createGroupSchema } from '@fettl/shared';
import type { CreateGroupInput } from '@fettl/shared';
import type { Group } from '@prisma/client';
import { GroupRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { GroupRoleGuard } from './guards/group-role.guard';
import { RequireGroupRoles } from './decorators/require-group-roles.decorator';

type CreateGroupResponse = {
  message: string;
  group: Group;
};

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly chat: ChatGateway,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(createGroupSchema))
  async createGroup(
    @Body() createGroupDto: CreateGroupInput,
    @GetUser('id') userId: string,
  ): Promise<CreateGroupResponse> {
    const createdGroup = await this.groupsService.createGroup(
      userId,
      createGroupDto,
    );

    return {
      message: 'Group successfully created',
      group: createdGroup,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserGroups(@GetUser('id') userId: string) {
    const groups = await this.groupsService.getUserGroups(userId);
    return {
      message: 'Groups successfully fetched',
      groups,
    };
  }

  @Get('contacts')
  @UseGuards(JwtAuthGuard)
  async getAllContacts(@GetUser('id') userId: string) {
    const contacts = await this.groupsService.getGroupContacts(userId);
    return {
      message: 'All contacts successfully fetched',
      contacts,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @RequireGroupRoles(GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MEMBER)
  async getGroupById(@Param('id') id: string, @GetUser('id') userId: string) {
    const group = await this.groupsService.getGroupById(id, userId);
    return {
      message: 'Group successfully fetched',
      group,
    };
  }

  @Get(':id/expenses')
  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @RequireGroupRoles(GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MEMBER)
  expensePage(
    @Param('id') groupId: string,
    @GetUser('id') userId: string,
    @Query('cursor') cursor?: string,
  ) {
    if (cursor !== undefined && typeof cursor !== 'string')
      throw new BadRequestException('Invalid expense cursor');
    return this.groupsService.getExpensePage(groupId, userId, cursor);
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  async joinGroup(
    @Body('inviteCode') inviteCode: string,
    @GetUser('id') userId: string,
  ) {
    if (
      typeof inviteCode !== 'string' ||
      !/^[A-Z1-9]{6}$/i.test(inviteCode.trim())
    ) {
      throw new BadRequestException('Invite code is required');
    }
    return this.groupsService.joinGroupUsingCode(
      userId,
      inviteCode.trim().toUpperCase(),
    );
  }

  @Get(':id/contacts')
  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @RequireGroupRoles(GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MEMBER)
  async getGroupContacts(
    @Param('id') groupId: string,
    @GetUser('id') userId: string,
  ) {
    const contacts = await this.groupsService.getGroupContacts(userId, groupId);
    return {
      message: 'Contacts successfully fetched',
      contacts,
    };
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @RequireGroupRoles(GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MEMBER)
  async addMemberDirectly(
    @Param('id') groupId: string,
    @Body('userId') memberId: string,
    @GetUser('id') adminId: string,
  ) {
    if (typeof memberId !== 'string' || !memberId) {
      throw new BadRequestException('User ID is required');
    }
    return this.groupsService.addMemberDirectly(adminId, groupId, memberId);
  }

  @Post(':id/members/email')
  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @RequireGroupRoles(GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MEMBER)
  async addMemberByEmail(
    @Param('id') groupId: string,
    @Body('email') email: string,
    @GetUser('id') adminId: string,
  ) {
    if (typeof email !== 'string' || !email) {
      throw new BadRequestException('Email is required');
    }
    return this.groupsService.addMemberByEmail(adminId, groupId, email);
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard, GroupRoleGuard)
  @RequireGroupRoles(GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MEMBER)
  async leaveGroup(
    @Param('id') groupId: string,
    @GetUser('id') userId: string,
  ) {
    const result = await this.groupsService.leaveGroup(userId, groupId);
    this.chat.server.in(`user_${userId}`).socketsLeave(`group_${groupId}`);
    return result;
  }
}
