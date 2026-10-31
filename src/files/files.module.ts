import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { StorageService } from './storage.service';
import { Attachment } from './entities/file.entity';
import { ProjectsModule } from '../projects/projects.module';
import { InvoicingModule } from '../invoicing/invoice.module';
import storageConfig from '../config/storage.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    ConfigModule.forFeature(storageConfig),
    ProjectsModule,
    InvoicingModule,
  ],
  controllers: [FilesController],
  providers: [FilesService, StorageService],
  exports: [FilesService],
})
export class FilesModule {}
