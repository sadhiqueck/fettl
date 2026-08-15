import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { AuthSocket } from '../chat.gateway';

@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (!context.switchToWs().getClient<AuthSocket>().data.user)
      throw new WsException('Authentication required');
    return true;
  }
}
