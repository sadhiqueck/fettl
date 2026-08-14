import {
  ForbiddenException,
  NotFoundException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadsService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') || '';

    const endpoint = this.configService.get<string>('S3_ENDPOINT') || '';
    const accessKeyId =
      this.configService.get<string>('S3_ACCESS_KEY_ID') || '';
    const secretAccessKey =
      this.configService.get<string>('S3_SECRET_ACCESS_KEY') || '';
    const region = this.configService.get<string>('S3_REGION') || 'us-east-005';

    this.s3Client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    userId: string,
    groupId: string | undefined,
    contentType: string,
  ) {
    if (
      groupId !== undefined &&
      (typeof groupId !== 'string' ||
        !groupId ||
        !(await this.prisma.groupMember.count({
          where: { groupId, userId, isActive: true },
        })))
    ) {
      throw new ForbiddenException(
        'Only active group members may upload here.',
      );
    }
    try {
      const key = `${randomUUID()}.${contentType.split('/')[1]}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      });

      // Upload directly from the backend to Backblaze B2
      await this.s3Client.send(command);
      await this.prisma.uploadAccess.create({
        data: { key, ...(groupId ? { groupId } : { ownerId: userId }) },
      });

      // Return a URL pointing to our OWN backend, which will redirect to S3
      const apiUrl = (
        this.configService.get<string>('API_URL') || 'http://localhost:3000'
      ).replace(/\/$/, '');
      return {
        fileUrl: `${apiUrl}/uploads/${key}`,
      };
    } catch (error) {
      console.error('Error uploading file to B2:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async getPresignedDownloadUrl(key: string, userId: string): Promise<string> {
    const membership = { members: { some: { userId, isActive: true } } };
    const allowed = await this.prisma.uploadAccess.findFirst({
      where: {
        key,
        OR: [
          { ownerId: userId },
          { group: membership },
          {
            owner: {
              avatarUrl: { endsWith: `/uploads/${key}` },
              groupMemberships: { some: { isActive: true, group: membership } },
            },
          },
        ],
      },
      select: { id: true },
    });
    if (!allowed) throw new NotFoundException('File not found');
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      // URL expires in 15 minutes
      return await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
    } catch (error) {
      console.error('Error generating presigned download URL:', error);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }
}
