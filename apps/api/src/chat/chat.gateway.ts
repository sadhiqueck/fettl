/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { trustedBrowserOrigin } from '../common/config/browser-origin';
import type { IncomingMessage } from 'node:http';
import { Server, Socket } from 'socket.io';

export interface AuthSocket extends Socket {
  data: {
    user?: { id: string; name: string; email: string; avatarUrl?: string };
  };
}
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

@WebSocketGateway({
  maxHttpBufferSize: 32_768,
  cors: {
    origin: (
      origin: string | undefined,
      next: (err: Error | null, allow: boolean) => void,
    ) => next(null, !origin || trustedBrowserOrigin(origin)),
    credentials: true,
  },
  allowRequest: (
    req: IncomingMessage,
    next: (error: string | null, success: boolean) => void,
  ) =>
    next(null, !req.headers.origin || trustedBrowserOrigin(req.headers.origin)),
})
export class ChatGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private pushService: PushService,
  ) {}

  afterInit(server: Server) {
    server.use((socket, next) => {
      const client = socket as AuthSocket;
      void this.authenticate(client).then(
        () => next(),
        () => next(new Error('Authentication required')),
      );
    });
  }

  private async authenticate(client: AuthSocket) {
    const token = this.extractTokenFromHandshake(client);
    if (!token) throw new Error('Missing session');
    const payload = await this.jwtService.verifyAsync<{
      sub: string;
      exp: number;
    }>(token);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    if (!user || !payload.exp) throw new Error('Invalid session');
    client.data.user = { ...user, avatarUrl: user.avatarUrl ?? undefined };
    await client.join(`user_${user.id}`);
    const timer = setTimeout(
      () => client.disconnect(true),
      Math.max(0, payload.exp * 1000 - Date.now()),
    );
    client.once('disconnect', () => clearTimeout(timer));
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody('groupId') groupId: string,
  ) {
    if (typeof groupId !== 'string' || !groupId)
      throw new WsException('Group ID required');
    const isMember = await this.prisma.groupMember.findFirst({
      where: {
        userId: client.data.user!.id,
        groupId,
        isActive: true,
      },
    });

    if (!isMember) {
      return { status: 'error', message: 'Not a member of this group' };
    }

    // Join the Socket.io room specific to this group
    const roomName = `group_${groupId}`;
    void client.join(roomName);
    this.logger.log(`${client.data.user!.name} joined room: ${roomName}`);

    // Fetch recent 50 messages
    const history = await this.prisma.chatMessage.findMany({
      where: { groupId, isDeleted: false },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 51,
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Send history to the client who just joined
    const hasMore = history.length > 50;
    client.emit('chatHistory', {
      groupId,
      history: history.slice(0, 50).reverse(),
      hasMore,
    });

    return { status: 'success', room: roomName };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveGroup')
  handleLeaveGroup(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody('groupId') groupId: string,
  ) {
    const roomName = `group_${groupId}`;
    void client.leave(roomName);
    this.logger.log(`${client.data.user!.name} left room: ${roomName}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('loadMoreMessages')
  async handleLoadMoreMessages(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() payload: { groupId: string; cursor: string },
  ) {
    if (
      typeof payload?.groupId !== 'string' ||
      !payload.groupId ||
      typeof payload.cursor !== 'string' ||
      !payload.cursor
    )
      throw new WsException('Group and cursor required');
    const userId = client.data.user!.id;
    const member = await this.prisma.groupMember.findFirst({
      where: { userId, groupId: payload?.groupId, isActive: true },
      select: { id: true },
    });
    if (!member) throw new WsException('Not an active member of this group');
    if (!payload?.cursor) throw new WsException('A message cursor is required');

    const page = await this.prisma.chatMessage.findMany({
      where: { groupId: payload.groupId, isDeleted: false },
      cursor: { id: payload.cursor },
      skip: 1,
      take: 51,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
    const hasMore = page.length > 50;
    client.emit('olderMessages', {
      groupId: payload.groupId,
      history: page.slice(0, 50).reverse(),
      hasMore,
    });
    return { status: 'success' };
  }

  // ─── Messaging ────────────────────────────────────────

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody()
    payload: { groupId: string; content: string; imageUrl?: string },
  ) {
    const user = client.data.user!;
    if (
      !payload ||
      typeof payload.groupId !== 'string' ||
      !payload.groupId ||
      typeof payload.content !== 'string' ||
      payload.content.length > 2000
    ) {
      throw new WsException('Invalid message payload');
    }
    if (!payload.content.trim() && !payload.imageUrl) {
      throw new WsException('A message or image is required');
    }
    if (payload.imageUrl) {
      try {
        const imageUrl = new URL(payload.imageUrl);
        if (imageUrl.protocol !== 'https:' && imageUrl.protocol !== 'http:') {
          throw new Error('Unsupported image URL protocol');
        }
      } catch {
        throw new WsException('Invalid image URL');
      }
    }

    const membership = await this.prisma.groupMember.findFirst({
      where: { userId: user.id, groupId: payload.groupId, isActive: true },
      select: { id: true },
    });
    if (!membership)
      throw new WsException('Not an active member of this group');

    // 1. Save message to database
    const message = await this.prisma.chatMessage.create({
      data: {
        groupId: payload.groupId,
        userId: user.id,
        content: payload.content,
        imageUrl: payload.imageUrl,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // 2. Broadcast to everyone in the room (including the sender)
    const roomName = `group_${payload.groupId}`;
    this.server.to(roomName).emit('newMessage', message);

    // 3. Send push notification to offline members
    const group = await this.prisma.group.findUnique({
      where: { id: payload.groupId },
      select: { name: true },
    });

    if (group) {
      void this.pushService
        .sendPushToGroupMembers(payload.groupId, user.id, {
          title: `New message in ${group.name}`,
          body: `${user.name}: ${payload.imageUrl ? 'sent an image' : payload.content}`,
          icon: user.avatarUrl || '/icon-192x192.png',
          url: `/groups/${payload.groupId}`,
        })
        .catch(() => this.logger.warn('Chat notification delivery failed'));
    }

    return { status: 'delivered' };
  }

  // ─── Helper: Extract token from handshake ───────────
  private extractTokenFromHandshake(client: AuthSocket): string | null {
    // Method 1: From the `auth` object (most reliable)
    const authToken = client.handshake.auth?.token;
    if (authToken) return authToken;

    // Method 2: From cookies (works because frontend sends withCredentials: true)
    // The handshake is an HTTP request, so cookies are available!
    const cookies = client.handshake.headers?.cookie;
    if (cookies) {
      const authCookie = cookies
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('auth_token='));
      if (authCookie) {
        return authCookie.split('=')[1];
      }
    }

    return null;
  }
}
