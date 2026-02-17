import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JobsService } from '../src/jobs/jobs.service';
import { Job } from '../src/database/entities/job.entity';
import { Driver } from '../src/database/entities/driver.entity';
import { JobStatus } from '../src/common/enums/job-status.enum';
import { JobsGateway } from '../src/jobs/jobs.gateway';

describe('Jobs lifecycle integration', () => {
  let jobsService: JobsService;

  const jobs: any[] = [];
  const drivers: any[] = [
    {
      id: 'driver-1',
      accountId: 'driver-account-1',
      available: true,
      latitude: 51.5007,
      longitude: -0.1246,
    },
  ];

  const jobsRepoMock = {
    create: (data: any) => ({ id: `job-${jobs.length + 1}`, ...data }),
    save: async (job: any) => {
      const index = jobs.findIndex((j) => j.id === job.id);
      if (index === -1) jobs.push(job);
      else jobs[index] = { ...jobs[index], ...job };
      return job;
    },
    findOne: async ({ where }: any) => {
      const found = jobs.find((j) => j.id === where.id);
      if (!found) return null;
      if (where.id && 'assignedDriver' in found) return found;
      if (found.assignedDriverId) {
        return {
          ...found,
          assignedDriver: drivers.find((d) => d.id === found.assignedDriverId),
        };
      }
      return found;
    },
  };

  const driversRepoMock = {
    findOne: async ({ where }: any) => drivers.find((d) => d.id === where.id) ?? null,
    find: async () => drivers,
  };

  const jobsGatewayMock = {
    broadcastJobUpdate: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: getRepositoryToken(Job), useValue: jobsRepoMock },
        { provide: getRepositoryToken(Driver), useValue: driversRepoMock },
        { provide: JobsGateway, useValue: jobsGatewayMock },
      ],
    }).compile();

    jobsService = moduleRef.get(JobsService);
  });

  it('creates, assigns and transitions lifecycle in order', async () => {
    const created = await jobsService.create({
      customerId: 'customer-1',
      pickupAddress: 'A',
      dropoffAddress: 'B',
      pickupLatitude: 51.5074,
      pickupLongitude: -0.1278,
    });

    const assigned = await jobsService.assign(created.id);
    expect(assigned.assignedDriverId).toBe('driver-1');

    const accepted = await jobsService.updateStatus(assigned.id, JobStatus.ACCEPTED, {
      userId: 'driver-account-1',
      role: 'driver',
    });
    const arrived = await jobsService.updateStatus(accepted.id, JobStatus.ARRIVED, {
      userId: 'driver-account-1',
      role: 'driver',
    });
    const onTrip = await jobsService.updateStatus(arrived.id, JobStatus.ON_TRIP, {
      userId: 'driver-account-1',
      role: 'driver',
    });
    const completed = await jobsService.updateStatus(onTrip.id, JobStatus.COMPLETED, {
      userId: 'driver-account-1',
      role: 'driver',
    });

    expect(completed.status).toBe(JobStatus.COMPLETED);
  });
});
