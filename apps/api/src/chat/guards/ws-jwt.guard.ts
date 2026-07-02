import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ─── 1. Get the Socket client from the WebSocket context ──
    const client: Socket = context.switchToWs().getClient();

    // ─── 2. Check if user was already authenticated during connection ─
    if (client.data?.user) {
      // User was authenticated in handleConnection — still valid
      // But let's verify the token hasn't expired since connection
      const token =
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string);

      if (token) {
        try {
          await this.jwtService.verifyAsync(token, {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          });
          return true; // Token still valid
        } catch {
          // Token expired since the user connected
          this.logger.warn(
            `Token expired for ${client.data.user.name} (${client.id})`,
          );
          client.emit('error', { message: 'Token expired. Please reconnect.' });
          client.disconnect();
          throw new WsException('Token expired');
        }
      }
    }

    // ─── 3. No user data — wasn't authenticated during connection ──
    this.logger.warn(`Unauthenticated event attempt (${client.id})`);
    throw new WsException('Authentication required');
  }
}