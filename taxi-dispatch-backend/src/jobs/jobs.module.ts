import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../database/entities/job.entity';
import { Driver } from '../database/entities/driver.entity';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsGateway } from './jobs.gateway';
import { Vehicle } from '../database/entities/vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Driver, Vehicle])],
  controllers: [JobsController],
  providers: [JobsService, JobsGateway],
})
export class JobsModule {}
