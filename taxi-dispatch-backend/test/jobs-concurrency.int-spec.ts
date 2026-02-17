import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JobsService } from '../src/jobs/jobs.service';
import { Job } from '../src/database/entities/job.entity';
import { Driver } from '../src/database/entities/driver.entity';
import { DriverStatus } from '../src/common/enums/driver-status.enum';
import { JobsGateway } from '../src/jobs/jobs.gateway';

describe('Jobs assignment concurrency', () => {
  let jobsService: JobsService;

  const jobs: any[] = [
    {
      id: 'job-1',
      customerId: 'customer-1',
      pickupLatitude: 51.5074,
      pickupLongitude: -0.1278,
      assignedDriverId: null,
      status: 'requested',
    },
  ];

  const drivers: any[] = [
    {
      id: 'driver-1',
      status: DriverStatus.AVAILABLE,
      latitude: 51.5007,
      longitude: -0.1246,
    },
  ];

  const jobsRepoMock = {
    create: jest.fn(),
    save: async (job: any) => {
      const idx = jobs.findIndex((j) => j.id === job.id);
      jobs[idx] = { ...jobs[idx], ...job };
      return jobs[idx];
    },
    findOne: async ({ where }: any) => jobs.find((j) => j.id === where.id) ?? null,
  };

  const driversRepoMock = {
    findOne: async ({ where }: any) => drivers.find((d) => d.id === where.id) ?? null,
    save: async (driver: any) => {
      const idx = drivers.findIndex((d) => d.id === driver.id);
      drivers[idx] = { ...drivers[idx], ...driver };
      return drivers[idx];
    },
  };

  const txJobsRepo = {
    createQueryBuilder: () => {
      const builder: any = {
        setLock: () => builder,
        where: (_: string, params: any) => {
          builder.jobId = params.jobId;
          return builder;
        },
        getOne: async () => jobs.find((j) => j.id === builder.jobId) ?? null,
      };
      return builder;
    },
    save: jobsRepoMock.save,
  };

  const txDriversRepo = {
    createQueryBuilder: () => {
      const builder: any = {
        setLock: () => builder,
        where: (_: string, params: any) => {
          builder.driverId = params?.driverId;
          return builder;
        },
        andWhere: () => builder,
        getOne: async () => drivers.find((d) => d.id === builder.driverId) ?? null,
        getMany: async () => drivers.filter((d) => d.status === DriverStatus.AVAILABLE),
      };
      return builder;
    },
    save: driversRepoMock.save,
  };

  let txQueue = Promise.resolve();
  const dataSourceMock = {
    transaction: async (work: (manager: any) => Promise<any>) => {
      const run = async () =>
        work({
          getRepository: (entity: any) => {
            if (entity === Job) return txJobsRepo;
            if (entity === Driver) return txDriversRepo;
            return null;
          },
        });
      txQueue = txQueue.then(run, run);
      return txQueue;
    },
  };

  const jobsGatewayMock = {
    broadcastJobCreated: jest.fn(),
    broadcastJobAssigned: jest.fn(),
    broadcastJobStatusChanged: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: getRepositoryToken(Job), useValue: jobsRepoMock },
        { provide: getRepositoryToken(Driver), useValue: driversRepoMock },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: JobsGateway, useValue: jobsGatewayMock },
      ],
    }).compile();

    jobsService = moduleRef.get(JobsService);
  });

  it('allows only one assignment under concurrent attempts', async () => {
    const [r1, r2] = await Promise.allSettled([jobsService.assign('job-1'), jobsService.assign('job-1')]);

    const fulfilled = [r1, r2].filter((r) => r.status === 'fulfilled');
    const rejected = [r1, r2].filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(ConflictException);
    expect(jobs[0].assignedDriverId).toBe('driver-1');
    expect(drivers[0].status).toBe(DriverStatus.RESERVED);
  });
});
