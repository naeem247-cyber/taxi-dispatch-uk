import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { JobStatus } from '../../common/enums/job-status.enum';
import { Customer } from './customer.entity';
import { Driver } from './driver.entity';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'pickup_address' })
  pickupAddress: string;

  @Column({ name: 'dropoff_address' })
  dropoffAddress: string;

  @Column({ name: 'pickup_latitude', type: 'numeric', precision: 10, scale: 7, nullable: true })
  pickupLatitude?: number;

  @Column({ name: 'pickup_longitude', type: 'numeric', precision: 10, scale: 7, nullable: true })
  pickupLongitude?: number;

  @Column({ name: 'scheduled_for', type: 'timestamptz', nullable: true })
  scheduledFor?: Date;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.REQUESTED })
  status: JobStatus;

  @Column({ name: 'assigned_driver_id', nullable: true })
  assignedDriverId?: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'assigned_driver_id' })
  assignedDriver?: Driver;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
