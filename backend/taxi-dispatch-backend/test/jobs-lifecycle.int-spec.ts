import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JobsService } from '../src/jobs/jobs.service';
import { Job } from '../src/database/entities/job.entity';
import { Driver } from '../src/database/entities/driver.entity';
import { JobStatus } from '../src/common/enums/job-status.enum';
import { JobsGateway } from '../src/jobs/jobs.gateway';
import { DriverStatus } from '../src/common/enums/driver-status.enum';
import { PinoLogger } from 'nestjs-pino';

describe('Jobs lifecycle integration', () => {
  let jobsService: JobsService;

  const jobs: any[] = [];
  const drivers: any[] = [
    {
      id: 'driver-1',
      accountId: 'driver-account-1',
      status: DriverStatus.AVAILABLE,
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
    save: async (driver: any) => {
      const idx = drivers.findIndex((d) => d.id === driver.id);
      if (idx >= 0) drivers[idx] = { ...drivers[idx], ...driver };
      return driver;
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
        andWhere: () => builder,
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

  const dataSourceMock = {
    transaction: async (work: (manager: any) => Promise<any>) =>
      work({
        getRepository: (entity: any) => {
          if (entity === Job) return txJobsRepo;
          if (entity === Driver) return txDriversRepo;
          return null;
        },
      }),
  };

  const jobsGatewayMock = {
    broadcastJobCreated: jest.fn(),
    broadcastJobAssigned: jest.fn(),
    broadcastJobStatusChanged: jest.fn(),
  };

  const loggerMock = {
    setContext: jest.fn(),
    info: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: getRepositoryToken(Job), useValue: jobsRepoMock },
        { provide: getRepositoryToken(Driver), useValue: driversRepoMock },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: JobsGateway, useValue: jobsGatewayMock },
        { provide: PinoLogger, useValue: loggerMock },
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
