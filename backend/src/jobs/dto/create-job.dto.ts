import { IsDateString, IsLatitude, IsLongitude, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateJobDto {
  @IsUUID()
  customerId: string;

  @IsString()
  pickupAddress: string;

  @IsString()
  dropoffAddress: string;

  @IsOptional()
  @IsLatitude()
  pickupLatitude?: number;

  @IsOptional()
  @IsLongitude()
  pickupLongitude?: number;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}
