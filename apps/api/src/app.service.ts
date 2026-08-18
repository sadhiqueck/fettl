import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  status() {
    return { service: 'fettl-api', status: 'ok' };
  }
}
