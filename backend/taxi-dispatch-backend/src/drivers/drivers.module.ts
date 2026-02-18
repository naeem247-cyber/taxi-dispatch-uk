import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from '../database/entities/driver.entity';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { RedisModule } from '../common/redis/redis.module';
import { Vehicle } from '../database/entities/vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, Vehicle]), RedisModule],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}
