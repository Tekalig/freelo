// files/files.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiCookieAuth, ApiTags, ApiBody } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { ActiveUser } from '../iam/decorators/active-user.decorator';
import { Action } from '../iam/authorization/action.enum';
import { CheckPolicies } from 'src/iam/authorization/decorators/policies.decorator';

@ApiTags('files')
@ApiCookieAuth()
@CheckPolicies((ability) => ability.can(Action.Manage, 'Attachment'))
@Controller('attachments')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        projectId: { type: 'string' },
        invoiceId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @ActiveUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadAttachmentDto,
  ) {
    return this.filesService.upload(userId, file, dto);
  }

  @Get()
  findAll(
    @ActiveUser('userId') userId: string,
    @Query('projectId') projectId?: string,
    @Query('invoiceId') invoiceId?: string,
  ) {
    return this.filesService.findAllForUser(userId, projectId, invoiceId);
  }

  @Get(':id/download')
  getDownloadUrl(
    @ActiveUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.filesService.getDownloadUrl(userId, id);
  }

  @Delete(':id')
  remove(@ActiveUser('userId') userId: string, @Param('id') id: string) {
    return this.filesService.remove(userId, id);
  }
}
