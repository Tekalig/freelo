import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import redisConfig from 'src/config/redis.config';
import { REDIS_QUEUE_CLIENT, REDIS_SESSION_CLIENT } from './redis.constant';
import Redis from 'ioredis';
import { createClient, RedisClientType } from 'redis';

@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [
    {
      provide: REDIS_QUEUE_CLIENT,
      inject: [redisConfig.KEY],
      useFactory: (config: ConfigType<typeof redisConfig>): Redis => {
        const client = new Redis({
          host: config.host,
          port: config.port,
        });
        client.on('error', (err) => {
          console.error('Redis(queue) client error: ', err);
        });

        return client;
      },
    },
    {
      provide: REDIS_SESSION_CLIENT,
      inject: [redisConfig.KEY],
      useFactory: async (
        config: ConfigType<typeof redisConfig>,
      ): Promise<RedisClientType> => {
        const client = createClient({
          url: `redis://${config.host}:${config.port}`,
        });
        client.on('error', (err) => {
          console.error('Redis(session) client error: ', err);
        });
        await client.connect();
        return client;
      },
    },
  ],
  exports: [REDIS_SESSION_CLIENT, REDIS_QUEUE_CLIENT],
})
export class RedisModule {}
