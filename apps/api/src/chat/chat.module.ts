import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    PushModule,
    // We need JwtModule to verify tokens in both the Gateway and the Guard
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ChatGateway, WsJwtGuard],
  exports: [ChatGateway], // Export so other modules can broadcast events
})
export class ChatModule {}
