import { Controller, Get, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@Request() req) {
    // req.user comes from the JWT AuthGuard validation
    return this.userService.getProfile(req.user.userId);
  }

  @Get('search')
  async searchUsers(@Query('q') query: string) {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }
    return this.userService.searchUsers(query);
  }
}
