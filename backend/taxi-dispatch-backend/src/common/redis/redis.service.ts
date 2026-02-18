import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client?: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.client = new Redis(redisUrl, { lazyConnect: true });
      this.client.connect().catch(() => undefined);
    }
  }

  async setDriverLocation(driverId: string, latitude: number, longitude: number): Promise<void> {
    if (!this.client) return;
    const key = `drivers:active:${driverId}`;
    await this.client.set(
      key,
      JSON.stringify({ latitude, longitude, updatedAt: new Date().toISOString() }),
      'EX',
      120,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }
}
