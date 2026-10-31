// dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../invoicing/entities/invoice.entity';
import { TimeEntry } from '../time-tracking/entities/time-entry.entity';
import { Project } from '../projects/entities/project.entity';
import { InvoiceStatus } from 'src/invoicing/enums/invoice-status.enum';
import { ProjectStatus } from 'src/projects/enums/project-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(TimeEntry)
    private readonly timeEntriesRepository: Repository<TimeEntry>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  async getStats(userId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [revenueThisMonth, outstanding, hoursThisWeek, activeProjects] =
      await Promise.all([
        this.invoicesRepository
          .createQueryBuilder('invoice')
          .select('COALESCE(SUM(invoice.total), 0)', 'sum')
          .where('invoice.user_id = :userId', { userId })
          .andWhere('invoice.status = :status', { status: InvoiceStatus.Paid })
          .andWhere('invoice.updated_at >= :startOfMonth', { startOfMonth })
          .getRawOne(),

        this.invoicesRepository
          .createQueryBuilder('invoice')
          .select('COALESCE(SUM(invoice.total), 0)', 'sum')
          .addSelect('COUNT(invoice.id)', 'count')
          .where('invoice.user_id = :userId', { userId })
          .andWhere('invoice.status IN (:...statuses)', {
            statuses: [InvoiceStatus.Sent, InvoiceStatus.Overdue],
          })
          .getRawOne(),

        this.timeEntriesRepository
          .createQueryBuilder('entry')
          .select('COALESCE(SUM(entry.duration_minutes), 0)', 'minutes')
          .where('entry.user_id = :userId', { userId })
          .andWhere('entry.started_at >= :startOfWeek', { startOfWeek })
          .getRawOne(),

        this.projectsRepository.count({
          where: { user: { id: userId }, status: ProjectStatus.Active },
        }),
      ]);

    return {
      revenueThisMonthCents: parseInt(revenueThisMonth.sum, 10),
      outstandingInvoices: {
        count: parseInt(outstanding.count, 10),
        totalCents: parseInt(outstanding.sum, 10),
      },
      hoursThisWeek:
        Math.round((parseInt(hoursThisWeek.minutes, 10) / 60) * 100) / 100,
      activeProjects,
    };
  }
}
