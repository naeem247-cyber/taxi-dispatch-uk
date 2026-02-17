import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../database/entities/driver.entity';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driversRepo: Repository<Driver>,
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

    return this.driversRepo.save(driver);
  }
}
