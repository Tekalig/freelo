import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import passport from 'passport';
import { REDIS_SESSION_CLIENT } from './redis/redis.constant';
import { RedisClientType } from 'redis';
import { json, raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const redisClient: RedisClientType = app.get(REDIS_SESSION_CLIENT);

  app.use(
    session({
      store: new RedisStore({ client: redisClient, prefix: 'freelo-session:' }),
      secret: Buffer.from(process.env.SESSION_SECRET as string),
      resave: false,
      saveUninitialized: false,
      cookie: {
        sameSite: true,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());
  app.use('/api/webhooks/stripe', raw({ type: 'application/json' }));
  app.use(json());

  const configSwagger = new DocumentBuilder()
    .setTitle('Freelo API')
    .setDescription('Freelance Business Management Platform API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { withCredentials: true, persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
