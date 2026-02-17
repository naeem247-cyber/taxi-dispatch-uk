import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Job } from '../database/entities/job.entity';
import { Driver } from '../database/entities/driver.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { JobStatus } from '../common/enums/job-status.enum';
import { JobsGateway } from './jobs.gateway';
import { DriverStatus } from '../common/enums/driver-status.enum';

const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.REQUESTED]: [JobStatus.ACCEPTED],
  [JobStatus.ACCEPTED]: [JobStatus.ARRIVED],
  [JobStatus.ARRIVED]: [JobStatus.ON_TRIP],
  [JobStatus.ON_TRIP]: [JobStatus.COMPLETED],
  [JobStatus.COMPLETED]: [],
};

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobsRepo: Repository<Job>,
    @InjectRepository(Driver) private readonly driversRepo: Repository<Driver>,
    private readonly dataSource: DataSource,
    private readonly jobsGateway: JobsGateway,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(JobsService.name);
  }

  async create(dto: CreateJobDto) {
    const job = this.jobsRepo.create({
      customerId: dto.customerId,
      pickupAddress: dto.pickupAddress,
      dropoffAddress: dto.dropoffAddress,
      pickupLatitude: dto.pickupLatitude,
      pickupLongitude: dto.pickupLongitude,
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      status: JobStatus.REQUESTED,
    });

    const saved = await this.jobsRepo.save(job);
    this.logger.info({ job_id: saved.id, status: saved.status }, 'job created');
    this.jobsGateway.broadcastJobCreated(saved);
    return saved;
  }

  async assign(jobId: string, driverId?: string) {
    return this.dataSource.transaction(async (manager) => {
      const jobRepo = manager.getRepository(Job);
      const driverRepo = manager.getRepository(Driver);

      const job = await jobRepo
        .createQueryBuilder('job')
        .setLock('pessimistic_write')
        .where('job.id = :jobId', { jobId })
        .andWhere('job.deleted_at IS NULL')
        .getOne();

      if (!job) throw new NotFoundException('Job not found');
      if (job.assignedDriverId) throw new ConflictException('Job already assigned');

      const driver = driverId
        ? await this.getSpecificAssignableDriver(driverRepo, driverId)
        : await this.findNearestAssignableDriver(driverRepo, job);

      job.assignedDriverId = driver.id;
      driver.status = DriverStatus.RESERVED;

      const [savedJob] = await Promise.all([jobRepo.save(job), driverRepo.save(driver)]);
      this.logger.info({ job_id: savedJob.id, driver_id: driver.id }, 'job assigned');
      this.jobsGateway.broadcastJobAssigned(savedJob, driver.id);
      return savedJob;
    });
  }

  async updateStatus(jobId: string, nextStatus: JobStatus, requester: { userId: string; role: string }) {
    const job = await this.jobsRepo.findOne({ where: { id: jobId }, relations: ['assignedDriver'] });
    if (!job) throw new NotFoundException('Job not found');

    if (requester.role === 'driver') {
      if (!job.assignedDriverId || !job.assignedDriver || job.assignedDriver.accountId !== requester.userId) {
        throw new ForbiddenException('Driver can only update own assigned jobs');
      }
    }

    const validNext = ALLOWED_TRANSITIONS[job.status] ?? [];
    if (!validNext.includes(nextStatus)) {
      throw new BadRequestException(`Invalid transition: ${job.status} -> ${nextStatus}`);
    }

    job.status = nextStatus;
    const saved = await this.jobsRepo.save(job);

    if (saved.assignedDriverId && (nextStatus === JobStatus.ON_TRIP || nextStatus === JobStatus.COMPLETED)) {
      const driver = await this.driversRepo.findOne({ where: { id: saved.assignedDriverId } });
      if (driver) {
        driver.status = nextStatus === JobStatus.ON_TRIP ? DriverStatus.ON_TRIP : DriverStatus.AVAILABLE;
        await this.driversRepo.save(driver);
      }
    }

    this.logger.info({ job_id: saved.id, status: saved.status }, 'job status changed');
    this.jobsGateway.broadcastJobStatusChanged(saved);
    return saved;
  }

  private async getSpecificAssignableDriver(driverRepo: Repository<Driver>, driverId: string): Promise<Driver> {
    const driver = await driverRepo
      .createQueryBuilder('driver')
      .setLock('pessimistic_write')
      .where('driver.id = :driverId', { driverId })
      .getOne();

    if (!driver) throw new NotFoundException('Driver not found');
    if (driver.status !== DriverStatus.AVAILABLE) {
      throw new BadRequestException('Driver is not available for assignment');
    }
    if (driver.latitude == null || driver.longitude == null) {
      throw new BadRequestException('Driver has no GPS coordinates');
    }

    return driver;
  }

  private async findNearestAssignableDriver(driverRepo: Repository<Driver>, job: Job): Promise<Driver> {
    if (job.pickupLatitude == null || job.pickupLongitude == null) {
      throw new BadRequestException('Job is missing pickup coordinates for nearest-driver assignment');
    }

    const candidates = await driverRepo
      .createQueryBuilder('driver')
      .setLock('pessimistic_write')
      .where('driver.status = :status', { status: DriverStatus.AVAILABLE })
      .andWhere('driver.latitude IS NOT NULL')
      .andWhere('driver.longitude IS NOT NULL')
      .getMany();

    if (candidates.length === 0) {
      throw new BadRequestException('No available drivers with GPS coordinates found');
    }

    let nearest = candidates[0];
    let bestDistance = this.haversineKm(
      Number(job.pickupLatitude),
      Number(job.pickupLongitude),
      Number(nearest.latitude),
      Number(nearest.longitude),
    );

    for (const d of candidates.slice(1)) {
      const dist = this.haversineKm(
        Number(job.pickupLatitude),
        Number(job.pickupLongitude),
        Number(d.latitude),
        Number(d.longitude),
      );
      if (dist < bestDistance) {
        bestDistance = dist;
        nearest = d;
      }
    }

    return nearest;
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
