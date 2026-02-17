import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../database/entities/driver.entity';
import { UpdateLocationDto } from './dto/update-location.dto';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driversRepo: Repository<Driver>,
    private readonly redisService: RedisService,
  ) {}

  async updateLocation(
    driverId: string,
    dto: UpdateLocationDto,
    requester: { userId: string; role: string },
  ) {
    const driver = await this.driversRepo.findOne({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');

    if (requester.role === 'driver' && driver.accountId !== requester.userId) {
      throw new ForbiddenException('Driver can only update own location');
    }

    driver.latitude = dto.latitude;
    driver.longitude = dto.longitude;
    driver.lastGpsAt = new Date();

    const saved = await this.driversRepo.save(driver);
    await this.redisService.setDriverLocation(saved.id, dto.latitude, dto.longitude);
    return saved;
  }
}
