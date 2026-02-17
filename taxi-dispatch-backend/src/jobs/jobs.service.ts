import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      status: JobStatus.REQUESTED,
    });

    const saved = await this.jobsRepo.save(job);
    this.jobsGateway.broadcastJobUpdate({ event: 'job.created', job: saved });
    return saved;
  }

  async assign(jobId: string, driverId: string) {
    const [job, driver] = await Promise.all([
      this.jobsRepo.findOne({ where: { id: jobId } }),
      this.driversRepo.findOne({ where: { id: driverId } }),
    ]);

    if (!job) throw new NotFoundException('Job not found');
    if (!driver) throw new NotFoundException('Driver not found');
    if (!driver.available) throw new BadRequestException('Driver is not available');

    job.assignedDriverId = driver.id;
    const saved = await this.jobsRepo.save(job);
    this.jobsGateway.broadcastJobUpdate({ event: 'job.assigned', job: saved });
    return saved;
  }

  async updateStatus(jobId: string, nextStatus: JobStatus) {
    const job = await this.jobsRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const validNext = ALLOWED_TRANSITIONS[job.status] ?? [];
    if (!validNext.includes(nextStatus)) {
      throw new BadRequestException(`Invalid transition: ${job.status} -> ${nextStatus}`);
    }

    job.status = nextStatus;
    const saved = await this.jobsRepo.save(job);
    this.jobsGateway.broadcastJobUpdate({ event: 'job.status_changed', job: saved });
    return saved;
  }
}
