import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { encryptVpa, decryptVpaSafe } from '../common/utils/encryption';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        vpa: true,
        avatarUrl: true,
        isOnboarded: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Decrypt VPA before returning to the client
    return { ...user, vpa: decryptVpaSafe(user.vpa) };
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      avatarUrl?: string;
      vpa?: string | null;
      phone?: string | null;
      isOnboarded?: boolean;
    },
  ) {
    // Encrypt VPA before storing in the database
    const dbData = {
      ...data,
      ...(data.vpa !== undefined
        ? { vpa: data.vpa ? encryptVpa(data.vpa) : null }
        : {}),
    };

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: dbData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          vpa: true,
          avatarUrl: true,
          isOnboarded: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Decrypt VPA before returning to the client
      return { ...user, vpa: decryptVpaSafe(user.vpa) };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        error.meta?.target &&
        (error.meta.target as string[]).includes('phone')
      ) {
        throw new ConflictException(
          'This phone number is already in use by another account',
        );
      }
      throw error;
    }
  }

  async searchUsers(query: string, userId: string) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          {
            name: { contains: query, mode: 'insensitive' },
            groupMemberships: {
              some: {
                isActive: true,
                group: { members: { some: { userId, isActive: true } } },
              },
            },
          },
          { email: { equals: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
      take: 10,
    });
  }
}
