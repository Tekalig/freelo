import { forwardRef, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { BullModule } from '@nestjs/bullmq';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigModule, ConfigType } from '@nestjs/config';
import mailerConfig from 'src/config/mailer.config';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationLog } from './entities/notification-log.entity';
import { REDIS_QUEUE_CLIENT } from 'src/redis/redis.constant';
import { NOTIFICATIONS_QUEUE } from './notifications.constant';
import { Redis } from 'ioredis';
import { NotificationsProcessor } from './notifications.processor';
import { OverdueInvoicesCron } from './overdue-invoices.cron';
import { RedisModule } from 'src/redis/redis.module';
import { Invoice } from 'src/invoicing/entities/invoice.entity';
import { InvoiceService } from 'src/invoicing/invoice.service';
import { Payment } from 'src/invoicing/entities/payment.entity';
import { InvoicingModule } from 'src/invoicing/invoice.module';
import { ProjectsService } from 'src/projects/projects.service';
import { TimeTrackingService } from 'src/time-tracking/time-tracker.service';
import { Project } from 'src/projects/entities/project.entity';
import { ClientsService } from 'src/clients/clients.service';
import { TimeEntry } from 'src/time-tracking/entities/time-entry.entity';
import { Client } from 'src/clients/entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationLog,
      Invoice,
      Payment,
      Project,
      TimeEntry,
      Client,
    ]),
    BullModule.registerQueueAsync({
      name: NOTIFICATIONS_QUEUE,
      inject: [REDIS_QUEUE_CLIENT],
      imports: [RedisModule],
      useFactory: (redisClient: Redis) => ({
        connection: redisClient,
      }),
    }),
    ConfigModule.forFeature(mailerConfig),
    MailerModule.forRootAsync({
      inject: [mailerConfig.KEY],
      useFactory: (config: ConfigType<typeof mailerConfig>) => ({
        transport: {
          host: config.host,
          port: config.port,
          auth: { user: config.user, pass: config.pass },
        },
        defaults: { from: config.from },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
      imports: undefined,
    }),
    forwardRef(() => InvoicingModule),
  ],
  providers: [
    NotificationsService,
    OverdueInvoicesCron,
    NotificationsProcessor,
    InvoiceService,
    ProjectsService,
    TimeTrackingService,
    ClientsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
