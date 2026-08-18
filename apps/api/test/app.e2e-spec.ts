import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'node:crypto';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import { z } from 'zod';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('group ledger over HTTP', () => {
  let app: INestApplication<App>;
  let db: PrismaService;
  const emails: string[] = [];
  let groupId: string | undefined;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
    db = app.get(PrismaService);
  });
  afterAll(async () => {
    if (groupId) await db.group.delete({ where: { id: groupId } });
    if (db) await db.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  async function signIn() {
    const email = `${randomUUID()}@example.test`;
    emails.push(email);
    const otp = '380241';
    const otpHash = createHmac(
      'sha256',
      app.get(ConfigService).getOrThrow<string>('JWT_ACCESS_SECRET'),
    )
      .update(email)
      .update(':')
      .update(otp)
      .digest('hex');
    await db.passwordlessRequest.create({
      data: { email, otpHash, expiresAt: new Date(Date.now() + 60000) },
    });
    const session = request.agent(app.getHttpServer());
    const response = await session
      .post('/auth/passwordless/verify')
      .send({ email, otp })
      .expect(200);
    return {
      session,
      id: z.object({ user: z.object({ id: z.string() }) }).parse(response.body)
        .user.id,
    };
  }

  it('preserves paise from sign-in through editing, settlement review and deletion', async () => {
    const payer = await signIn();
    const guest = await signIn();
    const created = await payer.session
      .post('/groups')
      .send({ name: 'Shared lunch', category: 'FRIENDS' })
      .expect(201);
    const group = z
      .object({ group: z.object({ id: z.string(), inviteCode: z.string() }) })
      .parse(created.body).group;
    groupId = group.id;
    const path = `/groups/${groupId}`;
    await guest.session
      .post('/groups/join')
      .send({ inviteCode: group.inviteCode })
      .expect(201);
    const fields = {
      title: 'Lunch',
      paidById: payer.id,
      date: new Date().toISOString(),
      amount: 101,
      splits: [{ userId: guest.id, amount: 101 }],
    };
    const added = await payer.session
      .post(path + '/expenses')
      .send(fields)
      .expect(201);
    const expense =
      path + '/expenses/' + z.object({ id: z.string() }).parse(added.body).id;
    const balance = async () =>
      z
        .object({ group: z.object({ userBalance: z.number() }) })
        .parse((await payer.session.get(path).expect(200)).body).group
        .userBalance;
    expect(await balance()).toBe(1.01);
    await payer.session
      .patch(expense)
      .send({
        ...fields,
        splitMethod: 'EXACT',
        amount: 203,
        splits: [{ userId: guest.id, amount: 203 }],
      })
      .expect(200);
    expect(await balance()).toBe(2.03);
    const payment = await guest.session
      .post(path + '/settlements')
      .send({ payerId: guest.id, receiverId: payer.id, amount: 203 })
      .expect(201);
    const settlement = z
      .object({ settlement: z.object({ id: z.string(), status: z.string() }) })
      .parse(payment.body).settlement;
    expect(settlement.status).toBe('PENDING');
    expect(await balance()).toBe(2.03);
    const review = path + '/settlements/' + settlement.id;
    await Promise.all(
      [1, 2].map(() =>
        payer.session.patch(review).send({ status: 'CONFIRMED' }).expect(200),
      ),
    );
    expect(await balance()).toBe(0);
    const results = await Promise.all(
      [1, 2].map(() => payer.session.delete(expense)),
    );
    expect(results.map((response) => response.status).sort()).toEqual([
      200, 404,
    ]);
    expect(await balance()).toBe(-2.03);
    await payer.session.post('/auth/refresh').expect(200);
    await payer.session.post('/auth/logout').expect(200);
    await payer.session.get('/users/me').expect(401);
  });
});
