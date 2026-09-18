import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { IamModule } from './iam/iam.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from './clients/clients.module';
import { RedisModule } from './redis/redis.module';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import googleConfig from './config/google.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, jwtConfig, redisConfig, googleConfig],
      validationSchema: joi.object({
        NODE_ENV: joi.string().valid('dev', 'test', 'pro').default('dev'),
        DB_HOST: joi.string().required(),
        DB_PORT: joi.number().default(5432).required(),
        DB_USERNAME: joi.string().required(),
        DB_PASSWORD: joi.string().required(),
        DB_DATABASE: joi.string().required(),
        JWT_SECRET: joi.string().required(),
        JWT_REFRESH_SECRET: joi.string().required(),
        JWT_TOKEN_AUDIENCE: joi.string().required(),
        JWT_TOKEN_ISSUER: joi.string().required(),
        JWT_ACCESS_TOKEN_TTL: joi.number().default(3600).required(),
        GOOGLE_CLIENT_ID: joi.string().required(),
        GOOGLE_CLIENT_SECRET: joi.string().required(),
        GITHUB_CLIENT_ID: joi.string().required(),
        GITHUB_CLIENT_SECRET: joi.string().required(),
        FA_APP_NAME: joi.string().required(),
        REDIS_HOST: joi.string().required(),
        REDIS_PORT: joi.number().default(6379).required(),
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
    UsersModule,
    IamModule,
    ClientsModule,
    RedisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
