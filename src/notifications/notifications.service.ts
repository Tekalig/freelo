// notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NOTIFICATIONS_QUEUE,
  InvoiceNotificationJob,
} from './notifications.constant';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly notificationsQueue: Queue<InvoiceNotificationJob>,
  ) {}

  async queueInvoiceSent(invoiceId: string) {
    await this.notificationsQueue.add('invoice_sent', {
      type: 'invoice_sent',
      invoiceId,
    });
  }

  async queueInvoicePaid(invoiceId: string) {
    await this.notificationsQueue.add('invoice_paid', {
      type: 'invoice_paid',
      invoiceId,
    });
  }

  async queueInvoiceOverdue(invoiceId: string) {
    await this.notificationsQueue.add('invoice_overdue', {
      type: 'invoice_overdue',
      invoiceId,
    });
  }
}
