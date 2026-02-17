import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Driver } from './driver.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  plate: string;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column({ default: 4 })
  capacity: number;

  @Column({ name: 'private_hire_licence_no', unique: true })
  privateHireLicenceNo: string;

  @OneToMany(() => Driver, (driver) => driver.vehicle)
  drivers: Driver[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
