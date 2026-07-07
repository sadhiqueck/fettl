import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('vapidPublicKey')
  @UseGuards(JwtAuthGuard)
  getVapidPublicKey() {
    return {
      publicKey: this.pushService.getVapidPublicKey(),
    };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(
    @GetUser('id') userId: string,
    @Body()
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    },
  ) {
    await this.pushService.saveSubscription(userId, subscription);
    return { success: true };
  }
}
