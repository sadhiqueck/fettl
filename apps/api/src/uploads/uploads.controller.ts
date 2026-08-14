import {
  Controller,
  Query,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { GetUser } from '../common/decorators/get-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Response } from 'express';

interface UploadedFileData {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|gif|webp|heic|heif)$/,
          }),
        ],
      }),
    )
    file: UploadedFileData,
    @GetUser('id') userId: string,
    @Query('groupId') groupId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.uploadsService.uploadFile(
      file.buffer,
      userId,
      groupId,
      file.mimetype,
    );
  }

  @Get(':key')
  @UseGuards(JwtAuthGuard)
  async getFile(
    @Param('key') key: string,
    @GetUser('id') userId: string,
    @Res() res: Response,
  ) {
    if (!key) {
      throw new BadRequestException('File key is required');
    }

    // Generate a temporary presigned URL for this private file
    const url = await this.uploadsService.getPresignedDownloadUrl(key, userId);

    // Redirect the browser to the secure B2 URL
    return res.redirect(302, url);
  }
}
