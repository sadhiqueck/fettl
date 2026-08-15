import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as webPush from 'web-push';

function isPushEndpoint(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      /^(fcm\.googleapis\.com|(?:[a-z0-9-]+\.)*push\.services\.mozilla\.com|(?:[a-z0-9-]+\.)*push\.apple\.com|(?:[a-z0-9-]+\.)*notify\.windows\.com)$/.test(
        url.hostname,
      )
    );
  } catch {
    return false;
  }
}
type PushPayload = { title: string; body: string; icon?: string; url: string };

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>(
      'VAPID_SUBJECT',
      'mailto:admin@fettl.app',
    );

    if (publicKey && privateKey) {
      webPush.setVapidDetails(subject, publicKey, privateKey);
      this.logger.log('Web Push VAPID details configured');
    } else {
      this.logger.warn(
        'Web Push VAPID keys are missing from environment variables',
      );
    }
  }

  getVapidPublicKey() {
    return this.configService.get<string>('VAPID_PUBLIC_KEY');
  }

  async saveSubscription(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    if (
      !subscription ||
      typeof subscription.endpoint !== 'string' ||
      subscription.endpoint.length > 4096 ||
      !isPushEndpoint(subscription.endpoint) ||
      !/^[A-Za-z0-9_-]{87}=?$/.test(subscription.keys?.p256dh ?? '') ||
      !/^[A-Za-z0-9_-]{22}={0,2}$/.test(subscription.keys?.auth ?? '')
    ) {
      throw new BadRequestException('Unsupported push subscription');
    }
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
    this.logger.log(`Saved push subscription for user ${userId}`);
  }

  async sendPushToUser(userId: string, payload: PushPayload) {
    if (!this.getVapidPublicKey()) return;
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return;

    const promises = subscriptions.map(async (sub) => {
      if (!isPushEndpoint(sub.endpoint)) return;
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          'statusCode' in error &&
          (error.statusCode === 410 || error.statusCode === 404)
        ) {
          // Subscription expired or is invalid
          this.logger.log(
            `Removing invalid push subscription for user ${userId}`,
          );
          await this.prisma.pushSubscription.deleteMany({
            where: { id: sub.id },
          });
        } else {
          this.logger.warn('Push delivery failed');
        }
      }
    });

    await Promise.all(promises);
  }

  async sendPushToGroupMembers(
    groupId: string,
    excludeUserId: string,
    payload: PushPayload,
  ) {
    // Find all active members in the group except the sender
    const groupMembers = await this.prisma.groupMember.findMany({
      where: {
        groupId,
        userId: { not: excludeUserId },
        isActive: true,
      },
      select: { userId: true },
    });

    const promises = groupMembers.map((member) =>
      this.sendPushToUser(member.userId, payload),
    );

    await Promise.all(promises);
  }
}
