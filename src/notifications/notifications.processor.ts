// notifications/notifications.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import {
  NOTIFICATIONS_QUEUE,
  InvoiceNotificationJob,
} from './notifications.constant';
import { NotificationLog } from './entities/notification-log.entity';
import { InvoiceService } from '../invoicing/invoice.service';
import {
  NotificationType,
  NotificationStatus,
} from './enums/notifications.enum';

@Injectable()
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  constructor(
    private readonly mailerService: MailerService,
    private readonly invoiceService: InvoiceService,
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepository: Repository<NotificationLog>,
  ) {
    super();
  }

  async process(job: Job<InvoiceNotificationJob>) {
    const { type, invoiceId } = job.data;

    const invoice = await this.invoiceService.findOneRaw(invoiceId);
    if (!invoice) return;

    const log = this.notificationLogRepository.create({
      user: { id: invoice.user.id } as any,
      type: type as NotificationType,
      recipientEmail: invoice.client.email,
      status: NotificationStatus.Queued,
    });
    await this.notificationLogRepository.save(log);

    try {
      const templateMap: Record<string, string> = {
        invoice_sent: 'invoice-sent',
        invoice_paid: 'invoice-paid',
        invoice_overdue: 'invoice-overdue',
      };

      await this.mailerService.sendMail({
        to: type === 'invoice_paid' ? invoice.user.email : invoice.client.email, // paid confirmation goes to the freelancer, not the client
        subject: this.subjectFor(type, invoice.invoiceNumber),
        template: templateMap[type],
        context: {
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.client.name,
          userName: invoice.user.email,
          amount: `${(invoice.total / 100).toFixed(2)} ${invoice.currency}`,
          dueDate: invoice.dueDate,
          paymentLink: invoice.stripePaymentLinkUrl,
        },
      });

      log.status = NotificationStatus.Sent;
      log.sentAt = new Date();
    } catch (err) {
      log.status = NotificationStatus.Failed;
      log.errorMessage = err.message;
    }

    await this.notificationLogRepository.save(log);
  }

  private subjectFor(type: string, invoiceNumber: string): string {
    switch (type) {
      case 'invoice_sent':
        return `Invoice ${invoiceNumber} from Freelo`;
      case 'invoice_paid':
        return `Payment received for ${invoiceNumber}`;
      case 'invoice_overdue':
        return `Invoice ${invoiceNumber} is overdue`;
      default:
        return `Invoice ${invoiceNumber} update`;
    }
  }
}
