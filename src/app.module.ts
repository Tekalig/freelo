import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { IamModule } from './iam/iam.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from './clients/clients.module';
import { RedisModule } from './redis/redis.module';
import { ProjectsModule } from './projects/projects.module';
import { TimeTrackingModule } from './time-tracking/time-tracker.module';
import { InvoicingModule } from './invoicing/invoice.module';
import { NotificationsModule } from './notifications/notifications.module';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import googleConfig from './config/google.config';
import stripeConfig from './config/stripe.config';
import mailerConfig from './config/mailer.config';
import { ScheduleModule } from '@nestjs/schedule';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        databaseConfig,
        redisConfig,
        googleConfig,
        stripeConfig,
        mailerConfig,
      ],
      validationSchema: joi.object({
        NODE_ENV: joi.string().valid('dev', 'test', 'pro').default('dev'),
        DB_HOST: joi.string().required(),
        DB_PORT: joi.number().default(5432).required(),
        DB_USERNAME: joi.string().required(),
        DB_PASSWORD: joi.string().required(),
        DB_DATABASE: joi.string().required(),
        GOOGLE_CLIENT_ID: joi.string().required(),
        GOOGLE_CLIENT_SECRET: joi.string().required(),
        GITHUB_CLIENT_ID: joi.string().required(),
        GITHUB_CLIENT_SECRET: joi.string().required(),
        FA_APP_NAME: joi.string().required(),
        REDIS_HOST: joi.string().required(),
        REDIS_PORT: joi.number().default(6379).required(),
        STRIPE_WEBHOOK_SECRET: joi.string().required(),
        STRIPE_SECRET_KEY: joi.string().required(),
        MAIL_HOST: joi.string().required(),
        MAIL_PORT: joi.number().default(587).required(),
        MAIL_USER: joi.string().required(),
        MAIL_PASSWORD: joi.string().required(),
        MAIL_FROM: joi.string().required(),
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('db.host'),
        port: config.get('db.port'),
        username: config.get('db.username'),
        password: config.get('db.password'),
        database: config.get('db.database'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    IamModule,
    ClientsModule,
    RedisModule,
    ProjectsModule,
    TimeTrackingModule,
    InvoicingModule,
    NotificationsModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
