import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './entities/file.entity';
import { StorageService } from './storage.service';
import { ProjectsService } from '../projects/projects.service';
import { InvoiceService } from '../invoicing/invoice.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: Repository<Attachment>,
    private readonly storageService: StorageService,
    private readonly projectsService: ProjectsService,
    private readonly invoiceService: InvoiceService,
  ) {}

  async upload(
    userId: string,
    file: Express.Multer.File,
    dto: { projectId?: string; invoiceId?: string },
  ) {
    if (!dto.projectId && !dto.invoiceId) {
      throw new BadRequestException(
        'Must attach to either a project or an invoice',
      );
    }
    if (dto.projectId && dto.invoiceId) {
      throw new BadRequestException(
        'Attach to only one: a project OR an invoice, not both',
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File exceeds maximum size of 10MB');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    // ownership checks — throws 404 if the project/invoice isn't the user's own
    if (dto.projectId)
      await this.projectsService.findOne(userId, dto.projectId);
    if (dto.invoiceId) await this.invoiceService.findOne(userId, dto.invoiceId);

    const { fileKey } = await this.storageService.upload(userId, file);

    const attachment = this.attachmentsRepository.create({
      user: { id: userId },
      project: dto.projectId ? { id: dto.projectId } : null,
      invoice: dto.invoiceId ? { id: dto.invoiceId } : null,
      fileKey,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    return this.attachmentsRepository.save(attachment);
  }

  async findAllForUser(userId: string, projectId?: string, invoiceId?: string) {
    const where: any = { user: { id: userId } };
    if (projectId) where.project = { id: projectId };
    if (invoiceId) where.invoice = { id: invoiceId };

    return this.attachmentsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getDownloadUrl(userId: string, id: string) {
    const attachment = await this.attachmentsRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    const url = await this.storageService.getDownloadUrl(attachment.fileKey);
    return { url, fileName: attachment.fileName };
  }

  async remove(userId: string, id: string) {
    const attachment = await this.attachmentsRepository.findOne({
      where: { id, user: { id: userId } },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    await this.storageService.delete(attachment.fileKey);
    return this.attachmentsRepository.remove(attachment);
  }
}
