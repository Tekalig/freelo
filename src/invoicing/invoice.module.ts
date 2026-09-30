import { forwardRef, Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoicingController } from './invoice.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { InvoiceLineItem } from './entities/invoice-line-item.entity';
import { Client } from 'src/clients/entities/client.entity';
import { ConfigModule } from '@nestjs/config';
import { InvoicePdfService } from './invoice-pdf.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import stripeConfig from 'src/config/stripe.config';
import { ProjectsModule } from 'src/projects/projects.module';
import { TimeTrackingModule } from 'src/time-tracking/time-tracker.module';
import businessProfileConfig from 'src/config/business-profile.config';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { NOTIFICATIONS_QUEUE } from 'src/notifications/notifications.constant';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Payment, InvoiceLineItem, Client]),
    ConfigModule.forFeature(stripeConfig),
    ConfigModule.forFeature(businessProfileConfig),
    ProjectsModule,
    TimeTrackingModule,
    BullModule.registerQueue({
      name: NOTIFICATIONS_QUEUE,
    }),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [InvoicingController, StripeWebhookController],
  providers: [InvoiceService, InvoicePdfService, NotificationsService],
  exports: [InvoiceService],
})
export class InvoicingModule {}
