// notifications/overdue-invoices.cron.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Invoice } from '../invoicing/entities/invoice.entity';
import { NotificationsService } from './notifications.service';
import { InvoiceStatus } from 'src/invoicing/enums/invoice-status.enum';

@Injectable()
export class OverdueInvoicesCron {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkOverdueInvoices() {
    const today = new Date().toISOString().slice(0, 10);
    const overdueInvoices = await this.invoicesRepository.find({
      where: { status: InvoiceStatus.Sent, dueDate: LessThan(today) },
    });

    for (const invoice of overdueInvoices) {
      invoice.status = InvoiceStatus.Overdue;
      await this.invoicesRepository.save(invoice);
      await this.notificationsService.queueInvoiceOverdue(invoice.id);
    }
  }
}
