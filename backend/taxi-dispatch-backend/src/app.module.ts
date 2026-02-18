import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';

import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { DriversModule } from './drivers/drivers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { CustomersModule } from './customers/customers.module';
import { JobsModule } from './jobs/jobs.module';
import { RecurringJobsModule } from './recurring-jobs/recurring-jobs.module';

import { Account } from './database/entities/account.entity';
import { Driver } from './database/entities/driver.entity';
import { Vehicle } from './database/entities/vehicle.entity';
import { Customer } from './database/entities/customer.entity';
import { Job } from './database/entities/job.entity';
import { RecurringJob } from './database/entities/recurring-job.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    LoggerModule.forRoot(), // ← required for PinoLogger

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        entities: [
          Account,
          Driver,
          Vehicle,
          Customer,
          Job,
          RecurringJob,
        ],
        synchronize: false,
      }),
    }),

    HealthModule,
    AuthModule,
    AccountsModule,
    DriversModule,
    VehiclesModule,
    CustomersModule,
    JobsModule,
    RecurringJobsModule,
  ],
})
export class AppModule {}
