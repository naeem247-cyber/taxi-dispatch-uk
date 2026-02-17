import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Account } from './account.entity';
import { Vehicle } from './vehicle.entity';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id', unique: true })
  accountId: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'phone_number', unique: true })
  phoneNumber: string;

  @Column({ default: true })
  available: boolean;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ name: 'last_gps_at', type: 'timestamptz', nullable: true })
  lastGpsAt?: Date;

  @OneToOne(() => Account, (account) => account.driver)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.drivers, { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: Vehicle;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
