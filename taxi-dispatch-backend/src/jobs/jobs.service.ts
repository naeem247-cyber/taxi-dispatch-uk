import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../database/entities/job.entity';
import { Driver } from '../database/entities/driver.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { JobStatus } from '../common/enums/job-status.enum';
import { JobsGateway } from './jobs.gateway';

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
    private readonly jobsGateway: JobsGateway,
  ) {}

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
    this.jobsGateway.broadcastJobUpdate({ event: 'job.created', job: saved });
    return saved;
  }

  async assign(jobId: string, driverId?: string) {
    const job = await this.jobsRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const driver = driverId
      ? await this.getAvailableDriver(driverId)
      : await this.findNearestAvailableDriver(job);

    job.assignedDriverId = driver.id;
    const saved = await this.jobsRepo.save(job);
    this.jobsGateway.broadcastJobUpdate({ event: 'job.assigned', job: saved });
    return saved;
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
    this.jobsGateway.broadcastJobUpdate({ event: 'job.status_changed', job: saved });
    return saved;
  }

  private async getAvailableDriver(driverId: string): Promise<Driver> {
    const driver = await this.driversRepo.findOne({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    if (!driver.available) throw new BadRequestException('Driver is not available');
    if (driver.latitude == null || driver.longitude == null) {
      throw new BadRequestException('Driver has no GPS coordinates');
    }
    return driver;
  }

  private async findNearestAvailableDriver(job: Job): Promise<Driver> {
    if (job.pickupLatitude == null || job.pickupLongitude == null) {
      throw new BadRequestException('Job is missing pickup coordinates for nearest-driver assignment');
    }

    const drivers = await this.driversRepo.find({ where: { available: true } });
    const withCoords = drivers.filter((d) => d.latitude != null && d.longitude != null);

    if (withCoords.length === 0) {
      throw new BadRequestException('No available drivers with GPS coordinates found');
    }

    let nearest = withCoords[0];
    let bestDistance = this.haversineKm(
      Number(job.pickupLatitude),
      Number(job.pickupLongitude),
      Number(nearest.latitude),
      Number(nearest.longitude),
    );

    for (const d of withCoords.slice(1)) {
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
