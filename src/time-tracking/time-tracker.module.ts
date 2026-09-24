import { Module } from '@nestjs/common';
import { TimeTrackingService } from './time-tracker.service';
import { TimeTrackingController } from './time-tracker.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeEntry } from './entities/time-entry.entity';
import { Project } from 'src/projects/entities/project.entity';
import { ProjectsService } from 'src/projects/projects.service';
import { ClientsService } from 'src/clients/clients.service';
import { Client } from 'src/clients/entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry, Project, Client])],
  controllers: [TimeTrackingController],
  providers: [TimeTrackingService, ProjectsService, ClientsService],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}
