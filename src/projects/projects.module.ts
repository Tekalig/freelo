import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ClientsService } from 'src/clients/clients.service';
import { Client } from 'src/clients/entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Client])],
  controllers: [ProjectsController],
  providers: [ProjectsService, ClientsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
