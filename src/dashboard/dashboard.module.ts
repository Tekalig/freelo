// dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Invoice } from '../invoicing/entities/invoice.entity';
import { TimeEntry } from '../time-tracking/entities/time-entry.entity';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, TimeEntry, Project])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
